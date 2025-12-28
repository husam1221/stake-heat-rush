// src/pages/airdrop/AirdropPage.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Layers, ExternalLink } from "lucide-react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";

import { useAirdrop } from "../../hooks/useAirdrop.js";
import { useCountdown } from "../../hooks/useCountdown.js";
import { TGE_TIMESTAMP, STAKING_CONTRACT_ADDRESS } from "../../lib/constants.js";
import { CLAIM_ABI, CLAIM_ADDRESS } from "../../lib/claim.js";
import { STAKING_ABI } from "../../lib/staking.js";
import { formatUnits } from "viem";

import "../../styles/season2.css";
import "../../styles/airdrop.css"; // 👈 ستايل خاص بالصفحة

// Helper to safely format numbers
const safeFormat = (num) =>
  typeof num === "number" && !isNaN(num) ? num.toLocaleString("en-US") : "0";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const AirdropPage = ({ showToast }) => {
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

  // ✅ NEW: قراءة رسوم المطالبة من العقد (Wei)
  const { data: claimFeeWeiData } = useReadContract({
    abi: CLAIM_ABI,
    address: CLAIM_ADDRESS,
    functionName: "claimFeeWei",
  });

  const claimFeeWei = claimFeeWeiData ?? 0n;
  const claimFeeEth = claimFeeWei > 0n ? formatUnits(claimFeeWei, 18) : "0";

  const totalHr =
    totalAllocationWei > 0n ? formatUnits(totalAllocationWei, 18) : "0";
  const unlockedHr =
    unlockedData && unlockedData > 0n ? formatUnits(unlockedData, 18) : "0";
  const claimableHr =
    claimableData && claimableData > 0n
      ? formatUnits(claimableData, 18)
      : "0";

  const totalHrNumber = Number(totalHr);
  const unlockedHrNumber = Number(unlockedHr);
  const claimableHrNumber = Number(claimableHr);

  // ✅ إجمالي الكمية اللي تمّ مطالبتها فعليًا (unlocked - claimable)
  const claimedSoFar = Math.max(unlockedHrNumber - claimableHrNumber, 0);

  // قيم العرض الحيّة، متزامنة مع اللي جاي من العقد
  const [liveUnlockedHr, setLiveUnlockedHr] = useState(unlockedHrNumber);
  const [liveClaimableHr, setLiveClaimableHr] = useState(claimableHrNumber);

  useEffect(() => {
    setLiveUnlockedHr(unlockedHrNumber);
    setLiveClaimableHr(claimableHrNumber);
  }, [unlockedHrNumber, claimableHrNumber]);

  const claimableBig = claimableData ?? 0n;

  const canClaim =
    isConnected &&
    !merkleLoading &&
    !merkleError &&
    totalAllocationWei > 0n &&
    claimableBig > 0n;

  const [isClaiming, setIsClaiming] = useState(false);
  const [hasShared, setHasShared] = useState(false); // 👈 مرحلة الشير قبل الكليم

  const hasAllocation = isConnected && isEligible && totalHrNumber > 0;

  const alreadyClaimedDisplay =
    liveUnlockedHr > liveClaimableHr
      ? (liveUnlockedHr - liveClaimableHr).toFixed(5)
      : "0.00000";

  const isBeforeTGE = Date.now() < TGE_TIMESTAMP;

  // ========== STAKING: كم ETH عامل ستيكنغ؟ ==========
  const { data: stakedData } = useReadContract({
    abi: STAKING_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "userStaked",
    args: [address || ZERO_ADDRESS],
  });

  const stakedEthNumber =
    stakedData && stakedData > 0n ? Number(formatUnits(stakedData, 18)) : 0;

  let stakeBonusPercent = 0;
  let stakeImpactLabel = "No boost yet";

  if (stakedEthNumber >= 2) {
    stakeBonusPercent = 100;
    stakeImpactLabel = "Max boost — full unlock";
  } else if (stakedEthNumber >= 1.5) {
    stakeBonusPercent = 70;
    stakeImpactLabel = "Diamond tier";
  } else if (stakedEthNumber >= 1) {
    stakeBonusPercent = 40;
    stakeImpactLabel = "Platinum tier";
  } else if (stakedEthNumber >= 0.5) {
    stakeBonusPercent = 20;
    stakeImpactLabel = "Gold tier";
  } else if (stakedEthNumber >= 0.3) {
    stakeBonusPercent = 10;
    stakeImpactLabel = "Silver tier";
  } else if (stakedEthNumber >= 0.1) {
    stakeBonusPercent = 5;
    stakeImpactLabel = "Bronze tier";
  }

  const handleClaim = async () => {
    if (!isConnected) {
      showToast?.("error", "Please connect your wallet first.");
      return;
    }

    if (!merkleEntry || totalAllocationWei === 0n) {
      showToast?.("error", "No allocation found for this wallet.");
      return;
    }

    if (!claimableBig || claimableBig === 0n) {
      showToast?.("error", "Nothing to claim at this time.");
      return;
    }

    // ✅ NEW: تأكد إن الرسوم انقرت من العقد (خصوصًا لو الرسوم > 0)
    if (claimFeeWeiData === undefined) {
      showToast?.("error", "Unable to load claim fee. Please try again.");
      return;
    }

    // 👇 أول ضغطة: شير على X، ثاني ضغطة: Claim فعلي
    if (!hasShared) {
      const totalDisplay = totalHrNumber.toFixed(5);
      const unlockedDisplay = liveUnlockedHr.toFixed(5);
      const claimableDisplay = liveClaimableHr.toFixed(5);
      const alreadyDisplay = alreadyClaimedDisplay;

      const tweetText = encodeURIComponent(
        `Just checked my $HR airdrop on HeatRush! 🔥

Total allocation: ${totalDisplay} HR
Unlocked so far: ${unlockedDisplay} HR
Already claimed: ${alreadyDisplay} HR
Currently claimable: ${claimableDisplay} HR

@Rush_finance

Claim & track your airdrop here 👇
https://heatrush.xyz



#HeatRush #Airdrop #Base #Crypto #HR #Web3`
      );

      const tweetUrl = `https://x.com/intent/tweet?text=${tweetText}`;
      window.open(tweetUrl, "_blank");
      setHasShared(true);
      return;
    }

    // 👇 هنا المرحلة الثانية: تنفيذ الكليم على العقد
    try {
      setIsClaiming(true);

      await writeContractAsync({
        abi: CLAIM_ABI,
        address: CLAIM_ADDRESS,
        functionName: "claim",
        args: [totalAllocationWei, merkleEntry.proof || []],
        // ✅ NEW: ادفع الرسوم
        value: claimFeeWei,
      });

      // ✅ إشعار جميل من نفس نظام التوست عندك
      showToast?.("success", "Claim transaction sent!");
    } catch (err) {
      console.error(err);
      showToast?.(
        "error",
        err?.shortMessage || err?.message || "Failed to send claim tx"
      );
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="airdrop-page">
      {/* ===== Hero Card أعلى الصفحة ===== */}

      {/* ✅ Season 2 Live Card (3D Tilt) */}
      <Tilt3DCard
        to="/season2"
        kickerIcon={<Layers size={16} />}
        kickerText="Season 2"
        title="Season 2 is live"
        subtitle="Follow the eligibility path: Verify wallet → Stake → Earn XP → Presale ≥ 100 HR."
        buttonText="Go to Season 2"
      />

      <div className="card airdrop-hero-card">
        <div className="airdrop-hero-main">
          <div>
            <h1 className="airdrop-hero-title">$HR Airdrop Center</h1>
            <p className="airdrop-hero-subtitle">
              Track your personal allocation, unlock schedule, and claim status
              - all in one place.
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
                  "airdrop-hero-pill " + (hasAllocation ? "pill-ok" : "pill-warn")
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
              <p className="airdrop-msg loading">⏳ Fetching your allocation...</p>
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
                  <p className="airdrop-loading">Loading your allocation...</p>
                )}

                {airdropError && (
                  <p className="airdrop-error">{String(airdropError)}</p>
                )}

                {!airdropLoading && !airdropError && airdrop && (
                  <>
                    <div className="airdrop-main-row">
                      <div className="airdrop-main-item">
                        <span className="airdrop-label">Points snapshot</span>
                        <span className="airdrop-value">{points}</span>
                      </div>

                      <div className="airdrop-main-item">
                        <span className="airdrop-label">Base allocation</span>
                        <span className="airdrop-value orange">{hrBase} HR</span>
                      </div>

                      <div className="airdrop-main-item">
                        <span className="airdrop-label">Power-up stake target</span>
                        <span className="airdrop-value">{requiredStake} ETH</span>
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

                            <div className="tier-bonus">+{tier.bonusPercent}% HR bonus</div>

                            {tier.instantUnlock && (
                              <div className="tier-tag">🔓 100% unlock at TGE</div>
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
                any unlocked balance at any time - no deadlines, no penalties.
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
                    unlocks - up to <strong>100% instantly</strong> for the top tier.
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

              {/* ✅ NEW: عرض رسوم المطالبة */}
              <p className="claim-note" style={{ marginTop: "12px" }}>
                Claim fee: <strong>{claimFeeEth}</strong> ETH
              </p>

              {/* 👇 تأثير الستيك */}
              <div className="claim-stake-impact" style={{ marginTop: "16px" }}>
                <div className="claim-metric">
                  <span className="claim-label">Your staked ETH</span>
                  <span className="claim-value">
                    {stakedEthNumber.toFixed(4)}{" "}
                    <span className="claim-unit">ETH</span>
                  </span>
                </div>

                <div className="claim-metric">
                  <span className="claim-label">Stake impact</span>
                  <span className="claim-value">
                    {stakeBonusPercent > 0
                      ? `+${stakeBonusPercent}% unlock boost · ${stakeImpactLabel}`
                      : "No boost yet - stake more ETH to power up your tier and reach up to 100% instant unlock"}
                  </span>
                </div>
              </div>

              {/* زر واحد فقط: أول ضغطة شير، ثاني ضغطة Claim */}
              <button
                className={`stake-btn ${!canClaim || isClaiming ? "disabled-btn" : ""}`}
                onClick={handleClaim}
                disabled={!canClaim || isClaiming}
                style={{ marginTop: "18px" }}
              >
                {isClaiming
                  ? "Processing..."
                  : !hasShared
                  ? "Share & unlock claim"
                  : `Claim ${claimableHr} HR`}
              </button>

              <p className="claim-note" style={{ marginTop: "12px" }}>
                Your HR unlocks gradually:
                <br />• <strong>60%</strong> over the first 3 months
                <br />• <strong>40%</strong> over the next 6 months
                <br />
                Staking more ETH on HeatRush can accelerate this unlock through
                bonus tiers - higher tiers unlock a larger portion earlier.
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
            Your staked ETH on HeatRush acts as a <strong>power-up</strong>, boosting
            how fast your HR unlocks based on the stake tier you reach.
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

/* ========= Component: 3D Tilt CTA Card (Season 2) ========= */
function Tilt3DCard({ to, kickerIcon, kickerText, title, subtitle, buttonText }) {
  const ref = useRef(null);
  const [tiltStyle, setTiltStyle] = useState({ marginBottom: 14 });

  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotY = (px - 0.5) * 10;
    const rotX = (0.5 - py) * 10;

    setTiltStyle({
      marginBottom: 14,
      transform: `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-2px)`,
    });
  }, []);

  const onLeave = useCallback(() => {
    setTiltStyle({ marginBottom: 14, transform: "perspective(900px) rotateX(0deg) rotateY(0deg)" });
  }, []);

  return (
    <Link
      ref={ref}
      to={to}
      className="s2-tilt-card"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={tiltStyle}
    >
      <div className="s2-tilt-card-glow" aria-hidden="true" />
      <div className="s2-tilt-card-body">
        <div className="s2-tilt-card-kicker">
          {kickerIcon} <strong>{kickerText}</strong>
        </div>

        <div className="s2-tilt-card-title">{title} 🚀</div>
        <div className="s2-tilt-card-sub">{subtitle}</div>

        <div className="s2-tilt-card-btn">
          <span>{buttonText}</span>
          <ExternalLink size={16} />
        </div>
      </div>
    </Link>
  );
}
