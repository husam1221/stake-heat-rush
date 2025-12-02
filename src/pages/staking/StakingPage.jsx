// src/pages/staking/StakingPage.jsx
import React, { useState, useEffect } from "react";
import {
  useAccount,
  useBalance,
  useSendTransaction,
  useReadContract,
  usePublicClient,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import {
  BASE_CHAIN_ID,
  STAKING_CONTRACT_ADDRESS,
} from "../../lib/constants.js";
import { STAKING_ABI } from "../../lib/staking.js";
import { qualifyReferral } from "../../lib/referralApi.js";

import "../../styles/staking.css";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// فورمات ETH بأربعة أرقام بعد الفاصلة
const formatEth = (value) => {
  const num = Number(value || 0);
  if (!isFinite(num)) return "0.0000";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
};

const formatShortAddress = (addr) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

const getLevelInfo = (level) => {
  switch (level) {
    case 1:
      return { label: "Bronze", desc: "Stake ≥ 0.10 ETH to reach Bronze." };
    case 2:
      return { label: "Silver", desc: "Stake ≥ 0.50 ETH to reach Silver." };
    case 3:
      return { label: "Gold", desc: "Stake ≥ 1.00 ETH to reach Gold." };
    default:
      return {
        label: "No Tier Yet",
        desc: "Stake ETH to unlock your first tier and boost your rewards.",
      };
  }
};

const StakingPage = ({ showToast }) => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: BASE_CHAIN_ID });

  // ===== WALLET BALANCE =====
  const { data } = useBalance({
    address,
    chainId: BASE_CHAIN_ID,
    watch: true,
  });

  const userBalance = data?.formatted
    ? Number(data.formatted).toFixed(6)
    : "0.0000";

  const { sendTransactionAsync } = useSendTransaction();

  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ===== ON-CHAIN METRICS (من العقد) =====
  const { data: totalStakedData } = useReadContract({
    abi: STAKING_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "totalStaked",
  });

  const tvlEth = totalStakedData ? Number(formatEther(totalStakedData)) : 0;

  const { data: userStakedData } = useReadContract({
    abi: STAKING_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "userStaked",
    args: [address || ZERO_ADDRESS],
  });

  const userStakedEth = userStakedData
    ? Number(formatEther(userStakedData))
    : 0;

  const { data: totalXPData } = useReadContract({
    abi: STAKING_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "getTotalXP",
    args: [address || ZERO_ADDRESS],
  });

  const userXP = totalXPData ? Number(totalXPData) : 0;

  const { data: levelData } = useReadContract({
    abi: STAKING_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "level",
    args: [address || ZERO_ADDRESS],
  });

  const userLevel =
    typeof levelData === "number" ? levelData : Number(levelData || 0);
  const levelInfo = getLevelInfo(userLevel);

  // نجيب كل الستيكَرز للـ leaderboard
  const { data: stakersData } = useReadContract({
    abi: STAKING_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "getAllStakers",
  });

  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        if (!publicClient) return;

        if (!stakersData || !Array.isArray(stakersData)) {
          setLeaderboard([]);
          return;
        }

        if (stakersData.length === 0) {
          setLeaderboard([]);
          return;
        }

        setLeaderboardLoading(true);
        setLeaderboardError(null);

        const addresses = stakersData;

        // نقرأ userStaked لكل عنوان
        const stakePromises = addresses.map((addr) =>
          publicClient.readContract({
            abi: STAKING_ABI,
            address: STAKING_CONTRACT_ADDRESS,
            functionName: "userStaked",
            args: [addr],
          })
        );

        const stakesRaw = await Promise.all(stakePromises);

        const rows = addresses
          .map((addr, idx) => {
            const amountEth = stakesRaw[idx]
              ? Number(formatEther(stakesRaw[idx]))
              : 0;
            return { address: addr, amountEth };
          })
          .filter((row) => row.amountEth > 0);

        rows.sort((a, b) => b.amountEth - a.amountEth);

        setLeaderboard(rows.slice(0, 10));
      } catch (err) {
        console.error(err);
        setLeaderboardError("Failed to load leaderboard.");
      } finally {
        setLeaderboardLoading(false);
      }
    };

    loadLeaderboard();
  }, [publicClient, stakersData]);

  // ===== HANDLERS =====

  const handleMax = () => {
    const bal = parseFloat(userBalance);
    if (!isNaN(bal) && bal > 0) {
      setAmount(bal.toFixed(4));
    } else {
      showToast?.("info", "No ETH balance available on Base.");
    }
  };

  const handleStake = async () => {
    if (!isConnected) {
      showToast?.("error", "Please connect your wallet first.");
      return;
    }

    const ethValue = Number(amount);
    if (!ethValue || ethValue <= 0) {
      showToast?.("error", "Enter a valid ETH amount.");
      return;
    }

    try {
      setIsLoading(true);

      const tx = await sendTransactionAsync({
        to: STAKING_CONTRACT_ADDRESS,
        value: parseEther(amount),
      });

      setIsLoading(false);
      setAmount("");

      showToast?.("success", "Transaction sent successfully!");

      // 👇 هون نفعل الإحالة عن طريق الستايكنغ (stake)
      try {
        if (address) {
          qualifyReferral(address.toLowerCase(), "stake").catch((err) => {
            console.error("Failed to qualify referral via stake:", err);
          });
        }
      } catch (e) {
        console.error("Local qualifyReferral(stake) error:", e);
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      showToast?.("error", error.shortMessage || error.message);
    }
  };

  const formatXP = (value) => {
    const num = Number(value || 0);
    if (!isFinite(num)) return "0";

    return num.toLocaleString("en-US", {
      minimumFractionDigits: 1, // أقل شيء رقم بعد الفاصلة
      maximumFractionDigits: 4, // أقصى شيء 4 أرقام بعد الفاصلة
    });
  };

  return (
    <div className="staking-page">
      <div className="staking-grid">
        {/* ===== Hero Card ===== */}
        <div className="card staking-card staking-hero">
          <div className="staking-hero-header">
            <div className="hero-title-wrap">
              <h1 className="hero-title">
                <span className="hero-title-highlight">HeatRush Staking</span>
              </h1>
              <p className="hero-subtitle">
                Lock ETH into HeatRush on <span className="orange">Base</span>{" "}
                and position yourself for future $HR rewards, airdrops, and
                priority access.
              </p>
            </div>
          </div>

          <div className="hero-tags-row">
            <span className="hero-pill accent">Live on Base</span>
            <span className="hero-pill subtle">On-chain ETH staking</span>
            <span className="hero-pill subtle">XP &amp; tiers</span>
          </div>

          <p className="hero-note">
            Every ETH staked powers the HeatRush treasury and strengthens the{" "}
            <span className="orange-text">Heat Network</span>. Top stakers get
            the strongest exposure to future rewards, airdrops, and special
            allocations.
          </p>
          <p className="hero-note">
            <strong>
              If you’re not staked when major events go live, you’re simply not
              in the front row.
            </strong>
          </p>
        </div>

        {/* ===== Wallet / On-chain Status Card ===== */}
        <div className="card staking-card staking-status">
          <h2 className="card-title">Your Staking Snapshot</h2>

      

          <div className="status-row">
            <span className="status-label">You Staked</span>
            <span className="status-value highlight">
              {formatEth(userStakedEth)}{" "}
              <span className="status-unit">ETH</span>
            </span>
          </div>

          <div className="status-row">
            <span className="status-label">Your Total XP</span>
            <span className="status-value">
              {formatXP(userXP)}
            </span>
          </div>

          <div className="status-row">
            <span className="status-label">Your Tier</span>
            <span className="status-value">
              <span className="status-chip">{levelInfo.label}</span>
            </span>
          </div>

          <div className="status-row">
            <span className="status-label">Wallet Balance (Base)</span>
            <span className="status-value">
              {userBalance} <span className="status-unit">ETH</span>
            </span>
          </div>

          <p className="status-note">
            All stats are read live from the HeatRush staking contract on Base.
            Your stake is your live contribution to the HeatRush ecosystem.
          </p>
        </div>

        {/* ===== Stake Action Card ===== */}
        <div className="card staking-card staking-action">
          <h2 className="card-title">Stake ETH</h2>
          <p className="card-subtitle">
            Staking is executed directly through HeatRush’s secure on-chain
            contract.
          </p>

          <div className="stake-input-block">
            <div className="stake-input-header">
              <span className="stake-label">Amount to stake</span>
              <span className="stake-hint">
                Enter the amount of ETH you want to lock into HeatRush.
              </span>
            </div>

            <div className="input-row">
              <input
                type="text"
                inputMode="decimal"
                className="input"
                placeholder="Enter ETH amount"
                value={amount}
                onChange={(e) => {
                  const raw = e.target.value.replace(",", ".");
                  const regex = /^[0-9]*\.?[0-9]*$/;
                  if (raw === "" || regex.test(raw)) {
                    setAmount(raw);
                  }
                }}
              />
              <button className="max-btn" onClick={handleMax}>
                MAX
              </button>
            </div>
          </div>

          <button
            className={`stake-btn ${isLoading ? "loading" : ""}`}
            onClick={handleStake}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Stake ETH"}
          </button>

          <div className="secondary-actions">
            <button
              className="secondary-btn"
              onClick={() =>
                showToast?.(
                  "info",
                  "Claiming rewards will be enabled in a future phase."
                )
              }
            >
              Claim Rewards
            </button>

            <button
              className="secondary-btn"
              onClick={() =>
                showToast?.(
                  "info",
                  "Unstaking will be introduced in a later stage."
                )
              }
            >
              Unstake (coming later)
            </button>
          </div>

          <p className="stake-footnote">
            Withdrawals and advanced reward mechanics will be enabled in
            upcoming development phases. Early stakers are the first to benefit
            when new features go live.
          </p>
        </div>

        {/* ===== XP & Levels Card ===== */}
        <div className="card staking-card staking-xp-info">
          <h2 className="card-title">Your XP & Levels</h2>

          <p className="xp-intro">
            XP boosts your weight for airdrops, future campaigns, and on-chain
            reputation. It can also be referenced by future Heat ecosystem apps.
          </p>

          <div className="xp-formula-box">
            <div className="xp-formula-label">On-chain XP</div>
            <div className="xp-formula-code">
              Total XP: {formatXP(userXP)}
            </div>
            <p className="xp-formula-note">
              XP is tracked directly by the HeatRush staking contract and grows
              alongside your long-term participation.
            </p>
          </div>

          <div className="xp-levels-grid">
            <div className="xp-level-card bronze">
              <div className="xp-level-title">Bronze</div>
              <div className="xp-level-threshold">Stake ≥ 0.10 ETH</div>
              <p className="xp-level-desc">
                Stake ≥ 0.10 ETH to reach Bronze and unlock your first tier.
              </p>
            </div>

            <div className="xp-level-card silver">
              <div className="xp-level-title">Silver</div>
              <div className="xp-level-threshold">Stake ≥ 0.50 ETH</div>
              <p className="xp-level-desc">
                Stake ≥ 0.50 ETH to reach Silver and strengthen your position in
                future HeatRush campaigns.
              </p>
            </div>

            <div className="xp-level-card gold">
              <div className="xp-level-title">Gold</div>
              <div className="xp-level-threshold">Stake ≥ 1.00 ETH</div>
              <p className="xp-level-desc">
                Stake ≥ 1.00 ETH to reach Gold and sit in the front row for
                future rewards and allocations.
              </p>
            </div>
          </div>
        </div>

        {/* ===== Why Stake Card ===== */}
        <div className="card staking-card staking-why">
          <h2 className="card-title">Why stake with HeatRush?</h2>

          <ul className="why-list">
            <li>
              <span className="dot" />
              <span>
                Priority exposure to future $HR distributions and bonuses.
              </span>
            </li>
            <li>
              <span className="dot" />
              <span>
                Stronger position in upcoming HeatRush campaigns, quests, and
                loyalty programs.
              </span>
            </li>
            <li>
              <span className="dot" />
              <span>
                On-chain XP and tiers that can be referenced by future Heat
                ecosystem apps.
              </span>
            </li>
          </ul>
        </div>
 </div>
        {/* ===== Top Stakers Leaderboard ===== */}
        <div className="card staking-card staking-leaderboard">
          <h2 className="card-title">Top Stakers</h2>
          <p className="card-subtitle">
            Addresses with the highest total ETH staked into HeatRush.
          </p>

          {leaderboardLoading && (
            <p className="staking-leaderboard-note">Loading leaderboard...</p>
          )}

          {leaderboardError && !leaderboardLoading && (
            <p className="staking-leaderboard-error">{leaderboardError}</p>
          )}

          {!leaderboardLoading &&
            !leaderboardError &&
            leaderboard.length === 0 && (
              <p className="staking-leaderboard-note">
                No staking activity yet. Be the first to appear on the
                leaderboard.
              </p>
            )}

          {!leaderboardLoading &&
            !leaderboardError &&
            leaderboard.length > 0 && (
              <ul className="staking-leaderboard-list">
                {leaderboard.map((row, index) => {
                  const isYou =
                    address &&
                    row.address &&
                    row.address.toLowerCase() === address.toLowerCase();

                  return (
                    <li
                      key={row.address}
                      className={`staking-leaderboard-row ${
                        isYou ? "staking-leaderboard-row-you" : ""
                      }`}
                    >
                      <span className="staking-leader-rank">
                        {index + 1}
                      </span>

                      <span className="staking-leader-address">
                        <span className="staking-leader-wallet">
                          {formatShortAddress(row.address)}
                        </span>
                        {isYou && (
                          <span className="staking-leader-you-pill">
                            YOU
                          </span>
                        )}
                      </span>

                      <span className="staking-leader-amount">
                        {formatEth(row.amountEth)}{" "}
                        <span className="status-unit">ETH</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
     

       
      </div>
    </div>
  );
};

export default StakingPage;
