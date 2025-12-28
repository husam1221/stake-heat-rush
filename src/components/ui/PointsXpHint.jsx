import React from "react";

export function PointsXpHint() {
  return (
    <div className="points-xp-hint">
      <span><strong>Points</strong> = leaderboard / campaigns</span>
      <span className="dot">•</span>
      <span><strong>XP</strong> = progression / tiers / eligibility boosts</span>
    </div>
  );
}
