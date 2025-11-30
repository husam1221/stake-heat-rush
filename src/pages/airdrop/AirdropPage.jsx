// src/pages/airdrop/AirdropPage.jsx
import React, { useEffect, useState } from "react";
import {
  useAccount,
  useWriteContract,
  useReadContract,
} from "wagmi";

import { useAirdrop } from "../../hooks/useAirdrop.js";
import { useCountdown } from "../../hooks/useCountdown.js";
import { TGE_TIMESTAMP } from "../../lib/constants.js";
import { CLAIM_ABI, CLAIM_ADDRESS } from "../../lib/claim.js";
import { formatUnits } from "viem";

import "../../styles/airdrop.css"; // 👈 ستايل خاص بالصفحة

// Helper to safely format numbers
const safeFormat = (num) =>
  typeof num === "number" && !isNaN(num)
    ? num.toLocaleString("en-US")
    : "0";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const AirdropPage = () => {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // ========== AIRDROP SNAPSHOT من الـ API ==========
  const { airdrop, airdropLoading, airdropError } = useAirdrop(address);
  const countdown = useCountdown(TGE_TIMESTAMP);

  const points = safeFormat(airdrop?.points);
  const hrBase = safeFormat(airdrop?.hr_base);
  const requiredStake = airdrop?.required_stake_eth ?? 0;

  const isEligible =
    airdrop &&
    !airdropError &&
    typeof airdrop.hr_base === "number" &&
    airdrop.hr_base > 0;

  // ========== MERKLE ENTRY من /airdrop-merkle.json ==========
  const [merkleEntry, setMerkleEntry] = useState(null);
  const [merkleLoading, setMerkleLoading] = useState(false);
  const [merkleError, setMerkleError] = useState(null);

  useEffect(() => {
    if (!address) {
      setMerkleEntry(null);
      setMerkleLoading(false);
      setMerkleError(null);
      return;
    }

    let cancelled = false;

    const loadMerkle = async () => {
      try {
        setMerkleLoading(true);
        setMerkleError(null);

        const res = await fetch("/airdrop-merkle.json");
        if (!res.ok) throw new Error("Failed to load airdrop-merkle.json");

        const json = await res.json();

        let entry = null;
        const lower = address.toLowerCase();

        if (json && json.claims) {
          entry = json.claims[lower] || json.claims[address] || null;
        } else if (Array.isArray(json)) {
          entry =
            json.find(
              (x) =>
                x.address?.toLowerCase &&
                x.address.toLowerCase() === lower
            ) || null;
        }

        if (!cancelled) {
          if (entry) {
            setMerkleEntry({
              address: lower,
              totalAllocationWei: entry.totalAllocationWei,
              proof: entry.proof || [],
            });
          } else {
            setMerkleEntry(null);
          }
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setMerkleError(err.message || "Error loading merkle data");
          setMerkleEntry(null);
        }
      } finally {
        if (!cancelled) {
          setMerkleLoading(false);
        }
      }
    };

    loadMerkle();

    return () => {
      cancelled = true;
    };
  }, [address]);

  // totalAllocation بالـ wei
  const totalAllocationWei = merkleEntry?.totalAllocationWei
    ? BigInt(merkleEntry.totalAllocationWei)
    : 0n;



    
  // ========== ON-CHAIN (HRClaim) ==========
  const { data: unlockedData } = useReadContract({
    abi: CLAIM_ABI,
    address: CLAIM_ADDRESS,
    functionName: "unlockedAmount",
    args: [address || ZERO_ADDRESS, totalAllocationWei],
  });

  const { data: claimableData } = useReadContract({
    abi: CLAIM_ABI,
    address: CLAIM_ADDRESS,
    functionName: "claimableAmount",
    args: [address || ZERO_ADDRESS, totalAllocationWei],
  });





  const totalHr =
    totalAllocationWei > 0n ? formatUnits(totalAllocationWei, 18) : "0";
  const unlockedHr =
    unlockedData && unlockedData > 0n ? formatUnits(unlockedData, 18) : "0";
  const claimableHr =
    claimableData && claimableData > 0n
      ? formatUnits(claimableData, 18)
      : "0";

  const totalHrNumber = Number(totalHr);
  const claimableHrNumber = Number(claimableHr);

  // تقدير كمية اللي تمّ مطالبتها (للعرض فقط)
  const claimedSoFar = Math.max(totalHrNumber - claimableHrNumber, 0);

  const [liveUnlockedHr, setLiveUnlockedHr] = useState(
    totalHrNumber ? totalHrNumber - claimedSoFar : 0
  );
  const [liveClaimableHr, setLiveClaimableHr] = useState(claimableHrNumber);

  useEffect(() => {
    if (!isEligible || !totalHrNumber) return;

    const PHASE1_SECONDS = 90 * 24 * 60 * 60;
    const PHASE2_SECONDS = 180 * 24 * 60 * 60;

    const phase1Portion = totalHrNumber * 0.6;
    const phase2Portion = totalHrNumber - phase1Portion;

    function computeUnlocked(nowMs) {
      const diffSec = (nowMs - TGE_TIMESTAMP) / 1000;

      if (diffSec <= 0) return 0;
      if (diffSec >= PHASE1_SECONDS + PHASE2_SECONDS) return totalHrNumber;

      if (diffSec <= PHASE1_SECONDS) {
        return phase1Portion * (diffSec / PHASE1_SECONDS);
      } else {
        const afterPhase1 = diffSec - PHASE1_SECONDS;
        return (
          phase1Portion +
          phase2Portion * (afterPhase1 / PHASE2_SECONDS)
        );
      }
    }

    const interval = setInterval(() => {
      const nowMs = Date.now();
      const unlocked = computeUnlocked(nowMs);
      const claimable = Math.max(unlocked - claimedSoFar, 0);

      setLiveUnlockedHr(unlocked);
      setLiveClaimableHr(claimable);
    }, 1000);

    return () => clearInterval(interval);
  }, [isEligible, totalHrNumber, claimedSoFar]);

  const claimableBig = claimableData ?? 0n;

  const canClaim =
    isConnected &&
    !merkleLoading &&
    !merkleError &&
    totalAllocationWei > 0n &&
    claimableBig > 0n;

  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaim = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first.");
      return;
    }

    if (!merkleEntry || totalAllocationWei === 0n) {
      alert("No allocation found for this wallet.");
      return;
    }

    if (!claimableBig || claimableBig === 0n) {
      alert("Nothing to claim at this time.");
      return;
    }

    try {
      setIsClaiming(true);

      const tx = await writeContractAsync({
        abi: CLAIM_ABI,
        address: CLAIM_ADDRESS,
        functionName: "claim",
        args: [totalAllocationWei, merkleEntry.proof || []],
      });

      alert("Claim transaction sent! Opening BaseScan…");
      window.open(`https://basescan.org/tx/${tx}`, "_blank");
    } catch (err) {
      console.error(err);
      alert(err.shortMessage || err.message || "Failed to send claim tx");
    } finally {
      setIsClaiming(false);
    }
  };

  const hasAllocation =
    isConnected && isEligible && totalHrNumber > 0;

  const alreadyClaimedDisplay =
    liveUnlockedHr > liveClaimableHr
      ? (liveUnlockedHr - liveClaimableHr).toFixed(5)
      : "0.00000";

  const isBeforeTGE = Date.now() < TGE_TIMESTAMP;

  return (
    <div className="airdrop-page">
      {/* ===== Hero Card أعلى الصفحة ===== */}
      <div className="card airdrop-hero-card">
        <div className="airdrop-hero-main">
          <div>
            <h1 className="airdrop-hero-title">$HR Airdrop Center</h1>
            <p className="airdrop-hero-subtitle">
              Track your personal allocation, unlock schedule, and claim status
              — all in one place.
            </p>
          </div>

          <div className="airdrop-hero-status">
            <div className="airdrop-hero-pill">
              {isBeforeTGE
                ? `TGE starts in: ${countdown}`
                : "your HR is unlocking every block."}
            </div>

            {isConnected ? (
              <div
                className={
                  "airdrop-hero-pill " +
                  (hasAllocation ? "pill-ok" : "pill-warn")
                }
              >
                {hasAllocation
                  ? "✅ Eligible for the $HR airdrop"
                  : "⚠️ No snapshot allocation detected for this wallet"}
              </div>
            ) : (
              <div className="airdrop-hero-pill pill-neutral">
                Connect your wallet on Base to check your airdrop.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== الشبكة الرئيسية: يسار (snapshot) + يمين (claim) ===== */}
      <div className="airdrop-grid">
        {/* العمود اليسار: معلومات السنابشوت و التييرات */}
        <div className="airdrop-left">
          <div className="airdrop-box">
            {!isConnected && (
              <p className="airdrop-msg neutral">
                🔍 Connect your wallet to check your exclusive HR allocation.
              </p>
            )}

            {isConnected && airdropLoading && (
              <p className="airdrop-msg loading">
                ⏳ Fetching your allocation...
              </p>
            )}

            {isConnected && !airdropLoading && airdropError && (
              <p className="airdrop-msg error">
                ⚠️ Unable to load your allocation. Please try again later.
              </p>
            )}

            {isConnected &&
              !airdropLoading &&
              !airdropError &&
              (!airdrop || airdrop.hr_base <= 0) && (
                <p className="airdrop-msg error">
                  ❌ You are not eligible for the $HR airdrop.
                </p>
              )}

            {isConnected && (
              <p className="airdrop-msg hint">
                🔥 More campaigns, rewards, and special allocations are coming.
                Stay active inside the HeatRush ecosystem!
              </p>
            )}

            {isConnected && (
              <div className="card airdrop-card">
                <h3 className="airdrop-title">Your HeatRush Airdrop</h3>

                {airdropLoading && (
                  <p className="airdrop-loading">
                    Loading your allocation...
                  </p>
                )}

                {airdropError && (
                  <p className="airdrop-error">{String(airdropError)}</p>
                )}

                {!airdropLoading && !airdropError && airdrop && (
                  <>
                    <div className="airdrop-main-row">
                      <div className="airdrop-main-item">
                        <span className="airdrop-label">
                          Points snapshot
                        </span>
                        <span className="airdrop-value">{points}</span>
                      </div>

                      <div className="airdrop-main-item">
                        <span className="airdrop-label">
                          Base allocation
                        </span>
                        <span className="airdrop-value orange">
                          {hrBase} HR
                        </span>
                      </div>

                      <div className="airdrop-main-item">
                        <span className="airdrop-label">
                          Power-up stake target
                        </span>
                        <span className="airdrop-value">
                          {requiredStake} ETH
                        </span>
                      </div>
                    </div>

                    <p className="airdrop-note">
                      This snapshot is based on your HeatRush points from the
                      previous campaign. Staking more ETH unlocks higher bonus
                      tiers and faster HR unlock.
                    </p>

                    <div className="airdrop-tiers-grid">
                      {airdrop?.tiers?.length > 0 &&
                        airdrop.tiers.map((tier) => (
                          <div
                            key={tier.id}
                            className={
                              tier.id === "diamond"
                                ? "airdrop-tier-card tier-diamond"
                                : "airdrop-tier-card"
                            }
                          >
                            <div className="tier-header">
                              <span className="tier-name">{tier.name}</span>
                              <span className="tier-min">
                                ≥ {tier.minStakeEth} ETH
                              </span>
                            </div>

                            <div className="tier-bonus">
                              +{tier.bonusPercent}% HR bonus
                            </div>

                            {tier.instantUnlock && (
                              <div className="tier-tag">
                                🔓 100% unlock at TGE
                              </div>
                            )}

                            <p className="tier-desc">{tier.description}</p>
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* كرت بسيط يشرح جدول الفستينغ */}
            <div className="card vesting-card">
              <h3 className="airdrop-subtitle">Unlock schedule overview</h3>
              <p className="vesting-text">
                Your airdropped HR unlocks gradually after TGE. You can claim
                any unlocked balance at any time — no deadlines, no penalties.
              </p>

              <div className="vesting-steps">
                <div className="vesting-step">
                  <span className="vs-title">Phase 1 · 60%</span>
                  <span className="vs-sub">
                    Linearly over the first <strong>90 days</strong> after TGE.
                  </span>
                </div>
                <div className="vesting-step">
                  <span className="vs-title">Phase 2 · 40%</span>
                  <span className="vs-sub">
                    Linearly over the next <strong>180 days</strong>.
                  </span>
                </div>
                <div className="vesting-step">
                  <span className="vs-title">Stake boost</span>
                  <span className="vs-sub">
                    Staking more ETH on HeatRush can speed up how fast your HR
                    unlocks — up to <strong>100% instantly</strong> for the top tier.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* العمود اليمين: unlock + claim */}
        {isConnected && !airdropLoading && !airdropError && isEligible && (
          <div className="airdrop-right">
            <div className="card claim-card">
              <h3 className="claim-title">🔓 $HR Unlock & Claim</h3>

              <p className="claim-note">
                {isBeforeTGE
                  ? `TGE starts in: ${countdown}`
                  : " Your HR is unlocking over time based on the global schedule and your stake."}
              </p>

              <div className="claim-metrics-grid">
                <div className="claim-metric">
                  <span className="claim-label">Total allocation</span>
                  <span className="claim-value">
                    {totalHr} <span className="claim-unit">HR</span>
                  </span>
                </div>

                <div className="claim-metric">
                  <span className="claim-label">Unlocked so far</span>
                  <span className="claim-value">
                    {liveUnlockedHr.toFixed(5)}{" "}
                    <span className="claim-unit">HR</span>
                  </span>
                </div>

                <div className="claim-metric">
                  <span className="claim-label">Claimable now</span>
                  <span className="claim-value">
                    {liveClaimableHr.toFixed(5)}{" "}
                    <span className="claim-unit">HR</span>
                  </span>
                </div>

                <div className="claim-metric">
                  <span className="claim-label">Already claimed</span>
                  <span className="claim-value">
                    {alreadyClaimedDisplay}{" "}
                    <span className="claim-unit">HR</span>
                  </span>
                </div>
              </div>

              <button
                className="twitter-share-btn"
                onClick={() => {
                  const tweetText = encodeURIComponent(
`Are you eligible for the $HR Airdrop ? 🔥

Great news! Your personalized airdrop allocation is now live.
Check your rewards, unlock schedule, and full breakdown instantly.

🔓 60% unlock in the first 3 months
🔓 40% unlock over the next 6 months

Don’t miss your chance - verify your eligibility now 👇
https://stake.heatrush.xyz

#HeatRush #Airdrop #Base #Crypto #HR #Web3`
                  );

                  const tweetUrl = `https://x.com/intent/tweet?text=${tweetText}`;
                  window.open(tweetUrl, "_blank");
                }}
              >
                Share on X
              </button>

              <button
                className={`stake-btn ${
                  !canClaim || isClaiming ? "disabled-btn" : ""
                }`}
                onClick={handleClaim}
                disabled={!canClaim || isClaiming}
                style={{ marginTop: "18px" }}
              >
                {isClaiming
                  ? "Processing..."
                  : canClaim
                  ? `Claim ${claimableHr} HR`
                  : "Nothing to claim yet"}
              </button>

              <p className="claim-note" style={{ marginTop: "12px" }}>
                Your HR unlocks gradually:
                <br />• <strong>60%</strong> over the first 3 months
                <br />• <strong>40%</strong> over the next 6 months
                <br />
                Staking more ETH on HeatRush can accelerate this unlock through
                bonus tiers — higher tiers unlock a larger portion earlier.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ===== كرت توضيحي عام أسفل الصفحة ===== */}
      <div className="card airdrop-faq-card">
        <h3 className="airdrop-faq-title">How this airdrop works</h3>
        <ul className="airdrop-faq-list">
          <li>
            Snapshot allocations are based on your HeatRush activity and points
            during the previous campaign.
          </li>
          <li>
            60% of your HR unlocks linearly during the first 90 days after TGE,
            and the remaining 40% over the next 180 days.
          </li>
          <li>
            Your staked ETH on HeatRush acts as a{" "}
            <strong>power-up</strong>, boosting how fast your HR unlocks based
            on the stake tier you reach.
          </li>
          <li>
            You can claim any unlocked HR at any time. Multiple smaller claims
            are allowed; each claim simply subtracts from your unlocked balance.
          </li>
          <li>
            Make sure you&apos;re connected on the <strong>Base</strong> network
            with the same wallet you used in the HeatRush campaign.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AirdropPage;
