// src/pages/referral/ReferralPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";

import {
  fetchReferralCode,
  fetchReferralStats,
  fetchReferralLeaderboard, // 🚀 جديد
} from "../../lib/referralApi.js";

import "../../styles/referral.css";

const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "0";
  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: decimals,
  });
};

const ReferralPage = ({ showToast }) => {
  const { address, isConnected } = useAccount();

  const [loading, setLoading] = useState(false);
  const [codeData, setCodeData] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  // 🆕 حالات الليدر بورد
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbLoading, setLbLoading] = useState(false);
  const [lbError, setLbError] = useState(null);

  const shortAddress = useMemo(() => {
    if (!address) return "Not connected";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  const referralUrl = useMemo(() => {
    if (!codeData?.code) return "";
    const base = window.location.origin;
    return `${base}/dashboard?ref=${codeData.code}`;
  }, [codeData]);

  useEffect(() => {
    const load = async () => {
      if (!address || !isConnected) {
        setCodeData(null);
        setStats(null);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [codeRes, statsRes] = await Promise.all([
          fetchReferralCode(address),
          fetchReferralStats(address),
        ]);

        setCodeData(codeRes);
        setStats(statsRes);
      } catch (err) {
        console.error("Failed to load referral data:", err);
        setError(err.message || "Failed to load referrals");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [address, isConnected]);

  // 🆕 تحميل ليدر بورد التوب 10
  useEffect(() => {
    const loadLeaderboard = async () => {
      setLbLoading(true);
      setLbError(null);
      try {
        const lbRes = await fetchReferralLeaderboard();
        setLeaderboard(lbRes.items || []);
      } catch (err) {
        console.error("Failed to load referral leaderboard:", err);
        setLbError(err.message || "Failed to load leaderboard");
      } finally {
        setLbLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  const handleCopyCode = () => {
    if (!codeData?.code) return;
    navigator.clipboard
      .writeText(codeData.code)
      .then(() => {
        showToast?.("success", "Referral code copied!");
      })
      .catch(() => {
        showToast?.("info", "Copied: " + codeData.code);
      });
  };

  const handleCopyLink = () => {
    if (!referralUrl) return;
    navigator.clipboard
      .writeText(referralUrl)
      .then(() => {
        showToast?.("success", "Referral link copied!");
      })
      .catch(() => {
        showToast?.("info", "Copied: " + referralUrl);
      });
  };

  const totalReferrals = stats?.totals?.totalReferrals ?? 0;
  const totalQualified = stats?.totals?.totalQualified ?? 0;
  const pointsFromReferrals = stats?.totals?.pointsFromReferrals ?? 0;
  const xpFromReferrals = stats?.totals?.xpFromReferrals ?? 0;

  const milestone3Pct = Math.min(100, Math.round((totalQualified / 3) * 100));
  const milestone10Pct = Math.min(
    100,
    Math.round((totalQualified / 10) * 100)
  );
  const milestone50Pct = Math.min(
    100,
    Math.round((totalQualified / 50) * 100)
  );

  // 🆕 تقصير عنوان المحفظة للّيدر بورد
  const shortenWallet = (w) => {
    if (!w || typeof w !== "string") return w || "";
    if (!w.startsWith("0x") || w.length <= 10) return w;
    return `${w.slice(0, 6)}...${w.slice(-4)}`;
  };

  return (
    <div className="referral-page">
      {/* خلفية ديكورية 3D */}
      <div className="referral-bg-blur referral-bg-blur-1" />
      <div className="referral-bg-blur referral-bg-blur-2" />
      <div className="referral-grid-orbit">
        <div className="orbit-circle orbit-circle-lg" />
        <div className="orbit-circle orbit-circle-md" />
        <div className="orbit-circle orbit-circle-sm" />
      </div>

      {/* HERO */}
      <div className="referral-hero">
        <div className="referral-hero-left">
          <h1 className="referral-title">
            Referral <span>Boost</span> Engine
          </h1>
          <p className="referral-subtitle">
            Turn your network into <span className="orange">real yield</span>.
            Share your personal invite link and earn{" "}
            <span className="orange">points</span> &amp;{" "}
            <span className="orange">XP</span> when friends become qualified
            HeatRush users.
          </p>

          <div className="referral-hero-stats">
            <div className="referral-hero-pill">
              <span className="pill-label">Wallet</span>
              <span className="pill-value">{shortAddress}</span>
            </div>
            <div className="referral-hero-pill">
              <span className="pill-label">Qualified referrals</span>
              <span className="pill-value strong">
                {formatNumber(totalQualified, 0)}
              </span>
            </div>
            <div className="referral-hero-pill">
              <span className="pill-label">XP from referrals</span>
              <span className="pill-value strong">
                {formatNumber(xpFromReferrals, 0)} XP
              </span>
            </div>
          </div>

          {!isConnected && (
            <p className="referral-info hero-info">
              Connect your wallet to generate your referral code and start
              tracking your invite performance in real time.
            </p>
          )}

          {error && (
            <p className="referral-error hero-error">
              {error} – please refresh or reconnect your wallet.
            </p>
          )}
        </div>

        {/* 3D visual side */}
        <div className="referral-hero-right">
          <div className="referral-hero-scene">
            <div className="referral-card-fake referral-card-layer layer-top">
              <span className="fake-card-label">Qualified Referral</span>
              <span className="fake-card-value">+200 pts · +2 XP</span>
            </div>
            <div className="referral-card-fake referral-card-layer layer-middle">
              <span className="fake-card-label">Milestone</span>
              <span className="fake-card-value">+10 · +30 · +400 XP</span>
            </div>
            <div className="referral-card-fake referral-card-layer layer-bottom">
              <span className="fake-card-label">Your Code</span>
              <span className="fake-card-value">
                {codeData?.code || "HR-XXXXX"}
              </span>
            </div>
            <div className="referral-hero-orbit-dot dot-1" />
            <div className="referral-hero-orbit-dot dot-2" />
            <div className="referral-hero-orbit-dot dot-3" />
          </div>
        </div>
      </div>

      {/* GRID CARDS */}
      <div className="referral-grid">
        {/* CARD 1 — REFERRAL CODE & LINK */}
        <div className="card referral-card referral-card-3d">
          <div className="referral-card-header">
            <div>
              <h2>Your Invite Code</h2>
              <p className="referral-card-subtitle">
                Share this code or link with friends. Every qualified wallet
                boosts your HeatRush journey.
              </p>
            </div>
            <span className="referral-chip primary">
              {loading
                ? "Loading..."
                : codeData?.code
                ? "Ready to share"
                : "Generating"}
            </span>
          </div>

          {codeData?.code ? (
            <>
              <div className="referral-code-box">
                <span className="referral-code-label">Referral code</span>
                <div className="referral-code-row">
                  <span className="referral-code-value">
                    {codeData.code}
                  </span>
                  <button
                    className="secondary-btn referral-copy-btn"
                    onClick={handleCopyCode}
                  >
                    Copy code
                  </button>
                </div>
              </div>

              <div className="referral-link-box">
                <span className="referral-code-label">Referral link</span>
                <div className="referral-link-row">
                  <span className="referral-link-value">
                    {referralUrl || "—"}
                  </span>
                  <button
                    className="secondary-btn referral-copy-btn"
                    onClick={handleCopyLink}
                    disabled={!referralUrl}
                  >
                    Copy link
                  </button>
                </div>
              </div>

              <p className="referral-note">
                When someone opens your link and later becomes{" "}
                <strong>qualified</strong> (by staking, joining presale, or
                reaching enough XP), you earn{" "}
                <strong>+200 points + 2 XP</strong> per qualified referral – plus
                milestone bonus XP.
              </p>
            </>
          ) : (
            <p className="referral-note">
              {loading
                ? "Generating your personal referral code…"
                : "No referral code yet. Try reconnecting your wallet."}
            </p>
          )}
        </div>

        {/* CARD 2 — STATS */}
        <div className="card referral-card referral-card-3d">
          <div className="referral-card-header">
            <div>
              <h2>Referral Performance</h2>
              <p className="referral-card-subtitle">
                Live view of how many wallets you brought in – and how many of
                them actually did something.
              </p>
            </div>
            <span className="referral-chip neutral">Live stats</span>
          </div>

          <div className="referral-stats-grid">
            <div className="referral-stat-block">
              <span className="referral-stat-label">Total referrals</span>
              <span className="referral-stat-value">
                {formatNumber(totalReferrals, 0)}
              </span>
            </div>

            <div className="referral-stat-block">
              <span className="referral-stat-label">Qualified referrals</span>
              <span className="referral-stat-value highlight">
                {formatNumber(totalQualified, 0)}
              </span>
            </div>

            <div className="referral-stat-block">
              <span className="referral-stat-label">
                Points from referrals
              </span>
              <span className="referral-stat-value">
                {formatNumber(pointsFromReferrals, 0)} pts
              </span>
            </div>

            <div className="referral-stat-block">
              <span className="referral-stat-label">XP from referrals</span>
              <span className="referral-stat-value">
                {formatNumber(xpFromReferrals, 0)} XP
              </span>
            </div>
          </div>

          <p className="referral-note">
            Qualified referrals are wallets that actually{" "}
            <strong>do</strong> something real in HeatRush: they{" "}
            <strong>stake</strong>, <strong>join the presale</strong>, or{" "}
            <strong>hit XP milestones</strong>. Bots and inactive wallets
            don&apos;t move your needle.
          </p>
        </div>

        {/* CARD 3 — MILESTONES */}
        <div className="card referral-card referral-card-3d">
          <div className="referral-card-header">
            <div>
              <h2>Milestone XP Boosts</h2>
              <p className="referral-card-subtitle">
                Hit key invite milestones to unlock one-time XP boosts on top of
                your base referral rewards.
              </p>
            </div>
            <span className="referral-chip gold">Bonus XP</span>
          </div>

          <div className="referral-milestones">
            <div className="referral-milestone-row">
              <div className="referral-milestone-info">
                <span className="referral-milestone-title">
                  First 3 qualified referrals
                </span>
                <span className="referral-milestone-reward">
                  +10 bonus XP (once)
                </span>
              </div>
              <div className="referral-milestone-progress">
                <div className="referral-milestone-bar">
                  <div
                    className="referral-milestone-fill"
                    style={{ width: `${milestone3Pct}%` }}
                  />
                </div>
                <span className="referral-milestone-count">
                  {Math.min(totalQualified, 3)} / 3
                </span>
              </div>
            </div>

            <div className="referral-milestone-row">
              <div className="referral-milestone-info">
                <span className="referral-milestone-title">
                  First 10 qualified referrals
                </span>
                <span className="referral-milestone-reward">
                  +30 bonus XP (once)
                </span>
              </div>
              <div className="referral-milestone-progress">
                <div className="referral-milestone-bar">
                  <div
                    className="referral-milestone-fill"
                    style={{ width: `${milestone10Pct}%` }}
                  />
                </div>
                <span className="referral-milestone-count">
                  {Math.min(totalQualified, 10)} / 10
                </span>
              </div>
            </div>

            <div className="referral-milestone-row">
              <div className="referral-milestone-info">
                <span className="referral-milestone-title">
                  First 50 qualified referrals
                </span>
                <span className="referral-milestone-reward">
                  +400 bonus XP (once)
                </span>
              </div>
              <div className="referral-milestone-progress">
                <div className="referral-milestone-bar">
                  <div
                    className="referral-milestone-fill"
                    style={{ width: `${milestone50Pct}%` }}
                  />
                </div>
                <span className="referral-milestone-count">
                  {Math.min(totalQualified, 50)} / 50
                </span>
              </div>
            </div>
          </div>

          <p className="referral-note">
            Each qualified referral always gives{" "}
            <strong>+200 points + 2 XP</strong>. On top of that, you unlock{" "}
            <strong>one-time XP boosts</strong> at 3, 10, and 50 qualified
            referrals. Grind mode = ON.
          </p>
        </div>

      </div>

 
{/* 🆕 CARD 4 — TOP 10 REFERRAL LEADERBOARD */}


  {lbLoading && <p className="referral-note">Loading leaderboard…</p>}

  {lbError && !lbLoading && (
    <p className="referral-note error">{lbError}</p>
  )}

  {!lbLoading && !lbError && leaderboard.length === 0 && (
    <p className="referral-note">
      No qualified referrals yet. Be the first one on the board.
    </p>
  )}

  {!lbLoading && !lbError && leaderboard.length > 0 && (
    <div className="ref-leader-card">
      {/* الهيدر */}
      <div className="ref-leader-header">
        <div className="ref-leader-title-row">
          <h3>Top 10 Referrers</h3>
          <span className="ref-leader-pill">Global leaderboard</span>
        </div>
        <p>Most active HeatRush referrers by qualified referrals</p>
      </div>

      {/* القائمة */}
      <div className="ref-leader-list">
        {leaderboard.map((row, idx) => {
          const rank = idx + 1;
          const isTop3 = rank <= 3;
          const rankClass =
            rank === 1 ? "rank-1" : rank === 2 ? "rank-2" : rank === 3 ? "rank-3" : "";

          return (
            <div key={row.wallet || idx} className="ref-leader-row">
              {/* الرانك */}
              <div className="ref-leader-rank">
                <div
                  className={`ref-rank-badge ${rankClass} ${
                    isTop3 ? "top-rank" : ""
                  }`}
                >
                  #{rank}
                </div>
              </div>

              {/* العنوان + الكود */}
              <div className="ref-leader-address">
                <div className="ref-addr-main">
                  {shortenWallet(row.wallet)}
                </div>
                {row.code && (
                  <div className="ref-addr-label">
                    Code: <span>{row.code}</span>
                  </div>
                )}
              </div>

              {/* عدد الريفيرالز */}
              <div className="ref-leader-amount">
                <div className="ref-amount-value">
                  {formatNumber(row.qualifiedCount || 0, 0)}
                </div>
                <div className="ref-amount-unit">qualified</div>
              </div>
            </div>
          );
        })}
      </div>
        <p className="referral-note">
    Leaderboard is based on <strong>qualified referrals only</strong> (real
    users who staked, joined the presale, or reached enough XP).
  </p>
    </div>
  )}











    </div>
  );
};

export default ReferralPage;
