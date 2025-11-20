import React from "react";

const ProtocolStats = () => {
  return (
    <>
      <div className="hr-total-stats-standalone">
        <div className="hr-stat-item">
          <div className="hr-icon">Total Deposited</div>
          <p className="hr-value">21.19 ETH</p>
        </div>
        <div className="hr-divider"></div>
        <div className="hr-stat-item">
          <div className="hr-icon">Total Users</div>
          <p className="hr-value">445</p>
        </div>
        <div className="hr-divider"></div>
        <div className="hr-stat-item">
          <div className="hr-icon">Total Transactions</div>
          <p className="hr-value">726</p>
        </div>
      </div>

      <div className="hr-info-cards-wrapper">
        <div className="hr-info-card">
          <div className="hr-flame">Protocol APR</div>
          <div className="hr-big-value">18%</div>
          <p>
            Dynamic emissions tuned for sustainable, long-term ecosystem growth.
          </p>
        </div>

        <div className="hr-info-card">
          <div className="hr-flame">Network</div>
          <div className="hr-big-value">Base</div>
          <p>
            Low fees, high throughput, and Ethereum L2 security backed by
            Coinbase.
          </p>
        </div>

        <div className="hr-info-card">
          <div className="hr-flame">Lockup</div>
          <div className="hr-big-value">Flexible</div>
          <p>
            Staked ETH is managed by the protocol’s smart contract. Unstaking
            and claiming will be available soon.
          </p>
        </div>
      </div>
    </>
  );
};

export default ProtocolStats;
