// src/components/tasks/DailyTankCard.jsx
import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { claimDailyTankApi } from "../../lib/xpApi.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const DAILY_REWARD_POINTS = 200;
const DAILY_REWARD_XP = 3;

const formatCountdown = (ms) => {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(
    2,
    "0"
  )}:${String(s).padStart(2, "0")}`;
};

const DailyTankCard = ({ onClaim, showToast }) => {
  const { address } = useAccount();
  const storageKey = address
    ? `hr_daily_tank_v1_${address.toLowerCase()}`
    : null;

  const [points, setPoints] = useState(0);
  const [lastClaim, setLastClaim] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [isClaiming, setIsClaiming] = useState(false);

  // تحميل من localStorage
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.points !== undefined) setPoints(parsed.points);
      if (parsed.lastClaim) setLastClaim(parsed.lastClaim);
    } catch (e) {
      console.warn("Failed to load daily tank data", e);
    }
  }, [storageKey]);

  // تحديث الوقت كل ثانية
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // حساب نسبة التعبئة
  let progress = 1;
  let isReady = true;
  let timeLeftMs = 0;

  if (lastClaim) {
    const elapsed = now - lastClaim;
    progress = Math.max(0, Math.min(1, elapsed / DAY_MS));
    isReady = progress >= 1;
    const nextAt = lastClaim + DAY_MS;
    timeLeftMs = Math.max(nextAt - now, 0);
  }

  const pct = Math.round(progress * 100);

  const handleClaim = async () => {
    if (!address) {
      showToast?.("error", "Connect your wallet to claim your daily reward.");
      return;
    }
    if (!isReady || isClaiming) {
      return;
    }

    try {
      setIsClaiming(true);

      // نضرب الـ API تبع الـ XP
      const result = await claimDailyTankApi(address);
      const totals = result?.totals || {};
      const newPointsFromApi =
        typeof totals.points_offchain === "number"
          ? totals.points_offchain
          : points + DAILY_REWARD_POINTS;

      const ts = Date.now();

      setPoints(newPointsFromApi);
      setLastClaim(ts);

      if (storageKey) {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({ points: newPointsFromApi, lastClaim: ts })
        );
      }

      if (onClaim) {
        onClaim(
          DAILY_REWARD_POINTS,
          newPointsFromApi,
          totals.xp_offchain ?? null
        );
      }
    } catch (err) {
      console.error("Daily tank claim failed:", err);
      showToast?.(
        "error",
        err?.message || "Failed to claim daily tank reward."
      );
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="card daily-tank-card">
      <div className="daily-tank-header">
        <div>
          <h2 className="daily-tank-title">Daily Fuel Tank</h2>
          <p className="daily-tank-subtitle">
         The tank refills gradually after each claim.
          </p>
        </div>

        <div className="daily-tank-pill">
          {isReady ? "Ready to claim" : "Refilling"}
        </div>
      </div>

      <div className="daily-tank-body">
        {/* الخزان نفسه */}
        <div className="tank-visual">
          <div className="tank-shell">
            <div className="tank-inner">
              <div
                className="tank-fill"
                style={{ "--fill": `${progress * 100}%` }}
              />
              <div className="tank-glow" />
            </div>
          </div>

          <div className="tank-percent">
            {isReady ? `+${DAILY_REWARD_POINTS} pts ready` : `${pct}% filled`}
          </div>
          <div className="tank-caption">
            {lastClaim
              ? isReady
                ? "Tap claim to collect your daily boost."
                : `Next full tank in ${formatCountdown(timeLeftMs)}`
              : "First time here? Your first reward is ready now."}
          </div>
        </div>

        {/* معلومات جانبية */}
        <div className="tank-info">
          <div className="tank-info-row">
            <span className="tank-info-label">Total tank points</span>
            <span className="tank-info-value">
              {points.toLocaleString("en-US")} pts
            </span>
          </div>

          <div className="tank-info-row">
            <span className="tank-info-label">Daily reward</span>
            <span className="tank-info-value highlight">
              +{DAILY_REWARD_POINTS} pts / day
            </span>
          </div>

          <div className="tank-info-row">
            <span className="tank-info-label">Daily XP</span>
            <span className="tank-info-value highlight">
              +{DAILY_REWARD_XP} XP / day
            </span>
          </div>

          <div className="tank-info-row">
            <span className="tank-info-label">Cooldown</span>
            <span className="tank-info-value">
              24h between each claim
            </span>
          </div>
        </div>
      </div>

      <button
        className={`stake-btn daily-tank-btn ${
          !isReady || isClaiming ? "disabled-btn" : ""
        }`}
        onClick={handleClaim}
        disabled={!isReady || isClaiming}
      >
        {isClaiming
          ? "Claiming..."
          : isReady
          ? `Claim ${DAILY_REWARD_POINTS} pts + ${DAILY_REWARD_XP} XP`
          : "Tank is refilling..."}
      </button>
    </div>
  );
};

export default DailyTankCard;
