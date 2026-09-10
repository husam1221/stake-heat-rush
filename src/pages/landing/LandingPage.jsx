import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import {
  ArrowRight,
  Activity,
  Coins,
  Flame,
  Layers3,
  Network,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";

const ecosystemItems = [
  {
    icon: Flame,
    title: "Multi-Chain Staking",
    text: "Access HeatRush staking markets across supported networks.",
    link: "/staking",
    label: "Explore Staking",
  },
  {
    icon: Zap,
    title: "Missions & XP",
    text: "Complete ecosystem activity, earn XP and build your profile.",
    link: "/tasks",
    label: "View Missions",
  },
  {
    icon: Trophy,
    title: "Progress & Rewards",
    text: "Build activity across HeatRush and grow through the ecosystem.",
    link: "/profile",
    label: "View Profile",
  },
  {
    icon: Sparkles,
    title: "Season 2",
    text: "Participate in the next phase of the HeatRush ecosystem.",
    link: "/season2",
    label: "Explore Season 2",
  },
];

const economyNodes = [
  {
    icon: Flame,
    label: "STAKING",
  },
  {
    icon: Zap,
    label: "MISSIONS",
  },
  {
    icon: Activity,
    label: "XP",
  },
  {
    icon: Trophy,
    label: "REWARDS",
  },
];

const supportedAssets = [
  "ETH",
  "HR",
  "USDC",
  "BNB",
  "BTCB",
  "USDT",
];

const reveal = {
  hidden: {
    opacity: 0,
    y: 34,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const slideFromLeft = {
  hidden: { opacity: 0, x: -90 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  },
};

const slideFromRight = {
  hidden: { opacity: 0, x: 90 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  },
};

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* =========================================================
          BACKGROUND
      ========================================================== */}
      <div className="landing-background" aria-hidden="true">
        <div className="landing-grid" />

        <div className="landing-orb landing-orb-one" />
        <div className="landing-orb landing-orb-two" />
        <div className="landing-orb landing-orb-three" />

        <div className="landing-particles">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      {/* =========================================================
          HEADER
      ========================================================== */}
      <header className="landing-header">
        <Link to="/" className="landing-brand" aria-label="HeatRush Home">
          <div className="landing-brand-mark">
            <Flame size={21} />
          </div>

          <div className="landing-brand-copy">
            <strong>HeatRush</strong>
            <span>WEB3 ECOSYSTEM</span>
          </div>
        </Link>

        <div className="landing-header-status">
          <span className="landing-status-dot" />
          ECOSYSTEM LIVE
        </div>

        <Link to="/dashboard" className="landing-header-enter">
          Enter HeatRush
          <ArrowRight size={16} />
        </Link>
      </header>

      <main>
        {/* =========================================================
            HERO
        ========================================================== */}
        <section className="landing-hero">
          <div className="landing-hero-network" aria-hidden="true">
            <div className="landing-network-ring landing-network-ring-one" />
            <div className="landing-network-ring landing-network-ring-two" />
            <div className="landing-network-ring landing-network-ring-three" />

            <span className="landing-network-node node-one" />
            <span className="landing-network-node node-two" />
            <span className="landing-network-node node-three" />
            <span className="landing-network-node node-four" />
          </div>

          <div className="landing-hero-content">
            <div className="landing-eyebrow">
              <span className="landing-eyebrow-line" />

              MULTI-CHAIN WEB3 INFRASTRUCTURE

              <span className="landing-eyebrow-line" />
            </div>

            <h1 className="landing-hero-title">
              <span>THE HEAT</span>
              <span className="landing-gradient-text">IS RISING.</span>
            </h1>

            <p className="landing-hero-lead">
              HeatRush connects staking, missions, XP and ecosystem
              participation through one evolving Web3 experience.
            </p>

            <div className="landing-hero-actions">
              <Link to="/dashboard" className="landing-primary-button">
                ENTER HEATRUSH
                <ArrowRight size={18} />
              </Link>

              <a href="#ecosystem" className="landing-secondary-button">
                EXPLORE ECOSYSTEM
              </a>
            </div>

            <div className="landing-hero-meta">
              <div>
                <span className="landing-meta-label">NETWORKS</span>
                <strong>Base + BNB Chain</strong>
              </div>

              <span className="landing-meta-divider" />

              <div>
                <span className="landing-meta-label">ECOSYSTEM</span>
                <strong>Active</strong>
              </div>

              <span className="landing-meta-divider" />

              <div>
                <span className="landing-meta-label">CORE ASSET</span>
                <strong>HR</strong>
              </div>
            </div>
          </div>

          <div className="landing-scroll-hint" aria-hidden="true">
            <span>SCROLL TO ENTER THE ECOSYSTEM</span>
            <div className="landing-scroll-line" />
          </div>
        </section>

        {/* =========================================================
            ECOSYSTEM VISUAL
        ========================================================== */}
        <section id="ecosystem" className="landing-section ecosystem-section">
          <motion.div
            className="landing-section-heading"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={reveal}
          >
            <span className="landing-section-index">01</span>

            <div>
              <span className="landing-section-kicker">
                ONE CONNECTED EXPERIENCE
              </span>

              <h2>
                The HeatRush
                <span> Ecosystem.</span>
              </h2>

              <p>
                Multiple products. Multiple networks. One connected ecosystem
                built around participation and utility.
              </p>
            </div>
          </motion.div>

          <motion.div
            className="ecosystem-visual"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={slideFromRight}
          >
            <div className="ecosystem-chain ecosystem-chain-base">
              <div className="ecosystem-chain-icon">
                <Network size={24} />
              </div>

              <span>NETWORK</span>
              <strong>BASE</strong>
            </div>

            <div className="ecosystem-connection ecosystem-connection-left">
              <span />
            </div>

            <div className="ecosystem-core">
              <div className="ecosystem-core-glow" />

              <div className="ecosystem-core-ring ecosystem-core-ring-one" />
              <div className="ecosystem-core-ring ecosystem-core-ring-two" />

              <div className="ecosystem-core-token ecosystem-core-token-coin">
                <img src="/coin.webp" alt="HeatRush HR token" />
              </div>

              {economyNodes.map(({ icon: Icon, label }, index) => (
                <div
                  className={`ecosystem-orbit-node ecosystem-orbit-${index + 1}`}
                  key={label}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div className="ecosystem-connection ecosystem-connection-right">
              <span />
            </div>

            <div className="ecosystem-chain ecosystem-chain-bnb">
              <div className="ecosystem-chain-icon">
                <Layers3 size={24} />
              </div>

              <span>NETWORK</span>
              <strong>BNB CHAIN</strong>
            </div>
          </motion.div>

          <motion.div
            className="landing-integration-copy"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={slideFromLeft}
          >
            <span>CONNECTED ACROSS NETWORKS</span>
            <p>
              HeatRush brings Base and BNB Chain activity into one ecosystem,
              giving users a consistent path between staking, missions, XP and
              ecosystem participation as supported networks and assets expand.
            </p>
          </motion.div>

          <motion.p
            className="landing-motivation landing-motivation-right"
            initial={{ opacity: 0, x: 80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.75 }}
          >
            BE PART OF WHAT COMES NEXT.
          </motion.p>
        </section>

        {/* =========================================================
            HR ECONOMY
        ========================================================== */}
        <section className="landing-section hr-section">
          <motion.div
            className="hr-stage"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={slideFromLeft}
          >
            <div className="hr-stage-copy">
              <span className="landing-section-index">02</span>

              <span className="landing-section-kicker">
                THE HEART OF HEATRUSH
              </span>

              <h2>
                HR sits at the center
                <span> of the ecosystem.</span>
              </h2>

              <p>
                HR connects the HeatRush identity with an expanding ecosystem
                of participation, rewards, missions and future utility.
              </p>

              <Link to="/dashboard" className="landing-text-link">
                Explore HeatRush
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="hr-token-visual" aria-hidden="true">
              <div className="hr-energy-ring hr-energy-ring-one" />
              <div className="hr-energy-ring hr-energy-ring-two" />
              <div className="hr-energy-ring hr-energy-ring-three" />

              <div className="hr-token hr-token-3d">
                <div className="hr-token-coin-wrap">
                  <img src="/coin.webp" alt="HeatRush HR token" />
                  <span className="hr-token-edge" />
                </div>
              </div>

              <span className="hr-orbit-label hr-label-one">
                STAKING
              </span>

              <span className="hr-orbit-label hr-label-two">
                MISSIONS
              </span>

              <span className="hr-orbit-label hr-label-three">
                REWARDS
              </span>

              <span className="hr-orbit-label hr-label-four">
                UTILITY
              </span>
            </div>
          </motion.div>

          <motion.p
            className="landing-motivation landing-motivation-left"
            initial={{ opacity: 0, x: -80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.75 }}
          >
            YOUR ACTIVITY BUILDS YOUR POSITION.
          </motion.p>
        </section>

        {/* =========================================================
            PRODUCT CARDS
        ========================================================== */}
        <section className="landing-section products-section">
          <motion.div
            className="landing-section-heading"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={reveal}
          >
            <span className="landing-section-index">03</span>

            <div>
              <span className="landing-section-kicker">
                BUILT FOR PARTICIPATION
              </span>

              <h2>
                Explore the
                <span> ecosystem.</span>
              </h2>
            </div>
          </motion.div>

          <div className="landing-product-grid">
            {ecosystemItems.map(
              ({ icon: Icon, title, text, link, label }, index) => (
                <motion.article
                  className="landing-product-card"
                  key={title}
                  initial={{
                    opacity: 0,
                    x: index % 2 === 0 ? -70 : 70,
                    y: 18,
                  }}
                  whileInView={{
                    opacity: 1,
                    x: 0,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                    amount: 0.2,
                  }}
                  transition={{
                    duration: 0.55,
                    delay: index * 0.08,
                  }}
                >
                  <div className="landing-product-number">
                    0{index + 1}
                  </div>

                  <div className="landing-product-icon">
                    <Icon size={23} />
                  </div>

                  <h3>{title}</h3>

                  <p>{text}</p>

                  <Link to={link}>
                    {label}
                    <ArrowRight size={15} />
                  </Link>
                </motion.article>
              )
            )}
          </div>
        </section>

        {/* =========================================================
            MULTI CHAIN
        ========================================================== */}
        <section className="landing-section multichain-section">
          <motion.div
            className="multichain-panel"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={slideFromRight}
          >
            <div className="multichain-copy">
              <span className="landing-section-index">04</span>

              <span className="landing-section-kicker">
                MULTI-CHAIN BY DESIGN
              </span>

              <h2>
                One interface.
                <span> Multiple markets.</span>
              </h2>

              <p>
                HeatRush connects supported assets and networks through one
                ecosystem experience. Base and BNB Chain form the current
                multi-chain foundation, while the architecture is designed to
                support broader participation as the ecosystem expands.
              </p>

              <p className="multichain-note">
                Move through one HeatRush experience while each supported
                network keeps its own on-chain activity and assets.
              </p>















<div className="multichain-trust-row">
  <div>
    <ShieldCheck size={18} />
    <span>On-chain infrastructure</span>
  </div>

  <div>
    <Activity size={18} />
    <span>Live ecosystem</span>
  </div>
</div>

</div>

<div className="multichain-display">
  <div className="network-card network-card-base">
    <img
      className="network-card-logo"
      src="/baselogo.png"
      alt="Base"
    />

    <div>
      <Network size={20} />
      <span>NETWORK 01</span>
    </div>

    <strong>BASE</strong>
  </div>

  <div className="network-card network-card-bnb">
    <img
      className="network-card-logo"
      src="/smartchainlogo.png"
      alt="BNB Chain"
    />

    <div>
      <Layers3 size={20} />
      <span>NETWORK 02</span>
    </div>

    <strong>BNB CHAIN</strong>
  </div>

  <div className="asset-rail">
    {supportedAssets.map((asset) => {
      const assetLogo = {
        ETH: "/ethlogo.png",
        HR: "/coin.webp",
        USDC: "/usdclogo.png",
        BNB: "/smartchainlogo.png",
        BTCB: "/btclogo.png",
        USDT: "/usdtlogo.png",
      }[asset];

      return (
        <span key={asset}>
          {assetLogo ? (
            <img
              src={assetLogo}
              alt=""
              aria-hidden="true"
            />
          ) : null}

          {asset}
        </span>
      );
    })}
  </div>
</div>
</motion.div>
</section>

<motion.div
  className="landing-wide-message"
  initial={{ opacity: 0, scale: 0.94 }}
  whileInView={{ opacity: 1, scale: 1 }}
  viewport={{ once: true, amount: 0.45 }}
  transition={{ duration: 0.8 }}
>
  <span>ONE ECOSYSTEM. MORE WAYS TO PARTICIPATE.</span>
  <strong>THE NEXT CHAPTER IS BUILT TOGETHER.</strong>
</motion.div>












        {/* =========================================================
            FINAL CTA
        ========================================================== */}
        <section className="landing-final">
          <div className="landing-final-glow" aria-hidden="true" />

          <motion.div
            className="landing-final-content"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={reveal}
          >
            <div className="landing-final-symbol">
              <Coins size={28} />
            </div>

            <span className="landing-section-kicker">
              ENTER THE NEXT PHASE
            </span>

            <h2>
              ONE ECOSYSTEM.
              <br />
              MULTIPLE CHAINS.
              <br />
              <span>BUILT AROUND HR.</span>
            </h2>

            <p>
              Enter HeatRush and explore the ecosystem from one connected
              dashboard.
            </p>

            <Link to="/dashboard" className="landing-final-button">
              ENTER HEATRUSH
              <ArrowRight size={19} />
            </Link>
          </motion.div>
        </section>
      </main>

      {/* =========================================================
          FOOTER
      ========================================================== */}
      <footer className="landing-footer">
        <div className="landing-footer-brand">
          <Flame size={17} />
          <strong>HeatRush</strong>
        </div>

        <span>Web3 Infrastructure</span>

        <div className="landing-footer-status">
          <span className="landing-status-dot" />
          SYSTEMS OPERATIONAL
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;