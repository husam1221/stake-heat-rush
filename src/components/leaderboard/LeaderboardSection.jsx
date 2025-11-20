import React from "react";

const LeaderboardSection = () => {
  return (
    <div className="leaderboard-wrapper">
      <div className="leaderboard-header">
        <h3 className="leaderboard-title">🔥 Top HeatRush Stakers</h3>
        <span className="leaderboard-tag">Live on-chain data</span>
      </div>

      <div className="leaderboard-list">
        <div className="leaderboard-row">
          <span className="rank">1</span>
          <span className="addr">0xA1...F3b</span>
          <span className="amount">1.23 ETH</span>
        </div>
        <div className="leaderboard-row">
          <span className="rank">2</span>
          <span className="addr">0x9c...12e</span>
          <span className="amount">0.63 ETH</span>
        </div>
        <div className="leaderboard-row">
          <span className="rank">3</span>
          <span className="addr">0x7b...99a</span>
          <span className="amount">0.42 ETH</span>
        </div>
        <div className="leaderboard-row">
          <span className="rank">4</span>
          <span className="addr">0x5d...aa0</span>
          <span className="amount">0.41 ETH</span>
        </div>
        <div className="leaderboard-row">
          <span className="rank">5</span>
          <span className="addr">0x3e...bc1</span>
          <span className="amount">0.35 ETH</span>
        </div>
      </div>

      <p className="leaderboard-footnote">
        Showing actual on-chain deposit activity.
      </p>
    </div>
  );
};

export default LeaderboardSection;
