// src/pages/profile/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatEther, formatUnits } from "viem";
import { qualifyReferral } from "../../lib/referralApi.js";
import { fetchReferralStats } from "../../lib/referralApi.js"; // جديد

import {
  BASE_CHAIN_ID,
  STAKING_CONTRACT_ADDRESS,
} from "../../lib/constants.js";
import { useAirdrop } from "../../hooks/useAirdrop.js";
import { PRESALE_ABI, PRESALE_ADDRESS } from "../../lib/presale.js";
import {
  fetchXpOverview,
  completeTaskApi,
  fetchXpLeaderboard, // جديد
} from "../../lib/xpApi.js";
import XpHistoryChart from "./XpHistoryChart.jsx";

import "../../styles/profile.css";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// ABI مصغّر لعقد الستيك – قراءة فقط
const STAKING_ABI = [
  {
    type: "function",
    name: "userStaked",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "getTotalXP",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "level",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "uint8" }],
  },
];

const formatNumber = (value, decimals = 4) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "0";
  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: decimals,
  });
};

const levelLabel = (lvl) => {
  if (!lvl) return "No Tier";
  if (lvl === 1) return "Bronze";
  if (lvl === 2) return "Silver";
  if (lvl === 3) return "Gold";
  return `Tier ${lvl}`;
};

const ProfilePage = () => {
  const { address, isConnected } = useAccount();

  // ===== WALLET BALANCE ON BASE =====
  const { data: balanceData } = useBalance({
    address,
    chainId: BASE_CHAIN_ID,
    watch: true,
  });

  const walletBalanceEth = balanceData?.value
    ? Number(formatEther(balanceData.value))
    : 0;

  // ===== ON-CHAIN STAKING METRICS =====
  const { data: stakedWei } = useReadContract({
    abi: STAKING_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "userStaked",
    args: [address || ZERO_ADDRESS],
  });

  const { data: totalXpData } = useReadContract({
    abi: STAKING_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "getTotalXP",
    args: [address || ZERO_ADDRESS],
  });

  const { data: levelData } = useReadContract({
    abi: STAKING_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "level",
    args: [address || ZERO_ADDRESS],
  });

  const stakedEth = stakedWei ? Number(formatEther(stakedWei)) : 0;
  const totalXPOnchain = totalXpData ? Number(totalXpData) : 0;
  const userLevel = levelData ? Number(levelData) : 0;

  // ===== AIRDROP SNAPSHOT (من الـ API) =====
  const { airdrop, airdropLoading, airdropError } = useAirdrop(address);

  const airdropPoints = airdrop?.points ?? 0;
  const airdropBaseHr = airdrop?.hr_base ?? 0;
  const airdropRequiredStake = airdrop?.required_stake_eth ?? 0;

  // ===== PRESALE METRICS (on-chain) =====
  const { data: totalHrForData } = useReadContract({
    abi: PRESALE_ABI,
    address: PRESALE_ADDRESS,
    functionName: "totalHrFor",
    args: [address || ZERO_ADDRESS],
  });

  const { data: claimedPresaleData } = useReadContract({
    abi: PRESALE_ABI,
    address: PRESALE_ADDRESS,
    functionName: "claimed",
    args: [address || ZERO_ADDRESS],
  });

  const { data: claimablePresaleData } = useReadContract({
    abi: PRESALE_ABI,
    address: PRESALE_ADDRESS,
    functionName: "claimableHR",
    args: [address || ZERO_ADDRESS],
  });

  const totalPresaleHr = totalHrForData
    ? Number(formatUnits(totalHrForData, 18))
    : 0;
  const claimedPresaleHr = claimedPresaleData
    ? Number(formatUnits(claimedPresaleData, 18))
    : 0;
  const claimablePresaleHr = claimablePresaleData
    ? Number(formatUnits(claimablePresaleData, 18))
    : 0;

      const [xpLb, setXpLb] = useState(null);
  const [xpLbLoading, setXpLbLoading] = useState(false);
  const [xpLbError, setXpLbError] = useState(null);

  // ===== OFF-CHAIN XP / POINTS + Referral Stats =====
  const [xpLoading, setXpLoading] = useState(false);
  const [xpError, setXpError] = useState(null);
  const [xpOverview, setXpOverview] = useState(null);

  const [refStats, setRefStats] = useState(null);
  const [refLoading, setRefLoading] = useState(false);

  const refreshXp = async (wallet) => {
    if (!wallet) {
      setXpOverview(null);
      return;
    }
    setXpLoading(true);
    setXpError(null);
    try {
      const data = await fetchXpOverview(wallet);
      setXpOverview(data);
    } catch (err) {
      console.error("Failed to load XP overview:", err);
      setXpError("Failed to load off-chain XP");
    } finally {
      setXpLoading(false);
    }
  };

  // تحميل Referral Stats
  useEffect(() => {
    if (!address) {
      setRefStats(null);
      return;
    }
    setRefLoading(true);
    fetchReferralStats(address)
      .then(setRefStats)
      .catch(() => setRefStats(null))
      .finally(() => setRefLoading(false));
  }, [address]);

  useEffect(() => {
    if (!address) {
      setXpOverview(null);
      return;
    }
    refreshXp(address);
  }, [address]);

  const offchainPoints = xpOverview?.totals?.points_offchain ?? 0;
  const offchainXp = xpOverview?.totals?.xp_offchain ?? 0;
  const globalXp = totalXPOnchain + offchainXp;




    // تحميل XP leaderboard (أعلى 10 + ترتيبك)
  useEffect(() => {
    if (!address) {
      setXpLb(null);
      return;
    }

    setXpLbLoading(true);
    setXpLbError(null);

    fetchXpLeaderboard(address)
      .then((data) => {
        setXpLb(data);
      })
      .catch((err) => {
        console.error("Failed to load XP leaderboard:", err);
        setXpLbError("Failed to load XP leaderboard");
        setXpLb(null);
      })
      .finally(() => setXpLbLoading(false));
  }, [address]);

  // ===== Referral qualify (>= 300 off-chain XP) =====
  useEffect(() => {
    if (!address || !isConnected) return;
    if (xpLoading || xpError) return;

    const REQUIRED_XP = 300;
    if (offchainXp < REQUIRED_XP) return;

    const key = `hr_referral_xp_qualified_${address.toLowerCase()}`;
    if (localStorage.getItem(key) === "done") return;

    qualifyReferral(address, "xp")
      .then((res) => {
        if (res?.ok && !res.notQualifiedYet) {
          try {
            localStorage.setItem(key, "done");
          } catch {}
        }
      })
      .catch(console.error);
  }, [address, isConnected, xpLoading, xpError, offchainXp]);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Not connected";

  // ====== VERIFY STATES (نفس النظام القديم) ======
  const [walletVerify, setWalletVerify] = useState(null);
  const [stakingVerify, setStakingVerify] = useState(null);
  const [airdropVerify, setAirdropVerify] = useState(null);
  const [presaleVerify, setPresaleVerify] = useState(null);
  const [referralVerify, setReferralVerify] = useState(null); // جديد

  useEffect(() => {
    if (!xpOverview) {
      setWalletVerify(null);
      setStakingVerify(null);
      setAirdropVerify(null);
      setPresaleVerify(null);
      setReferralVerify(null);
      return;
    }

    const completed = xpOverview.completedTasks || [];

    if (completed.includes("verify_wallet")) setWalletVerify("passed");
    if (completed.includes("verify_staking")) setStakingVerify("passed");
    if (completed.includes("verify_airdrop")) setAirdropVerify("passed");
    if (completed.includes("verify_presale")) setPresaleVerify("passed");
    if (completed.includes("verify_referrals")) setReferralVerify("passed");
  }, [xpOverview]);

  const btnClass = (status) => {
    if (status === "passed") return "profile-verify-btn verified";
    if (status === "failed") return "profile-verify-btn failed";
    return "profile-verify-btn";
  };

  const btnLabel = (status) => {
    if (status === "passed") return "Verified";
    if (status === "failed") return "Not verified";
    return "Verify";
  };

  // ========== VERIFY HANDLERS ==========
  const handleWalletVerify = async () => {
    if (walletVerify === "passed") return;
    if (!isConnected || walletBalanceEth <= 0) {
      setWalletVerify("failed");
      return;
    }
    await completeTaskApi(address, "verify_wallet", 0, 3);
    await refreshXp(address);
    setWalletVerify("passed");
  };

  const handleStakingVerify = async () => {
    if (stakingVerify === "passed") return;
    if (!isConnected || (stakedEth <= 0 && totalXPOnchain < 1)) {
      setStakingVerify("failed");
      return;
    }
    await completeTaskApi(address, "verify_staking", 0, 8);
    await refreshXp(address);
    setStakingVerify("passed");
  };

  const handleAirdropVerify = async () => {
    if (airdropVerify === "passed") return;
    if (!isConnected || airdropBaseHr <= 0) {
      setAirdropVerify("failed");
      return;
    }
    await completeTaskApi(address, "verify_airdrop", 0, 5);
    await refreshXp(address);
    setAirdropVerify("passed");
  };

  const handlePresaleVerify = async () => {
    if (presaleVerify === "passed") return;
    if (!isConnected || totalPresaleHr <= 0) {
      setPresaleVerify("failed");
      return;
    }
    await completeTaskApi(address, "verify_presale", 0, 11);
    await refreshXp(address);
    setPresaleVerify("passed");
  };

  // جديد: Verify للإحالات
  const handleReferralVerify = async () => {
    if (referralVerify === "passed") return;
    if (!isConnected) {
      setReferralVerify("failed");
      return;
    }
    const qualified = refStats?.totals?.totalQualified ?? 0;
    if (qualified <= 0) {
      setReferralVerify("failed");
      return;
    }
    await completeTaskApi(address, "verify_referrals", 0, 7); // +7 XP حلو
    await refreshXp(address);
    setReferralVerify("passed");
  };

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div>
          <h1 className="profile-title">My HeatRush Profile</h1>
          <p className="profile-subtitle">
            Track your staking progress, airdrop snapshot, presale position, referrals and
            both on-chain & off-chain XP inside the HeatRush ecosystem.
          </p>
        </div>

        <div className="profile-tag-group">
          <span className="profile-tag-pill">
            Live on <span>Base</span>
          </span>
          {isConnected ? (
            <span className="profile-tag-address">{shortAddress}</span>
          ) : (
            <span className="profile-tag-address muted">
              Connect wallet to see full profile
            </span>
          )}
        </div>
      </div>

      {/* TOP SUMMARY */}
      <div className="profile-top-summary">
        <div className="card profile-card profile-summary-card">
          <div className="profile-stat-row">
            <span className="profile-stat-label">Total Points</span>
            <span className="profile-stat-value">
              {xpLoading ? "Loading..." : `${formatNumber(offchainPoints, 0)} pts`}
            </span>
          </div>

          <div className="profile-stat-row">
            <span className="profile-stat-label">Total XP (global)</span>
            <span className="profile-stat-value">
              {xpLoading ? "Loading..." : `${formatNumber(globalXp, 2)} XP`}
            </span>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="profile-grid">
        {/* CARD 1 — Wallet & Network */}
        <div className="card profile-card">
          <div className="profile-card-header">
            <h2>Wallet & Network</h2>
            <span className="profile-chip neutral">Overview</span>
          </div>

          <div className="profile-stat-row">
            <span className="profile-stat-label">Wallet Status</span>
            <span className="profile-stat-value">
              {isConnected ? "Connected" : "Not connected"}
            </span>
          </div>

          <div className="profile-stat-row">
            <span className="profile-stat-label">Base Balance</span>
            <span className="profile-stat-value">
              {formatNumber(walletBalanceEth, 5)} <span className="unit">ETH</span>
            </span>
          </div>

          <div className="profile-stat-row">
            <span className="profile-stat-label">Network</span>
            <span className="profile-stat-value">Base Mainnet</span>
          </div>

          <div className="profile-verify-row">
            <div className="profile-verify-text-block">
              <span className="profile-verify-text">
                Verified if this wallet has a non-zero ETH balance on Base.
              </span>
              <span className="profile-verify-reward">Reward: +3 XP</span>
            </div>
            <button
              type="button"
              className={btnClass(walletVerify)}
              onClick={handleWalletVerify}
            >
              {btnLabel(walletVerify)}
            </button>
          </div>

          <p className="profile-card-note">
            All staking, presale, and airdrop logic runs on Base.
          </p>
        </div>

        {/* CARD 2 — Staking & XP */}
        <div className="card profile-card">
          <div className="profile-card-header">
            <h2>Staking & XP</h2>
            <span className="profile-chip orange">On-chain Progress</span>
          </div>

          <div className="profile-stat-row">
            <span className="profile-stat-label">Total Staked</span>
            <span className="profile-stat-value">
              {formatNumber(stakedEth, 5)} <span className="unit">ETH</span>
            </span>
          </div>

          <div className="profile-stat-row">
            <span className="profile-stat-label">Total XP (on-chain)</span>
            <span className="profile-stat-value">
              {formatNumber(totalXPOnchain, 2)} <span className="unit">XP</span>
            </span>
          </div>

          <div className="profile-stat-row">
            <span className="profile-stat-label">Staking Tier</span>
            <span className="profile-stat-value">{levelLabel(userLevel)}</span>
          </div>

          <div className="profile-divider" />

          <div className="profile-stat-row">
            <span className="profile-stat-label">Off-chain XP</span>
            <span className="profile-stat-value">
              {xpLoading ? "Loading..." : `${formatNumber(offchainXp, 2)} XP`}
            </span>
          </div>

          <div className="profile-verify-row">
            <div className="profile-verify-text-block">
              <span className="profile-verify-text">
                Verified if you have any staked ETH or on-chain XP ≥ 1 XP  .
              </span>
              <span className="profile-verify-reward">Reward: +8 XP</span>
            </div>
            <button
              type="button"
              className={btnClass(stakingVerify)}
              onClick={handleStakingVerify}
            >
              {btnLabel(stakingVerify)}
            </button>
          </div>

          {xpError && (
            <p className="profile-card-note error">
              {xpError}
            </p>
          )}

          <p className="profile-card-note">
            On-chain XP comes from staking and referrals. Off-chain XP & points
            come from tasks and daily rewards.
          </p>

          <a href="/staking" className="profile-cta-link">
            → Go to Staking page
          </a>
        </div>

        {/* CARD  CARD 3 — Airdrop Snapshot */}
        <div className="card profile-card">
          <div className="profile-card-header">
            <h2>Airdrop Snapshot</h2>
            <span className="profile-chip purple">Campaign Data</span>
          </div>

          {airdropLoading && (
            <p className="profile-card-note">Loading your airdrop data...</p>
          )}

          {airdropError && (
            <p className="profile-card-note error">
              Unable to load snapshot.
            </p>
          )}

          {!airdropLoading && !airdropError && isConnected && (
            <>
              <div className="profile-stat-row">
                <span className="profile-stat-label">Points Snapshot</span>
                <span className="profile-stat-value">
                  {formatNumber(airdropPoints, 0)}
                </span>
              </div>

              <div className="profile-stat-row">
                <span className="profile-stat-label">Base HR Allocation</span>
                <span className="profile-stat-value">
                  {formatNumber(airdropBaseHr, 0)} <span className="unit">HR</span>
                </span>
              </div>

              <div className="profile-stat-row">
                <span className="profile-stat-label">Stake needed for max boost</span>
                <span className="profile-stat-value">
                  {formatNumber(airdropRequiredStake, 3)} <span className="unit">ETH</span>
                </span>
              </div>

              <div className="profile-verify-row">
                <div className="profile-verify-text-block">
                  <span className="profile-verify-text">
                    Verified if this address has any HR allocated in the snapshot.
                  </span>
                  <span className="profile-verify-reward">Reward: +5 XP</span>
                </div>
                <button
                  type="button"
                  className={btnClass(airdropVerify)}
                  onClick={handleAirdropVerify}
                >
                  {btnLabel(airdropVerify)}
                </button>
              </div>

              <p className="profile-card-note">
                The more you stake, the faster your HR unlocks after TGE.
              </p>

              <a href="/airdrop" className="profile-cta-link">
                → Open Airdrop dashboard
              </a>
            </>
          )}
        </div>

        {/* CARD 4 — Presale & Future Rewards */}
        <div className="card profile-card">
          <div className="profile-card-header">
            <h2>Presale & Future Rewards</h2>
            <span className="profile-chip gold">On-chain Presale</span>
          </div>

          <div className="profile-stat-row">
            <span className="profile-stat-label">Total HR purchased</span>
            <span className="profile-stat-value">
              {formatNumber(totalPresaleHr, 2)} <span className="unit">HR</span>
            </span>
          </div>

          <div className="profile-stat-row">
            <span className="profile-stat-label">Claimed</span>
            <span className="profile-stat-value">
              {formatNumber(claimedPresaleHr, 2)} <span className="unit">HR</span>
            </span>
          </div>

          <div className="profile-stat-row">
            <span className="profile-stat-label">Still claimable</span>
            <span className="profile-stat-value">
              {formatNumber(claimablePresaleHr, 2)} <span className="unit">HR</span>
            </span>
          </div>

          <div className="profile-verify-row">
            <div className="profile-verify-text-block">
              <span className="profile-verify-text">
                Verified if you bought any HR in the presale.
              </span>
              <span className="profile-verify-reward">Reward: +11 XP</span>
            </div>
            <button
              type="button"
              className={btnClass(presaleVerify)}
              onClick={handlePresaleVerify}
            >
              {btnLabel(presaleVerify)}
            </button>
          </div>

          <p className="profile-card-note">
            Your presale HR is fully on-chain and ready to claim anytime.
          </p>

          <a href="/presale" className="profile-cta-link">
            → Go to Presale page
          </a>
        </div>

        {/* الكرت الخامس الجديد – Referral Impact */}
        <div className="card profile-card">
          <div className="profile-card-header">
            <h2>Referral Impact</h2>
            <span className="profile-chip teal">Social Boost</span>
          </div>

          {refLoading ? (
            <p className="profile-card-note">Loading referral stats…</p>
          ) : !refStats ? (
            <p className="profile-card-note error">Failed to load referrals</p>
          ) : (
            <>
              <div className="profile-stat-row">
                <span className="profile-stat-label">Total referrals</span>
                <span className="profile-stat-value">
                  {formatNumber(refStats.totals?.totalReferrals || 0, 0)}
                </span>
              </div>

              <div className="profile-stat-row">
                <span className="profile-stat-label">Qualified referrals</span>
                <span className="profile-stat-value">
                  {formatNumber(refStats.totals?.totalQualified || 0, 0)}
                </span>
              </div>

              <div className="profile-stat-row">
                <span className="profile-stat-label">Points from referrals</span>
                <span className="profile-stat-value">
                  {formatNumber(refStats.totals?.pointsFromReferrals || 0, 0)}{" "}
                  <span className="unit">pts</span>
                </span>
              </div>

              <div className="profile-stat-row">
                <span className="profile-stat-label">XP from referrals</span>
                <span className="profile-stat-value">
                  {formatNumber(refStats.totals?.xpFromReferrals || 0, 0)}{" "}
                  <span className="unit">XP</span>
                </span>
              </div>

              <div className="profile-verify-row">
                <div className="profile-verify-text-block">
                  <span className="profile-verify-text">
                    Verified if you have at least one qualified referral.
                  </span>
                  <span className="profile-verify-reward">Reward: +7 XP</span>
                </div>
                <button
                  type="button"
                  className={btnClass(referralVerify)}
                  onClick={handleReferralVerify}
                  disabled={referralVerify === "passed"}
                >
                  {btnLabel(referralVerify)}
                </button>
              </div>

              <p className="profile-card-note">
                Qualified referrals = people who actually staked, joined presale, or hit XP milestones.
                Your network directly boosts your rewards!
              </p>

              <a href="/referral" className="profile-cta-link">
                → Invite friends & earn more
              </a>
            </>
          )}

          
        </div>


</div>

              {/* XP & Points history chart */}
      {isConnected && (
        <div className="profile-history-section">
          <h2 className="profile-history-title">Last 30 days: XP & Points</h2>
          <p className="profile-history-subtitle">
            A day-by-day history of how you earned Points and XP over the last 30 days, with each bar split by source 
            ( daily tank, tasks,  Every stake, presale buy, referrals, milestones ).
          </p>
          <XpHistoryChart wallet={address} />
        </div>
      )}
      {/* XP Leaderboard (clean card style) */}
      {isConnected && (
        <div className="card profile-card profile-leaderboard-card">
          <div className="profile-card-header">
<h2 className="leaderboard-title">Global XP Leaderboard</h2>
            <span className="profile-chip orange">on-chain & off-chain</span>
          </div>

          <p className="profile-card-note">
              Top 10 HeatRush grinders ranked by total XP. Every stake, presale buy, daily tank claim, quest, referral, and your activity on X and Telegram all stack up to decide your rank.

          </p>

          {xpLbLoading ? (
            <p className="xp-history-note">Loading leaderboard…</p>
          ) : xpLbError ? (
            <p className="xp-history-note error">{xpLbError}</p>
          ) : xpLb && xpLb.items && xpLb.items.length > 0 ? (
            <>
              <div className="leaderboard-list">
                {xpLb.items.map((row, idx) => {
                  const rank = idx + 1;
                  const isYou =
                    xpLb.user &&
                    row.wallet.toLowerCase() === xpLb.user.wallet?.toLowerCase();

                  const short =
                    row.wallet.slice(0, 6) + "..." + row.wallet.slice(-4);

                  return (
                    <div
                      key={row.wallet}
                      className={
                        "leaderboard-item" + (isYou ? " leaderboard-item-you" : "")
                      }
                    >
                      <div className="leaderboard-rank-pill">
                        {rank}
                      </div>

                      <div className="leaderboard-main">
                        <div className="leaderboard-wallet-row">
                          <span className="leaderboard-wallet">{short}</span>
                          {isYou && (
                            <span className="leaderboard-you-pill">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="leaderboard-metrics">
                          <span className="leaderboard-xp">
                            {row.xp} XP
                          </span>
                          <span className="leaderboard-points">
                            {row.points} pts
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {xpLb.user && !xpLb.user.inTop && (
                <p className="profile-leaderboard-you-note">
                  {" "}
                  <strong>#{xpLb.user.rank}</strong>{" "}
                  You are currently ranked globally with <strong>{xpLb.user.xp} XP</strong> and{" "}
                  <strong>{xpLb.user.points} pts</strong>. Keep grinding to
                  break into the top 10.
                </p>
              )}

              {xpLb.user && xpLb.user.inTop && (
                <p className="profile-leaderboard-you-note">
                  You are in the global top 10! Rank{" "}
                  <strong>#{xpLb.user.rank}</strong> with{" "}
                  <strong>{xpLb.user.xp} XP</strong>.
                </p>
              )}
            </>
          ) : (
            <p className="xp-history-note">
              No XP data available yet for leaderboard.
            </p>
          )}
        </div>
      )}



    </div>
  );
};

export default ProfilePage;