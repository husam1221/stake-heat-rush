// src/pages/staking/StakingPage.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  useAccount,
  useBalance,
  useSendTransaction,
  useReadContract,
  useWriteContract,
  usePublicClient,
  useSwitchChain,
} from "wagmi";
import { parseEther, formatEther, parseUnits, formatUnits } from "viem";

import useMultichainStakingAsset from "../../hooks/useMultichainStakingAsset.js";
import {
  MULTICHAIN_STAKING_ASSETS,
  MULTICHAIN_STAKING_READ_ABI,
  MULTICHAIN_NATIVE_STAKING_ABI,
  MULTICHAIN_ERC20_STAKING_ABI,
  MULTICHAIN_ERC20_TOKEN_ABI,
  ZERO_ADDRESS as MULTICHAIN_ZERO_ADDRESS,
} from "../../lib/multichainStaking.js";

import {
  BASE_CHAIN_ID,
  BSC_CHAIN_ID,
  STAKING_CONTRACT_ADDRESS,
  FEE_DISTRIBUTOR_ADDRESS,
  HR_TOKEN_ADDRESS,
  HR_STAKING_CONTRACT_ADDRESS,
  ETH_HR_REWARDS_CONTRACT_ADDRESS,
} from "../../lib/constants.js";

import { STAKING_ABI } from "../../lib/staking.js";
import { FEE_DISTRIBUTOR_ABI } from "../../lib/fees";
import { HR_STAKING_ABI } from "../../lib/hrStaking.js";
import { ETH_HR_REWARDS_ABI } from "../../lib/ethHrRewards.js";
import { ERC20_ABI } from "../../lib/erc20.js";

import { qualifyReferral } from "../../lib/referralApi.js";
import { syncOnchainXpApi } from "../../lib/xpApi.js";
import TokensImg from "../../assets/Tokens.png";

import "../../styles/staking.css";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// ====== 3D TILT HANDLERS (خفيف/أنيق) ======
const handleTierTiltMove = (e) => {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();

  const x = e.clientX - r.left;
  const y = e.clientY - r.top;

  const px = x / r.width; // 0..1
  const py = y / r.height; // 0..1

  // ميلان خفيف (إلغاء الميلان القوي)
  const ry = (px - 0.5) * 8; // يمين/يسار
  const rx = (py - 0.5) * -6; // فوق/تحت

  el.style.setProperty("--rx", `${rx}deg`);
  el.style.setProperty("--ry", `${ry}deg`);
  el.style.setProperty("--gx", `${px * 100}%`);
  el.style.setProperty("--gy", `${py * 100}%`);
  el.classList.add("is-tilting");
};

const handleTierTiltLeave = (e) => {
  const el = e.currentTarget;
  el.style.setProperty("--rx", `1deg`);
  el.style.setProperty("--ry", `0deg`);
  el.style.setProperty("--gx", `20%`);
  el.style.setProperty("--gy", `0%`);
  el.classList.remove("is-tilting");
};

// فورمات ETH بأربعة أرقام بعد الفاصلة
const formatEth = (value) => {
  const num = Number(value || 0);
  if (!isFinite(num)) return "0.0000";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
};

const formatNum = (value, decimals = 2) => {
  const num = Number(value || 0);
  if (!isFinite(num)) return "0";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

const formatShortAddress = (addr) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

const getLevelInfo = (level, userStakedEth = 0) => {
  // ✅ UI-only Platinum tier for 3 ETH+
  if (Number(userStakedEth || 0) >= 3) {
    return { label: "Platinum", desc: "Stake ≥ 3.00 ETH to reach Platinum." };
  }

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


// ===== HR Tier / Multiplier (واجهة فقط) =====
const getHrMultiplierInfo = (hrAmount) => {
  const amt = Number(hrAmount || 0);

  // نفس الشرائح اللي اتفقنا عليها
  if (amt >= 200_000) return { mult: 2.0, label: "Elite", nextTarget: null };
  if (amt >= 100_000)
    return { mult: 1.65, label: "Diamond", nextTarget: 200_000 };
  if (amt >= 50_000)
    return { mult: 1.35, label: "Platinum", nextTarget: 100_000 };
  if (amt >= 10_000) return { mult: 1.15, label: "Silver", nextTarget: 50_000 };
  return { mult: 1.0, label: "Starter", nextTarget: 10_000 };
};

// ===== Multi-chain milestone targets (UI only) =====
// These targets are visual progress goals only. They do not alter staking contracts.
const MULTICHAIN_MILESTONE_TARGETS = {
  BNB: 70,
  BTCB: 1.5,
  USDT: 100_000,
  USDC: 100_000,
};

const getMilestoneDisplayDecimals = (symbol) => {
  if (symbol === "BTCB") return 4;
  if (symbol === "BNB") return 2;
  return 0;
};

// ===== Community leaderboard markets =====
// HR stays visible as a tab, but its current staking ABI does not expose
// a complete staker-address list, so we do not fabricate a ranking for it.
const LEADERBOARD_MARKETS = [
  { key: "eth-base", label: "ETH", symbol: "ETH", chainId: BASE_CHAIN_ID, decimals: 18, legacyEth: true },
  { key: "hr-base", label: "HR", symbol: "HR", chainId: BASE_CHAIN_ID, decimals: 18, unavailable: true },
  { key: "usdc-base", label: "USDC • BASE", symbol: "USDC", chainId: BASE_CHAIN_ID, decimals: 6 },
  { key: "bnb-bsc", label: "BNB", symbol: "BNB", chainId: BSC_CHAIN_ID, decimals: 18 },
  { key: "btcb-bsc", label: "BTCB", symbol: "BTCB", chainId: BSC_CHAIN_ID, decimals: 18 },
  { key: "usdt-bsc", label: "USDT", symbol: "USDT", chainId: BSC_CHAIN_ID, decimals: 18 },
  { key: "usdc-bsc", label: "USDC • BNB", symbol: "USDC", chainId: BSC_CHAIN_ID, decimals: 18 },
];


const MultichainAssetCard = ({ asset, showToast }) => {
  const data = useMultichainStakingAsset(asset);
  const { chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: asset.chainId });

  const [expanded, setExpanded] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const milestoneTarget = MULTICHAIN_MILESTONE_TARGETS[asset.symbol] ?? null;

  const userStakedNumber = useMemo(() => {
    try {
      return Number(formatUnits(data.userStakedRaw || 0n, asset.decimals));
    } catch {
      return 0;
    }
  }, [data.userStakedRaw, asset.decimals]);

  const milestoneProgressPct = useMemo(() => {
    if (!milestoneTarget || milestoneTarget <= 0) return 0;
    return Math.max(
      0,
      Math.min(100, (userStakedNumber / milestoneTarget) * 100)
    );
  }, [userStakedNumber, milestoneTarget]);

  const milestoneRemaining = useMemo(() => {
    if (!milestoneTarget) return 0;
    return Math.max(0, milestoneTarget - userStakedNumber);
  }, [userStakedNumber, milestoneTarget]);

  const parsedAmount = useMemo(() => {
    const raw = String(stakeAmount || "").trim().replace(",", ".");
    if (!raw || !/^\d*\.?\d+$/.test(raw)) return null;
    try {
      return parseUnits(raw, asset.decimals);
    } catch {
      return null;
    }
  }, [stakeAmount, asset.decimals]);

  const setPercentage = (pct) => {
    const balance = data.walletBalanceRaw || 0n;
    if (balance <= 0n) {
      setStakeAmount("");
      return;
    }

    let target = (balance * BigInt(pct)) / 100n;

    // Native BNB MAX must leave a small gas reserve.
    if (asset.native && pct === 100) {
      const gasReserve = parseUnits("0.002", asset.decimals);
      target = balance > gasReserve ? balance - gasReserve : 0n;
    }

    setStakeAmount(target > 0n ? formatUnits(target, asset.decimals) : "");
  };

  const ensureCorrectNetwork = async () => {
    if (chainId === asset.chainId) return true;
    try {
      await switchChainAsync({ chainId: asset.chainId });
      return true;
    } catch (error) {
      console.error(error);
      showToast?.("error", `Please switch your wallet to ${asset.network}.`);
      return false;
    }
  };

  const waitForHash = async (hash) => {
    if (!hash || !publicClient) return;
    await publicClient.waitForTransactionReceipt({ hash });
  };

  const handleNewStake = async () => {
    if (!data.isConnected) {
      showToast?.("info", "Connect your wallet first.");
      return;
    }

    if (data.hasError) {
      showToast?.("error", `${asset.symbol} contract data is currently unavailable.`);
      return;
    }

    if (data.isPaused) {
      showToast?.("info", `${asset.symbol} staking is currently paused.`);
      return;
    }

    if (!parsedAmount || parsedAmount <= 0n) {
      showToast?.("error", `Enter a valid ${asset.symbol} amount.`);
      return;
    }

    if (parsedAmount < data.minStakeRaw) {
      showToast?.("error", `Minimum stake is ${data.minStake} ${asset.symbol}.`);
      return;
    }

    if (parsedAmount > data.walletBalanceRaw) {
      showToast?.("error", `Insufficient ${asset.symbol} balance.`);
      return;
    }

    const networkReady = await ensureCorrectNetwork();
    if (!networkReady) return;

    try {
      setIsSubmitting(true);

      if (asset.native) {
        const hash = await writeContractAsync({
          address: asset.stakingAddress,
          abi: MULTICHAIN_NATIVE_STAKING_ABI,
          functionName: "stake",
          args: [MULTICHAIN_ZERO_ADDRESS],
          value: parsedAmount,
          chainId: asset.chainId,
        });
        await waitForHash(hash);
      } else {
        const allowance = await publicClient.readContract({
          address: asset.tokenAddress,
          abi: MULTICHAIN_ERC20_TOKEN_ABI,
          functionName: "allowance",
          args: [data.address, asset.stakingAddress],
        });

        if (allowance < parsedAmount) {
          showToast?.("info", `Approve ${asset.symbol} first in your wallet.`);
          const approveHash = await writeContractAsync({
            address: asset.tokenAddress,
            abi: MULTICHAIN_ERC20_TOKEN_ABI,
            functionName: "approve",
            args: [asset.stakingAddress, parsedAmount],
            chainId: asset.chainId,
          });
          await waitForHash(approveHash);
        }

        const stakeHash = await writeContractAsync({
          address: asset.stakingAddress,
          abi: MULTICHAIN_ERC20_STAKING_ABI,
          functionName: "stake",
          args: [MULTICHAIN_ZERO_ADDRESS, parsedAmount],
          chainId: asset.chainId,
        });
        await waitForHash(stakeHash);
      }

      showToast?.("success", `${asset.symbol} stake confirmed on ${asset.network}.`);
      setStakeAmount("");
      await data.refetch();
    } catch (error) {
      console.error(`${asset.id} stake failed`, error);
      showToast?.("error", `${asset.symbol} staking failed or was rejected.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusLabel = data.hasError
    ? "READ ERROR"
    : data.isLoading
      ? "LOADING"
      : data.status;

  return (
    <div className={`multistake-card ${data.hasError ? "has-error" : ""}`}>
      <div className="multistake-card-head">
        <div className="multistake-asset-id">
          <div className="multistake-logo-wrap">
            <img src={asset.assetLogo} alt={asset.symbol} className="multistake-asset-logo" />
            <img src={asset.networkLogo} alt={asset.network} className="multistake-network-logo" />
          </div>
          <div>
            <div className="multistake-symbol">{asset.symbol}</div>
            <div className="multistake-network">{asset.network}</div>
          </div>
        </div>
        <span className={`multistake-status ${data.hasError ? "error" : data.isPaused ? "paused" : ""}`}>
          {statusLabel}
        </span>
      </div>



<div className="multistake-reward-line">{asset.rewardHeadline}</div>

{asset.id === "usdc-base" && (
  <div className="multistake-reward-line">5% – 30% APY</div>
)}

<p className="multistake-copy">{asset.rewardText}</p>

{asset.id === "bnb-bsc" && (
  <div className="multistake-reward-line">17% – 32.5% APY</div>
)}

{asset.id === "btcb-bsc" && (
  <div className="multistake-reward-line">18% – 37% APY</div>
)}

{asset.id === "usdt-bsc" && (
  <div className="multistake-reward-line">6% – 33% APY</div>
)}

{asset.id === "usdc-bsc" && (
  <div className="multistake-reward-line">7.4% – 29% APY</div>
)}




      <div className="multistake-stats">
        <div><span>Wallet Balance</span><strong>{data.isConnected ? data.walletBalance : "—"} {data.isConnected ? asset.symbol : ""}</strong></div>
        <div><span>Your Staked</span><strong>{data.isConnected ? data.userStaked : "—"} {data.isConnected ? asset.symbol : ""}</strong></div>
        <div><span>XP Earned</span><strong>{data.isConnected ? data.totalXp : "—"}</strong></div>
        <div><span>Total Staked</span><strong>{data.totalStaked} {asset.symbol}</strong></div>
      </div>

      {milestoneTarget && (
        <div className="multistake-milestone-box">
          <div className="multistake-milestone-head">
            <span>
              Next milestone: {formatNum(
                milestoneTarget,
                getMilestoneDisplayDecimals(asset.symbol)
              )} {asset.symbol}
            </span>
            <strong>{formatNum(milestoneProgressPct, 1)}%</strong>
          </div>

          <div className="multistake-milestone-track">
            <div
              className="multistake-milestone-fill"
              style={{ width: `${milestoneProgressPct}%` }}
            />
          </div>

          <p>
            {formatNum(
              milestoneRemaining,
              getMilestoneDisplayDecimals(asset.symbol)
            )} {asset.symbol} to the next milestone.
          </p>
        </div>
      )}

      <div className="multistake-reward-actions">
        <button
          type="button"
          className="multistake-reward-btn"
          disabled
          title="HR reward claiming will be connected in a future update."
        >
          Claim HR Rewards
        </button>
        <button
          type="button"
          className="multistake-reward-btn"
          disabled
          title={`${asset.symbol} reward claiming will be connected in a future update.`}
        >
          Claim {asset.symbol} Rewards
        </button>
      </div>
      <div className="multistake-reward-coming-soon">
        Reward claims will activate in a future contract update.
      </div>

      {data.hasError && (
        <div className="multistake-error-box">
          New contract data could not be read. Legacy HeatRush staking remains separate.
        </div>
      )}

      <button
        type="button"
        className="multistake-open-btn"
        onClick={() => setExpanded((value) => !value)}
        disabled={data.hasError}
      >
        {expanded ? "Close" : `Stake ${asset.symbol}`}
      </button>

      {expanded && !data.hasError && (
        <div className="multistake-panel">
          <div className="multistake-minimum">Minimum: {data.minStake} {asset.symbol}</div>
          <input
            className="multistake-input"
            type="text"
            inputMode="decimal"
            placeholder={`Enter ${asset.symbol} amount`}
            value={stakeAmount}
            onChange={(event) => {
              const raw = event.target.value.replace(",", ".");
              if (raw === "" || /^\d*\.?\d*$/.test(raw)) setStakeAmount(raw);
            }}
          />
          <div className="multistake-percent-row">
            {[25, 50, 75, 100].map((pct) => (
              <button key={pct} type="button" onClick={() => setPercentage(pct)}>
                {pct === 100 ? "MAX" : `${pct}%`}
              </button>
            ))}
          </div>
          {asset.native && (
            <div className="multistake-gas-note">MAX keeps a small BNB reserve for network gas.</div>
          )}
          <button
            type="button"
            className="multistake-confirm-btn"
            onClick={handleNewStake}
            disabled={isSubmitting || data.isPaused}
          >
            {isSubmitting ? "Processing..." : chainId === asset.chainId ? `Confirm ${asset.symbol} Stake` : `Switch to ${asset.network} & Stake`}
          </button>
        </div>
      )}
    </div>
  );
};

const StakingPage = ({ showToast }) => {
  const { address, isConnected, chainId } = useAccount();

  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();

  // ===== ETH WALLET BALANCE =====
  const { data: ethBalData } = useBalance({
    address,
    chainId: BASE_CHAIN_ID,
    watch: true,
  });

  const userBalance = ethBalData?.formatted
    ? Number(ethBalData.formatted).toFixed(6)
    : "0.0000";

  // ===== HR WALLET BALANCE =====
  const { data: hrBalData } = useBalance({
    address,
    chainId: BASE_CHAIN_ID,
    token: HR_TOKEN_ADDRESS,
    watch: true,
  });

  const hrWalletBalance = hrBalData?.formatted
    ? Number(hrBalData.formatted).toFixed(4)
    : "0.0000";

  // ===== Token decimals (للاحتياط) =====
  const { data: hrDecimalsData } = useReadContract({
    abi: ERC20_ABI,
    address: HR_TOKEN_ADDRESS,
    functionName: "decimals",
  });

  const HR_DECIMALS =
    typeof hrDecimalsData === "number"
      ? hrDecimalsData
      : Number(hrDecimalsData || 18);

  // ===== Local UI state =====
  const [amount, setAmount] = useState(""); // ETH stake input
  const [hrAmount, setHrAmount] = useState(""); // HR stake input

  const [isLoading, setIsLoading] = useState(false); // ETH stake
  const [isClaiming, setIsClaiming] = useState(false); // fee distributor claim (old)
  const [showNoRewardsBubble, setShowNoRewardsBubble] = useState(false);

  const [isHrStaking, setIsHrStaking] = useState(false);
  const [isHrClaiming, setIsHrClaiming] = useState(false);
  const [isEthHrClaiming, setIsEthHrClaiming] = useState(false);
  const [isApprovingHr, setIsApprovingHr] = useState(false);

  const claimButtonRef = useRef(null);

  // لو جينا على الصفحة مع #claim ننزل مباشرة لزر المطالبة
  useEffect(() => {
    if (window.location.hash === "#claim" && claimButtonRef.current) {
      claimButtonRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, []);

  // ===== ON-CHAIN METRICS (ETH STAKING) =====
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

  const userStakedEth = userStakedData ? Number(formatEther(userStakedData)) : 0;

  const { data: totalXPData } = useReadContract({
    abi: STAKING_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "getTotalXP",
    args: [address || ZERO_ADDRESS],
  });

  const userXP = totalXPData ? Number(totalXPData) : 0;

  // 🔄 مزامنة XP مع backend
  useEffect(() => {
    if (!address || !isConnected) return;

    const xpNumber = Number(userXP);
    if (!Number.isFinite(xpNumber) || xpNumber < 0) return;

    syncOnchainXpApi(address, xpNumber).catch((err) => {
      console.error("Failed to sync on-chain XP:", err);
    });
  }, [address, isConnected, userXP]);

  const { data: levelData } = useReadContract({
    abi: STAKING_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "level",
    args: [address || ZERO_ADDRESS],
  });

  const userLevel =
    typeof levelData === "number" ? levelData : Number(levelData || 0);
const levelInfo = getLevelInfo(userLevel, userStakedEth);



// ===== ETH Boost (UI only) =====
const ethNextTarget = useMemo(() => {
  if (userStakedEth >= 3) return null; // already Platinum
  if (userStakedEth >= 1) return 3;    // next is Platinum
  return 1;                            // next is Gold
}, [userStakedEth]);

const ethProgressPct = useMemo(() => {
  const target = ethNextTarget ?? 3;
  if (!target || target <= 0) return 100;
  return Math.max(0, Math.min(100, (userStakedEth / target) * 100));
}, [userStakedEth, ethNextTarget]);






  // ===== Multi-asset Community Leaderboard =====
  const [leaderboardMarketKey, setLeaderboardMarketKey] = useState("eth-base");

  const selectedLeaderboardMarket = useMemo(() => {
    const baseMarket =
      LEADERBOARD_MARKETS.find((market) => market.key === leaderboardMarketKey) ||
      LEADERBOARD_MARKETS[0];

    if (baseMarket.legacyEth || baseMarket.unavailable) return baseMarket;

    const asset = MULTICHAIN_STAKING_ASSETS.find(
      (item) => item.id === baseMarket.key
    );

    return asset
      ? { ...baseMarket, stakingAddress: asset.stakingAddress }
      : { ...baseMarket, unavailable: true };
  }, [leaderboardMarketKey]);

  const leaderboardPublicClient = usePublicClient({
    chainId: selectedLeaderboardMarket.chainId,
  });

  const leaderboardReadAddress = selectedLeaderboardMarket.legacyEth
    ? STAKING_CONTRACT_ADDRESS
    : selectedLeaderboardMarket.stakingAddress || STAKING_CONTRACT_ADDRESS;

  const leaderboardReadAbi = selectedLeaderboardMarket.legacyEth
    ? STAKING_ABI
    : MULTICHAIN_STAKING_READ_ABI;

  const { data: stakersData } = useReadContract({
    abi: leaderboardReadAbi,
    address: leaderboardReadAddress,
    functionName: "getAllStakers",
    chainId: selectedLeaderboardMarket.chainId,
    query: {
      enabled: !selectedLeaderboardMarket.unavailable,
    },
  });

  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadLeaderboard = async () => {
      if (selectedLeaderboardMarket.unavailable) {
        setLeaderboard([]);
        setLeaderboardLoading(false);
        setLeaderboardError(null);
        return;
      }

      try {
        if (!leaderboardPublicClient) return;

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

        const stakePromises = stakersData.map((addr) =>
          leaderboardPublicClient.readContract({
            abi: leaderboardReadAbi,
            address: leaderboardReadAddress,
            functionName: "userStaked",
            args: [addr],
          })
        );

        const stakesRaw = await Promise.all(stakePromises);

        const rows = stakersData
          .map((addr, idx) => {
            const amount = stakesRaw[idx]
              ? Number(
                  formatUnits(
                    stakesRaw[idx],
                    selectedLeaderboardMarket.decimals
                  )
                )
              : 0;
            return { address: addr, amount };
          })
          .filter((row) => row.amount > 0);

        rows.sort((a, b) => b.amount - a.amount);

        if (!cancelled) setLeaderboard(rows.slice(0, 10));
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setLeaderboardError("Failed to load leaderboard.");
          setLeaderboard([]);
        }
      } finally {
        if (!cancelled) setLeaderboardLoading(false);
      }
    };

    loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [
    leaderboardPublicClient,
    leaderboardReadAbi,
    leaderboardReadAddress,
    selectedLeaderboardMarket,
    stakersData,
  ]);

  // ===== FEE DISTRIBUTOR (old rewards) =====
  const { data: pendingRewardsData, refetch: refetchPendingRewards } =
    useReadContract({
      abi: FEE_DISTRIBUTOR_ABI,
      address: FEE_DISTRIBUTOR_ADDRESS,
      functionName: "pendingRewards",
      args: [address || ZERO_ADDRESS],
    });

  const pendingRewardsEth = pendingRewardsData
    ? Number(formatEther(pendingRewardsData))
    : 0;
  const hasRewards = pendingRewardsData && pendingRewardsData > 0n;

  // ===== HR STAKING (new) reads =====
  const { data: userHrDepositedRaw } = useReadContract({
    abi: HR_STAKING_ABI,
    address: HR_STAKING_CONTRACT_ADDRESS,
    functionName: "deposited",
    args: [address || ZERO_ADDRESS],
  });

  const userHrDeposited = userHrDepositedRaw
    ? Number(formatUnits(userHrDepositedRaw, HR_DECIMALS))
    : 0;

  const { data: pendingHrRewardsRaw, refetch: refetchPendingHrRewards } =
    useReadContract({
      abi: HR_STAKING_ABI,
      address: HR_STAKING_CONTRACT_ADDRESS,
      functionName: "pendingRewards",
      args: [address || ZERO_ADDRESS],
    });

  const pendingHrRewards = pendingHrRewardsRaw
    ? Number(formatUnits(pendingHrRewardsRaw, HR_DECIMALS))
    : 0;

  // ===== ETH STAKERS -> HR REWARDS reads =====
  const { data: pendingEthHrRaw, refetch: refetchPendingEthHr } = useReadContract({
    abi: ETH_HR_REWARDS_ABI,
    address: ETH_HR_REWARDS_CONTRACT_ADDRESS,
    functionName: "pendingRewards",
    args: [address || ZERO_ADDRESS],
  });

  const pendingEthHr = pendingEthHrRaw
    ? Number(formatUnits(pendingEthHrRaw, HR_DECIMALS))
    : 0;

  // ===== HR allowance for staking =====
  const hrToStakeWei = useMemo(() => {
    try {
      if (!hrAmount) return 0n;
      return parseUnits(hrAmount, HR_DECIMALS);
    } catch {
      return 0n;
    }
  }, [hrAmount, HR_DECIMALS]);

  const { data: allowanceRaw, refetch: refetchAllowance } = useReadContract({
    abi: ERC20_ABI,
    address: HR_TOKEN_ADDRESS,
    functionName: "allowance",
    args: [address || ZERO_ADDRESS, HR_STAKING_CONTRACT_ADDRESS],
  });

  const allowance = allowanceRaw ?? 0n;
  const needsApprove = hrToStakeWei > 0n && allowance < hrToStakeWei;

  // ===== Incentive calc (HR tiers) =====
  const hrTier = useMemo(
    () => getHrMultiplierInfo(userHrDeposited),
    [userHrDeposited]
  );

  const hrProgressToElite = useMemo(() => {
    const eliteTarget = 200_000;
    const pct = (userHrDeposited / eliteTarget) * 100;
    return Math.max(0, Math.min(100, pct));
  }, [userHrDeposited]);

  const hrToNextTier = useMemo(() => {
    if (!hrTier.nextTarget) return 0;
    return Math.max(0, hrTier.nextTarget - userHrDeposited);
  }, [hrTier, userHrDeposited]);

  // ===== HANDLERS =====
  const handleMax = () => {
    const bal = parseFloat(userBalance);
    if (!isNaN(bal) && bal > 0) {
      setAmount(bal.toFixed(4));
    } else {
      showToast?.("info", "No ETH balance available on Base.");
    }
  };

  const handleMaxHr = () => {
    const bal = parseFloat(hrWalletBalance);
    if (!isNaN(bal) && bal > 0) {
      setHrAmount(bal.toString());
    } else {
      showToast?.("info", "No HR balance available on Base.");
    }
  };

  const handleStake = async () => {
    if (!isConnected) {
      showToast?.("error", "Please connect your wallet first.");
      return;
    }

    if (chainId !== BASE_CHAIN_ID) {
      showToast?.("error", "Please switch to Base network.");
      return;
    }

    const ethValue = Number(amount);
    if (!ethValue || ethValue <= 0) {
      showToast?.("error", "Enter a valid ETH amount.");
      return;
    }

    try {
      setIsLoading(true);

      await sendTransactionAsync({
        to: STAKING_CONTRACT_ADDRESS,
        value: parseEther(amount),
      });

      setIsLoading(false);
      setAmount("");

      showToast?.("success", "Transaction sent successfully!");

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
      minimumFractionDigits: 1,
      maximumFractionDigits: 4,
    });
  };

  // Claim old fee rewards
  const handleClaimRewards = async () => {
    if (!address) {
      showToast?.("error", "Connect your wallet first.");
      return;
    }

    if (chainId !== BASE_CHAIN_ID) {
      showToast?.("error", "Please switch to Base network to claim.");
      return;
    }

    if (!hasRewards) {
      setShowNoRewardsBubble(true);
      setTimeout(() => setShowNoRewardsBubble(false), 4000);
      return;
    }

    try {
      setIsClaiming(true);

      await writeContractAsync({
        abi: FEE_DISTRIBUTOR_ABI,
        address: FEE_DISTRIBUTOR_ADDRESS,
        functionName: "claim",
        chainId: BASE_CHAIN_ID,
      });

      showToast?.("success", "Rewards claimed successfully!");
      refetchPendingRewards?.();
    } catch (e) {
      console.error("Claim rewards failed:", e);
      showToast?.("error", "Claim transaction failed or was rejected.");
    } finally {
      setIsClaiming(false);
    }
  };

  // Approve HR for HR staking contract
  const handleApproveHr = async () => {
    if (!address) return showToast?.("error", "Connect your wallet first.");
    if (chainId !== BASE_CHAIN_ID)
      return showToast?.("error", "Please switch to Base network.");
    if (!hrToStakeWei || hrToStakeWei <= 0n)
      return showToast?.("error", "Enter a valid HR amount.");

    try {
      setIsApprovingHr(true);
      await writeContractAsync({
        abi: ERC20_ABI,
        address: HR_TOKEN_ADDRESS,
        functionName: "approve",
        args: [HR_STAKING_CONTRACT_ADDRESS, hrToStakeWei],
        chainId: BASE_CHAIN_ID,
      });
      showToast?.("success", "Approve done!");
      refetchAllowance?.();
    } catch (e) {
      console.error(e);
      showToast?.("error", "Approve failed or was rejected.");
    } finally {
      setIsApprovingHr(false);
    }
  };

  // Stake HR into HR staking contract
  const handleStakeHr = async () => {
    if (!address) return showToast?.("error", "Connect your wallet first.");
    if (chainId !== BASE_CHAIN_ID)
      return showToast?.("error", "Please switch to Base network.");
    if (!hrToStakeWei || hrToStakeWei <= 0n)
      return showToast?.("error", "Enter a valid HR amount.");
    if (needsApprove) return showToast?.("info", "Please approve HR first.");

    try {
      setIsHrStaking(true);
      await writeContractAsync({
        abi: HR_STAKING_ABI,
        address: HR_STAKING_CONTRACT_ADDRESS,
        functionName: "stake",
        args: [hrToStakeWei],
        chainId: BASE_CHAIN_ID,
      });

      setHrAmount("");
      showToast?.("success", "HR staked successfully!");
      refetchPendingHrRewards?.();
      refetchAllowance?.();
    } catch (e) {
      console.error(e);
      showToast?.("error", e.shortMessage || e.message || "HR stake failed.");
    } finally {
      setIsHrStaking(false);
    }
  };

  // Claim HR rewards from HR staking
  const handleClaimHrRewards = async () => {
    if (!address) return showToast?.("error", "Connect your wallet first.");
    if (chainId !== BASE_CHAIN_ID)
      return showToast?.("error", "Please switch to Base network.");

    if (!pendingHrRewardsRaw || pendingHrRewardsRaw === 0n) {
      showToast?.("info", "No HR rewards yet.");
      return;
    }

    try {
      setIsHrClaiming(true);
      await writeContractAsync({
        abi: HR_STAKING_ABI,
        address: HR_STAKING_CONTRACT_ADDRESS,
        functionName: "claim",
        chainId: BASE_CHAIN_ID,
      });

      showToast?.("success", "HR rewards claimed!");
      refetchPendingHrRewards?.();
    } catch (e) {
      console.error(e);
      showToast?.("error", "Claim failed (maybe cooldown).");
    } finally {
      setIsHrClaiming(false);
    }
  };

  // Claim HR rewards for ETH stakers (new contract)
  const handleClaimEthHrRewards = async () => {
    if (!address) return showToast?.("error", "Connect your wallet first.");
    if (chainId !== BASE_CHAIN_ID)
      return showToast?.("error", "Please switch to Base network.");

    // إذا ما عنده أي ETH staked أصلاً
    if (!userStakedData || userStakedData === 0n) {
      showToast?.("info", "You have no ETH staked yet.");
      return;
    }

    try {
      setIsEthHrClaiming(true);

      // دائمًا Sync أولاً (تفعيل/تحديث)
      await writeContractAsync({
        abi: ETH_HR_REWARDS_ABI,
        address: ETH_HR_REWARDS_CONTRACT_ADDRESS,
        functionName: "sync",
        chainId: BASE_CHAIN_ID,
      });

      // إذا ما في pending بعد (أول مرة غالبًا) -> نخليه تفعيل فقط
      if (!pendingEthHrRaw || pendingEthHrRaw === 0n) {
        showToast?.("success", "HR rewards activated ✅ Come back later to claim.");
        refetchPendingEthHr?.();
        return;
      }

      // إذا في pending -> claim
      await writeContractAsync({
        abi: ETH_HR_REWARDS_ABI,
        address: ETH_HR_REWARDS_CONTRACT_ADDRESS,
        functionName: "claim",
        chainId: BASE_CHAIN_ID,
      });

      showToast?.("success", "ETH-staker HR rewards claimed!");
      refetchPendingEthHr?.();
    } catch (e) {
      console.error(e);
      showToast?.("error", "Claim failed (maybe cooldown / rejected).");
    } finally {
      setIsEthHrClaiming(false);
    }
  };

  return (
    <div className="staking-page staking-conversion-page">
      <section className="staking-conversion-hero">
        <div className="staking-conversion-hero-copy">
          <span className="staking-conversion-kicker">HEATRUSH STAKING</span>
          <h1>Stake. Earn. Rise.</h1>
          <p>
            Choose your asset, build your position, earn XP and qualify for
            HeatRush rewards across Base and BNB Chain.
          </p>
        </div>

        <div className="staking-conversion-hero-meta">
          <span className="staking-market-count">7 STAKING MARKETS</span>
          <span className="staking-live-line">
            <span className="staking-live-dot" />
            Live on Base &amp; BNB Chain
          </span>
        </div>
      </section>

      <section className="staking-market-hub">
        <div className="staking-network-block staking-network-base">
          <div className="staking-network-header">
            <div className="staking-network-title">
              <img src="/baselogo.png" alt="Base" />
              <div>
                <span className="staking-network-eyebrow">NETWORK</span>
                <h2>Base Chain</h2>
              </div>
            </div>
            <span className="staking-network-count">
              {2 + MULTICHAIN_STAKING_ASSETS.filter(
                (asset) => asset.chainId === BASE_CHAIN_ID
              ).length}{" "}
              Markets
            </span>
          </div>

          <div className="staking-network-grid staking-network-grid-base">
            <article className="staking-market-card staking-market-card-legacy staking-market-card-eth">
              <div className="staking-market-card-head">
                <div className="staking-market-identity">
                  <div className="staking-market-logo-wrap">
                    <img
                      src="/ethlogo.png"
                      alt="ETH"
                      className="staking-market-main-logo"
                    />
                    <img
                      src="/baselogo.png"
                      alt="Base"
                      className="staking-market-network-logo"
                    />
                  </div>

                  <div>
                    <div className="staking-market-symbol">ETH</div>
                    <div className="staking-market-network-name">Base Chain</div>
                  </div>
                </div>

                <span className="staking-market-live-pill">LIVE</span>
              </div>

              <div className="staking-market-reward-title">
                STAKE ETH • EARN XP + HR
              </div>
                <div className="staking-market-reward-title">
2% – 4% APY              </div>
              <p className="staking-market-reward-copy">
                Build your HeatRush tier, earn on-chain XP and activate HR
                rewards for ETH stakers.
              </p>

              <div className="staking-market-stat-grid">
                <div>
                  <span>Wallet</span>
                  <strong>{userBalance} ETH</strong>
                </div>
                <div>
                  <span>Your Staked</span>
                  <strong>{formatEth(userStakedEth)} ETH</strong>
                </div>
                <div>
                  <span>Tier</span>
                  <strong>{levelInfo.label}</strong>
                </div>
                <div>
                  <span>XP</span>
                  <strong>{formatXP(userXP)}</strong>
                </div>
              </div>

              <div className="staking-market-progress-box">
                <div className="staking-market-progress-head">
                  <span>
                    {ethNextTarget
                      ? `Next milestone: ${ethNextTarget.toFixed(2)} ETH`
                      : "Maximum ETH tier unlocked"}
                  </span>
                  <strong>{formatNum(ethProgressPct, 1)}%</strong>
                </div>

                <div className="staking-market-progress-track">
                  <div
                    className="staking-market-progress-fill"
                    style={{ width: `${ethProgressPct}%` }}
                  />
                </div>

                <p>
                  {ethNextTarget
                    ? `${formatEth(
                        Math.max(0, ethNextTarget - userStakedEth)
                      )} ETH to the next milestone.`
                    : "Platinum tier is active for this wallet."}
                </p>
              </div>

              <div className="staking-market-input-area">
                <div className="staking-market-input-row">
                  <input
                    type="text"
                    inputMode="decimal"
                    className="staking-market-input"
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
                  <button
                    type="button"
                    className="staking-market-max-btn"
                    onClick={handleMax}
                  >
                    MAX
                  </button>
                </div>

                <button
                  type="button"
                  className={`staking-market-primary-btn ${
                    isLoading ? "loading" : ""
                  }`}
                  onClick={handleStake}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Stake ETH"}
                </button>
              </div>

              <div className="staking-market-secondary-grid">
                <button
                  ref={claimButtonRef}
                  type="button"
                  className={`staking-market-secondary-btn ${
                    hasRewards ? "is-hot" : ""
                  }`}
                  onClick={handleClaimRewards}
                  disabled={isClaiming || !address || chainId !== BASE_CHAIN_ID}
                >
                  {isClaiming
                    ? "Claiming..."
                    : `Claim ETH Rewards (${pendingRewardsEth.toFixed(4)} ETH)`}
                </button>

                <button
                  type="button"
                  className={`staking-market-secondary-btn ${
                    pendingEthHrRaw > 0n ? "is-hot" : ""
                  }`}
                  onClick={handleClaimEthHrRewards}
                  disabled={
                    isEthHrClaiming || !address || chainId !== BASE_CHAIN_ID
                  }
                >
                  {isEthHrClaiming
                    ? "Claiming..."
                    : `Claim HR Rewards (${formatNum(pendingEthHr, 4)} HR)`}
                </button>
              </div>

              <button
                type="button"
                className="staking-market-unstake-btn"
                onClick={() =>
                  showToast?.(
                    "info",
                    "Unstaking will be introduced in a later stage."
                  )
                }
              >
                Unstake • coming later
              </button>

              {showNoRewardsBubble && (
                <div className="no-rewards-bubble">
                  <div className="no-rewards-bubble-arrow" />
                  <div className="no-rewards-bubble-title">No rewards yet</div>
                  <div className="no-rewards-bubble-text">
                    Stake ETH to start earning your share of swap &amp; bridge fees.
                  </div>
                </div>
              )}
            </article>

            <article className="staking-market-card staking-market-card-legacy staking-market-card-hr">
              <div className="staking-market-card-head">
                <div className="staking-market-identity">
                  <div className="staking-market-logo-wrap">
                    <img
                      src={TokensImg}
                      alt="HR"
                      className="staking-market-main-logo staking-market-hr-logo"
                    />
                    <img
                      src="/baselogo.png"
                      alt="Base"
                      className="staking-market-network-logo"
                    />
                  </div>

                  <div>
                    <div className="staking-market-symbol">HR</div>
                    <div className="staking-market-network-name">Base Chain</div>
                  </div>
                </div>

                <span className="staking-market-live-pill">LIVE</span>
              </div>

              <div className="staking-market-reward-title">
                STAKE HR • BOOST YOUR MULTIPLIER
              </div>
                 <div className="staking-market-reward-title">
       70% APY       </div>
              <p className="staking-market-reward-copy">
                Stake HR, strengthen your HeatRush position and climb toward the
                Elite multiplier.
              </p>

              <div className="staking-market-stat-grid">
                <div>
                  <span>Wallet</span>
                  <strong>{hrWalletBalance} HR</strong>
                </div>
                <div>
                  <span>Your Staked</span>
                  <strong>{formatNum(userHrDeposited, 2)} HR</strong>
                </div>
                <div>
                  <span>Multiplier</span>
                  <strong>{hrTier.mult.toFixed(2)}x</strong>
                </div>
                <div>
                  <span>Pending</span>
                  <strong>{formatNum(pendingHrRewards, 2)} HR</strong>
                </div>
              </div>

              <div className="staking-market-progress-box">
                <div className="staking-market-progress-head">
                  <span>
                    {hrTier.nextTarget
                      ? `Next tier: ${hrTier.nextTarget.toLocaleString()} HR`
                      : "Elite multiplier unlocked"}
                  </span>
                  <strong>{formatNum(hrProgressToElite, 1)}%</strong>
                </div>

                <div className="staking-market-progress-track">
                  <div
                    className="staking-market-progress-fill staking-market-progress-fill-hr"
                    style={{ width: `${hrProgressToElite}%` }}
                  />
                </div>

                <p>
                  {hrTier.nextTarget
                    ? `${formatNum(hrToNextTier, 0)} HR to the next tier.`
                    : "Daily reward multiplier is maximized."}
                </p>
              </div>

              <div className="staking-market-input-area">
                <div className="staking-market-input-row">
                  <input
                    type="text"
                    inputMode="decimal"
                    className="staking-market-input"
                    placeholder="Enter HR amount"
                    value={hrAmount}
                    onChange={(e) => {
                      const raw = e.target.value.replace(",", ".");
                      const regex = /^[0-9]*\.?[0-9]*$/;
                      if (raw === "" || regex.test(raw)) setHrAmount(raw);
                    }}
                  />
                  <button
                    type="button"
                    className="staking-market-max-btn"
                    onClick={handleMaxHr}
                  >
                    MAX
                  </button>
                </div>

                {needsApprove ? (
                  <button
                    type="button"
                    className={`staking-market-primary-btn ${
                      isApprovingHr ? "loading" : ""
                    }`}
                    onClick={handleApproveHr}
                    disabled={isApprovingHr}
                  >
                    {isApprovingHr ? "Approving..." : "Approve HR"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`staking-market-primary-btn ${
                      isHrStaking ? "loading" : ""
                    }`}
                    onClick={handleStakeHr}
                    disabled={isHrStaking}
                  >
                    {isHrStaking ? "Processing..." : "Stake HR"}
                  </button>
                )}
              </div>

              <div className="staking-market-secondary-grid staking-market-secondary-grid-single">
                <button
                  type="button"
                  className={`staking-market-secondary-btn ${
                    pendingHrRewardsRaw > 0n ? "is-hot" : ""
                  }`}
                  onClick={handleClaimHrRewards}
                  disabled={isHrClaiming || !address || chainId !== BASE_CHAIN_ID}
                >
                  {isHrClaiming ? "Claiming..." : "Claim HR Rewards"}
                </button>
              </div>

              <p className="staking-market-footnote">
                Rewards are distributed daily. Principal unlock remains a later
                phase.
              </p>
            </article>

            {MULTICHAIN_STAKING_ASSETS.filter(
              (asset) => asset.chainId === BASE_CHAIN_ID
            ).map((asset) => (
              <MultichainAssetCard
                key={asset.id}
                asset={asset}
                showToast={showToast}
              />
            ))}
          </div>
        </div>

        <div className="staking-network-block staking-network-bnb">
          <div className="staking-network-header">
            <div className="staking-network-title">
              <img src="/smartchainlogo.png" alt="BNB Chain" />
              <div>
                <span className="staking-network-eyebrow">NETWORK</span>
                <h2>BNB Chain</h2>
              </div>
            </div>

            <span className="staking-network-count">
              {
                MULTICHAIN_STAKING_ASSETS.filter(
                  (asset) => asset.chainId !== BASE_CHAIN_ID
                ).length
              }{" "}
              Markets
            </span>
          </div>

          <div className="staking-network-grid staking-network-grid-bnb">
            {MULTICHAIN_STAKING_ASSETS.filter(
              (asset) => asset.chainId !== BASE_CHAIN_ID
            ).map((asset) => (
              <MultichainAssetCard
                key={asset.id}
                asset={asset}
                showToast={showToast}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="staking-motivation-strip">
        <div className="staking-motivation-icon">🏆</div>
        <div>
          <strong>Stake more. Build your position. Climb the ranks.</strong>
          <span>
            Earn XP, qualify for rewards and strengthen your place in the
            HeatRush ecosystem.
          </span>
        </div>
      </section>

      <section className="staking-insights-grid">
        <div className="card staking-card staking-leaderboard staking-leaderboard-modern">
          <div className="staking-insight-title-row staking-leaderboard-title-row">
            <div>
              <span className="staking-insight-kicker">COMMUNITY RANKING</span>
              <h2>Top {selectedLeaderboardMarket.label} Stakers</h2>
            </div>
            <span className="staking-network-count">TOP 10</span>
          </div>

          <div className="staking-leaderboard-tabs" role="tablist" aria-label="Leaderboard asset">
            {LEADERBOARD_MARKETS.map((market) => {
              const isActive = market.key === leaderboardMarketKey;
              return (
                <button
                  key={market.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`staking-leaderboard-tab ${isActive ? "active" : ""}`}
                  onClick={() => setLeaderboardMarketKey(market.key)}
                >
                  {market.label}
                </button>
              );
            })}
          </div>

          {selectedLeaderboardMarket.unavailable && (
            <p className="staking-leaderboard-note staking-leaderboard-unavailable">
              HR ranking is not available yet because the current HR staking contract does not expose a complete staker list.
            </p>
          )}

          {!selectedLeaderboardMarket.unavailable && leaderboardLoading && (
            <p className="staking-leaderboard-note">Loading leaderboard...</p>
          )}

          {!selectedLeaderboardMarket.unavailable &&
            leaderboardError &&
            !leaderboardLoading && (
              <p className="staking-leaderboard-error">{leaderboardError}</p>
            )}

          {!selectedLeaderboardMarket.unavailable &&
            !leaderboardLoading &&
            !leaderboardError &&
            leaderboard.length === 0 && (
              <p className="staking-leaderboard-note">
                No staking activity yet. Be the first to appear on the leaderboard.
              </p>
            )}

          {!selectedLeaderboardMarket.unavailable &&
            !leaderboardLoading &&
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
                      <span className="staking-leader-rank">{index + 1}</span>

                      <span className="staking-leader-address">
                        <span className="staking-leader-wallet">
                          {formatShortAddress(row.address)}
                        </span>
                        {isYou && (
                          <span className="staking-leader-you-pill">YOU</span>
                        )}
                      </span>

                      <span className="staking-leader-amount">
                        {formatNum(
                          row.amount,
                          selectedLeaderboardMarket.symbol === "BTCB" ? 4 :
                            selectedLeaderboardMarket.symbol === "ETH" ? 4 :
                              selectedLeaderboardMarket.symbol === "BNB" ? 4 : 2
                        )}{" "}
                        <span className="status-unit">
                          {selectedLeaderboardMarket.symbol}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
        </div>
      </section>

      <section className="staking-support-grid">
        <div className="card staking-card staking-xp-info staking-xp-modern">
          <div className="staking-insight-title-row">
            <div>
              <span className="staking-insight-kicker">PROGRESSION</span>
              <h2>Your XP &amp; Levels</h2>
            </div>
          </div>

          <p className="xp-intro">
            XP boosts your weight for airdrops, future campaigns, and on-chain
            reputation.
          </p>

          <div className="xp-formula-box">
            <div className="xp-formula-label">On-chain XP</div>
            <div className="xp-formula-code">Total XP: {formatXP(userXP)}</div>
            <p className="xp-formula-note">
              XP is tracked directly by the HeatRush ETH staking contract.
            </p>
          </div>

          <div className="xp-levels-grid">
            <div
              className="xp-level-card bronze tier-3d"
              onMouseMove={handleTierTiltMove}
              onMouseLeave={handleTierTiltLeave}
            >
              <div className="xp-level-title">Bronze</div>
              <div className="xp-level-threshold">Stake ≥ 0.10 ETH</div>
              <p className="xp-level-desc">Stake ≥ 0.10 ETH to reach Bronze.</p>
            </div>

            <div
              className="xp-level-card silver tier-3d"
              onMouseMove={handleTierTiltMove}
              onMouseLeave={handleTierTiltLeave}
            >
              <div className="xp-level-title">Silver</div>
              <div className="xp-level-threshold">Stake ≥ 0.50 ETH</div>
              <p className="xp-level-desc">Stake ≥ 0.50 ETH to reach Silver.</p>
            </div>

            <div
              className="xp-level-card gold tier-3d"
              onMouseMove={handleTierTiltMove}
              onMouseLeave={handleTierTiltLeave}
            >
              <div className="xp-level-title">Gold</div>
              <div className="xp-level-threshold">Stake ≥ 1.00 ETH</div>
              <p className="xp-level-desc">Stake ≥ 1.00 ETH to reach Gold.</p>
            </div>

            <div
              className="xp-level-card platinum tier-3d"
              onMouseMove={handleTierTiltMove}
              onMouseLeave={handleTierTiltLeave}
            >
              <div className="xp-level-title">Platinum</div>
              <div className="xp-level-threshold">Stake ≥ 3.00 ETH</div>
              <p className="xp-level-desc">
                Stake ≥ 3.00 ETH to reach Platinum.
              </p>
            </div>
          </div>
        </div>

        <div className="card staking-card staking-why staking-why-modern">
          <div className="staking-insight-title-row">
            <div>
              <span className="staking-insight-kicker">WHY HEATRUSH</span>
              <h2>Why stake with HeatRush?</h2>
            </div>
          </div>

          <div className="staking-why-grid">
            <div>
              <span className="staking-why-icon">◆</span>
              <strong>Earn Rewards</strong>
              <p>Access the reward systems already connected to HeatRush staking.</p>
            </div>
            <div>
              <span className="staking-why-icon">↗</span>
              <strong>Gain XP</strong>
              <p>Increase your on-chain level and build your HeatRush position.</p>
            </div>
            <div>
              <span className="staking-why-icon">◎</span>
              <strong>Multi-Chain</strong>
              <p>Choose staking markets across Base and BNB Chain.</p>
            </div>
            <div>
              <span className="staking-why-icon">★</span>
              <strong>Be Early</strong>
              <p>Qualify for future opportunities without fake APY promises.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StakingPage;
