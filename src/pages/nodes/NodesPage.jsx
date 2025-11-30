// src/pages/nodes/NodesPage.jsx
import React from "react";
import { useAccount } from "wagmi";
import "../../styles/nodes.css";

const NodesPage = () => {
  const { address, isConnected } = useAccount();

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Not connected";

  return (
    <div className="nodes-page">
      {/* HEADER / INTRO */}
      <div className="card nodes-hero-card">
        <div className="nodes-hero-left">
          <h1 className="nodes-title">
            HeatRush <span className="orange">Nodes</span> & Boosters
          </h1>
          <p className="nodes-subtitle">
            Nodes are long-term boosters for your on-chain identity inside
            HeatRush. They don&apos;t just sit in your wallet – they amplify
            your <span className="orange">XP</span>,{" "}
            <span className="orange">tiers</span>, and future{" "}
            <span className="orange">$HR</span> chances.
          </p>

          <ul className="nodes-hero-list">
            <li>
              Permanent, wallet-bound boosters (non-transferable design later).
            </li>
            <li>
              Stackable XP multipliers and priority in future HeatRush drops.
            </li>
            <li>
              One free node for every address + optional paid higher tiers.
            </li>
          </ul>
        </div>

        <div className="nodes-hero-right">
          <div className="nodes-hero-pill">
            <span className="pill-label">Wallet</span>
            <span className="pill-value">
              {isConnected ? shortAddress : "Connect wallet"}
            </span>
          </div>

          <div className="nodes-hero-pill">
            <span className="pill-label">Network</span>
            <span className="pill-value">Base Mainnet</span>
          </div>

          <div className="nodes-hero-pill outline pulse">
            <span className="pill-label">Status</span>
            <span className="pill-value">In Development · Coming Soon</span>
          </div>

          <p className="nodes-hero-note">
            In this first version, nodes are{" "}
            <strong>UI-only / preview mode</strong>. Once the on-chain Nodes
            contract is live, these tiers will connect directly to real XP
            boosts and profile badges.
          </p>
        </div>
      </div>

      {/* NODES GRID */}
      <div className="nodes-grid">
        {/* FREE NODE */}
        <div className="card node-card node-free">
          <div className="node-header">
            <div>
              <h2 className="node-name">Founders Signal Node</h2>
              <p className="node-tagline">
                Free entry node for every early HeatRush address.
              </p>
            </div>
            <span className="node-badge free">Free</span>
          </div>

          <div className="node-meta-row">
            <div className="node-meta-item">
              <span className="node-meta-label">Price</span>
              <span className="node-meta-value"> FREE </span>
            </div>
            <div className="node-meta-item">
              <span className="node-meta-label">XP Boost</span>
              <span className="node-meta-value">+3% global XP</span>
            </div>
            <div className="node-meta-item">
              <span className="node-meta-label">Status</span>
              <span className="node-meta-value">Planned</span>
            </div>
          </div>

          <ul className="node-benefits">
            <li>Marks your wallet as a verified early HeatRush participant.</li>
            <li>Small passive XP boost on all staking & referral XP.</li>
            <li>Will show as a permanent badge inside your Profile page.</li>
          </ul>

          <button className="node-cta-btn disabled">
            Free claim will be enabled later
          </button>

          <p className="node-footnote">
            Once the Nodes contract is deployed, every connected wallet will be
            able to claim this free node on-chain (one per address).
          </p>
        </div>

        {/* PAID NODE TIER 1 */}
        <div className="card node-card node-paid">
          <div className="node-header">
            <div>
              <h2 className="node-name">Spark Node</h2>
              <p className="node-tagline">
                Lightweight booster for addresses testing the waters.
              </p>
            </div>
            <span className="node-badge tier1">Tier I</span>
          </div>

          <div className="node-meta-row">
            <div className="node-meta-item">
              <span className="node-meta-label">Price</span>
              <span className="node-meta-value">0.05 ETH</span>
            </div>
            <div className="node-meta-item">
              <span className="node-meta-label">XP Boost</span>
              <span className="node-meta-value">+15% staking XP</span>
            </div>
            <div className="node-meta-item">
              <span className="node-meta-label">Max per wallet</span>
              <span className="node-meta-value">1</span>
            </div>
          </div>

          <ul className="node-benefits">
            <li>Boosts XP from every stake transaction on HeatRush.</li>
            <li>Improves your position in future XP-based leaderboards.</li>
            <li>Reserved for early season addresses once live.</li>
          </ul>

          <button className="node-cta-btn">
            Coming soon · On-chain node purchase
          </button>

          <p className="node-footnote">
            In the smart contract version, buying this node will be a simple
            Base transaction. The node will be bound to your wallet and
            automatically factored into your XP math.
          </p>
        </div>

        {/* PAID NODE TIER 2 */}
        <div className="card node-card node-paid strong">
          <div className="node-header">
            <div>
              <h2 className="node-name">Flare Node</h2>
              <p className="node-tagline">
                High-conviction node for users building a long-term position.
              </p>
            </div>
            <span className="node-badge tier2">Tier II</span>
          </div>

          <div className="node-meta-row">
            <div className="node-meta-item">
              <span className="node-meta-label">Price</span>
              <span className="node-meta-value">0.20 ETH</span>
            </div>
            <div className="node-meta-item">
              <span className="node-meta-label">XP Boost</span>
              <span className="node-meta-value">+40% staking XP</span>
            </div>
            <div className="node-meta-item">
              <span className="node-meta-label">Priority</span>
              <span className="node-meta-value">High in drops</span>
            </div>
          </div>

          <ul className="node-benefits">
            <li>Strong XP multiplier across staking and referrals.</li>
            <li>Will be referenced when distributing special HeatRush drops.</li>
            <li>Intended for active, long-term ecosystem participants.</li>
          </ul>

          <button className="node-cta-btn">
            Coming soon · Node contract integration
          </button>

          <p className="node-footnote">
            When this node goes live, every XP you earn will hit harder 
          if you’re serious about HeatRush, this is the boost you never want to miss.
          </p>
        </div>

        {/* PAID NODE TIER 3 (FUTURE) */}
        <div className="card node-card node-paid ultra">
          <div className="node-header">
            <div>
              <h2 className="node-name">Inferno Node</h2>
              <p className="node-tagline">
                Experimental high-impact node for a very small set of wallets.
              </p>
            </div>
            <span className="node-badge tier3">Tier III</span>
          </div>

          <div className="node-meta-row">
            <div className="node-meta-item">
              <span className="node-meta-label">Price</span>
              <span className="node-meta-value">TBA</span>
            </div>
            <div className="node-meta-item">
              <span className="node-meta-label">XP Boost</span>
              <span className="node-meta-value">Up to 100%</span>
            </div>
            <div className="node-meta-item">
              <span className="node-meta-label">Supply</span>
              <span className="node-meta-value">Very limited</span>
            </div>
          </div>

          <ul className="node-benefits">
            <li>Will likely be tied to special events or invites.</li>
            <li>Designed more as a social signal than pure ROI.</li>
            <li>Details will be announced after early seasons.</li>
          </ul>

          <button className="node-cta-btn disabled">
            Reserved for future seasons
          </button>

          <p className="node-footnote">
            This tier is intentionally vague. It gives us space to design wild
            experiments with a tiny subset of the most committed HeatRush
            addresses.
          </p>
        </div>
      </div>

      {/* INFO / HOW IT WILL WORK */}
      <div className="card nodes-info-card">
        <h2 className="nodes-info-title">How nodes will connect to XP</h2>
        <p className="nodes-info-text">
          Your XP today already lives on-chain inside the{" "}
          <strong>HeatRushStaking</strong> contract. Nodes will not replace
          that system – they will sit on top of it:
        </p>

        <ul className="nodes-info-list">
          <li>
            Every node has a <strong>multiplier</strong> or{" "}
            <strong>flat XP bonus</strong> that applies to staking / referrals.
          </li>
          <li>
            Node ownership will be <strong>verified on-chain</strong> and
            surfaced across your Profile, Dashboard, and future leaderboards.
          </li>
          <li>
            Free node = proof you were here early. Paid nodes = conviction +
            stronger voice inside the ecosystem.
          </li>
        </ul>


      </div>
    </div>
  );
};

export default NodesPage;
