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

const DailyTankCard = ({ onClaim, showToast, dailyTank = null }) => {
  const { address } = useAccount();

  const storageKey = address
    ? `hr_daily_tank_v1_${address.toLowerCase()}`
    : null;

  const [points, setPoints] = useState(0);
  const [lastClaim, setLastClaim] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [isClaiming, setIsClaiming] = useState(false);

  // تحميل بيانات الخزان.
  // بيانات السيرفر لها الأولوية، و localStorage يبقى نسخة مساعدة.
  useEffect(() => {
    if (!storageKey) {
      setPoints(0);
      setLastClaim(null);
      return;
    }

    let localPoints = 0;
    let localLastClaim = null;

    try {
      const raw = window.localStorage.getItem(storageKey);

      if (raw) {
        const parsed = JSON.parse(raw);

        if (typeof parsed.points === "number") {
          localPoints = parsed.points;
        }

        if (parsed.lastClaim) {
          localLastClaim = parsed.lastClaim;
        }
      }
    } catch (e) {
      console.warn("Failed to load daily tank data", e);
    }

    // إذا السيرفر رجّع dailyTank، نعتبره مصدر الحقيقة.
    if (dailyTank) {
      const serverPoints =
        typeof dailyTank.totalPoints === "number"
          ? dailyTank.totalPoints
          : localPoints;

      const serverLastClaim =
        typeof dailyTank.lastClaimAt === "number" && dailyTank.lastClaimAt > 0
          ? dailyTank.lastClaimAt * 1000
          : localLastClaim;

      setPoints(serverPoints);
      setLastClaim(serverLastClaim);

      // نحدّث النسخة المحلية بنفس بيانات السيرفر.
      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({
            points: serverPoints,
            lastClaim: serverLastClaim,
          })
        );
      } catch (e) {
        console.warn("Failed to save daily tank data", e);
      }

      return;
    }

    // إذا ما وصلنا شيء من السيرفر، نستخدم النسخة المحلية مؤقتًا.
    setPoints(localPoints);
    setLastClaim(localLastClaim);
  }, [storageKey, dailyTank]);

  // تحديث الوقت كل ثانية للعداد فقط.
  // هذا لا يرسل أي طلب إلى السيرفر.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(id);
  }, []);

  // حساب نسبة التعبئة.
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
      showToast?.(
        "error",
        "Connect your wallet to claim your daily reward."
      );
      return;
    }

    if (!isReady || isClaiming) {
      return;
    }

    try {
      setIsClaiming(true);

      const result = await claimDailyTankApi(address);

      const totals = result?.totals || {};
      const tank = result?.tank || {};
      const added = result?.added || {};

      // الـ Worker الحالي يرجّع:
      // totals.points
      // totals.xp
      //
      // ونحتفظ بقراءتهم حتى تبقى الواجهة متوافقة
      // مع شكل الـ Response الحالي بدون تغيير الـ API.
      const totalPointsOffchain =
        typeof totals.points === "number" ? totals.points : null;

      const totalXpOffchain =
        typeof totals.xp === "number" ? totals.xp : null;

      // الرقم المعروض في "Total tank points"
      // يجب أن يأتي من بيانات الخزان نفسه.
      const newTankPoints =
        typeof tank.totalPoints === "number"
          ? tank.totalPoints
          : points + DAILY_REWARD_POINTS;

      // الـ Worker يرجّع lastClaimAt بالثواني.
      // JavaScript Date يستخدم milliseconds.
      const newLastClaim =
        typeof tank.lastClaimAt === "number" && tank.lastClaimAt > 0
          ? tank.lastClaimAt * 1000
          : Date.now();

      const gainedPoints =
        typeof added.points === "number"
          ? added.points
          : DAILY_REWARD_POINTS;

      const gainedXp =
        typeof added.xp === "number"
          ? added.xp
          : DAILY_REWARD_XP;

      setPoints(newTankPoints);
      setLastClaim(newLastClaim);

      if (storageKey) {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({
            points: newTankPoints,
            lastClaim: newLastClaim,
          })
        );
      }

      if (onClaim) {
        onClaim(
          gainedPoints,
          totalPointsOffchain ?? newTankPoints,
          gainedXp,
          totalXpOffchain
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
            {isReady
              ? `+${DAILY_REWARD_POINTS} pts ready`
              : `${pct}% filled`}
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
            <span className="tank-info-label">
              Total tank points
            </span>

            <span className="tank-info-value">
              {points.toLocaleString("en-US")} pts
            </span>
          </div>

          <div className="tank-info-row">
            <span className="tank-info-label">
              Daily reward
            </span>

            <span className="tank-info-value highlight">
              +{DAILY_REWARD_POINTS} pts / day
            </span>
          </div>

          <div className="tank-info-row">
            <span className="tank-info-label">
              Daily XP
            </span>

            <span className="tank-info-value highlight">
              +{DAILY_REWARD_XP} XP / day
            </span>
          </div>

          <div className="tank-info-row">
            <span className="tank-info-label">
              Cooldown
            </span>

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