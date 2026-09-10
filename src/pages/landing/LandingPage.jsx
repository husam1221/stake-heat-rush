import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Coins, Flame, Layers3, ShieldCheck, Users, Zap } from "lucide-react";

const paths = [
  { number: "01", icon: Flame, title: "Stake Assets", text: "Choose a supported market, earn rewards, and build your HeatRush XP.", to: "/staking", action: "Start Staking" },
  { number: "02", icon: Coins, title: "Buy HR", text: "Get HR directly through the official HeatRush flow on Base.", to: "/presale", action: "Buy HR", featured: true },
  { number: "03", icon: Users, title: "Invite Friends", text: "Share your personal link and earn Points, XP, and milestone bonuses.", to: "/referral", action: "Start Inviting" },
];

const steps = [
  { icon: ShieldCheck, title: "Connect your wallet", text: "Enter the HeatRush hub and connect a supported Web3 wallet." },
  { icon: Zap, title: "Choose your path", text: "Stake, buy HR, complete missions, or invite active users." },
  { icon: CheckCircle2, title: "Track your progress", text: "Follow your XP, rewards, activity, and next action in one place." },
];

const assets = ["ETH", "HR", "USDC", "BNB", "BTCB", "USDT"];

const LandingPage = () => (
  <div className="landing-page landing-focused">
    <div className="landing-background" aria-hidden="true">
      <div className="landing-grid" />
      <div className="landing-orb landing-orb-one" />
      <div className="landing-orb landing-orb-two" />
      <div className="landing-orb landing-orb-three" />
    </div>

    <header className="landing-header">
      <Link to="/" className="landing-brand" aria-label="HeatRush Home">
        <div className="landing-brand-mark"><Flame size={21} /></div>
        <div className="landing-brand-copy"><strong>HeatRush</strong><span>WEB3 ECOSYSTEM</span></div>
      </Link>
      <div className="landing-header-status"><span className="landing-status-dot" /> ECOSYSTEM LIVE</div>
      <Link to="/dashboard" className="landing-header-enter">Open Dashboard <ArrowRight size={16} /></Link>
    </header>

    <main>
      <section className="landing-hero landing-hero-focused">
        <div className="landing-hero-content">
          <div className="landing-eyebrow"><span className="landing-eyebrow-line" />BASE + BNB CHAIN<span className="landing-eyebrow-line" /></div>
          <h1 className="landing-hero-title"><span>ONE HUB.</span><span className="landing-gradient-text">YOUR NEXT MOVE.</span></h1>
          <p className="landing-hero-lead">Stake assets, buy HR, complete missions, and grow through referrals — all inside one connected Web3 ecosystem.</p>
          <div className="landing-hero-actions">
            <Link to="/dashboard" className="landing-primary-button">START HERE <ArrowRight size={18} /></Link>
            <Link to="/presale" className="landing-secondary-button">BUY HR</Link>
          </div>
          <div className="landing-trust-row">
            <span><ShieldCheck size={15} /> On-chain access</span>
            <span><Layers3 size={15} /> Multi-chain markets</span>
            <span><Zap size={15} /> XP &amp; rewards</span>
          </div>
        </div>
        <div className="landing-hero-token" aria-hidden="true">
          <div className="landing-token-ring ring-one" /><div className="landing-token-ring ring-two" /><div className="landing-token-glow" />
          <img src="/coin.webp" alt="" />
        </div>
      </section>

      <section className="landing-section landing-paths" id="start">
        <div className="landing-section-heading landing-heading-compact">
          <span className="landing-section-index">01</span>
          <div><span className="landing-section-kicker">CHOOSE YOUR PATH</span><h2>What do you want to do?</h2><p>Pick one action now. You can access everything else from your dashboard.</p></div>
        </div>
        <div className="landing-path-grid">
          {paths.map(({ number, icon: Icon, title, text, to, action, featured }) => (
            <Link to={to} className={`landing-path-card ${featured ? "featured" : ""}`} key={title}>
              <div className="landing-path-top"><span>{number}</span><div><Icon size={22} /></div></div>
              <h3>{title}</h3><p>{text}</p><strong>{action} <ArrowRight size={15} /></strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="landing-section landing-how">
        <div className="landing-section-heading landing-heading-compact">
          <span className="landing-section-index">02</span><div><span className="landing-section-kicker">HOW IT WORKS</span><h2>Start in three simple steps.</h2></div>
        </div>
        <div className="landing-step-grid">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <article className="landing-step-card" key={title}><span>0{index + 1}</span><Icon size={22} /><h3>{title}</h3><p>{text}</p></article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-markets">
        <div><span className="landing-section-kicker">SUPPORTED MARKETS</span><h2>One experience across Base and BNB Chain.</h2></div>
        <div className="landing-asset-row">{assets.map((asset) => <span key={asset}>{asset}</span>)}</div>
        <Link to="/staking">Explore Staking Markets <ArrowRight size={16} /></Link>
      </section>

      <section className="landing-final-cta">
        <span>YOUR ACTIVITY BUILDS YOUR POSITION</span><h2>Ready to enter HeatRush?</h2><p>Open your dashboard and choose the action that fits you.</p>
        <Link to="/dashboard" className="landing-primary-button">OPEN DASHBOARD <ArrowRight size={18} /></Link>
      </section>
    </main>

    <footer className="landing-footer landing-footer-focused">
      <div><strong>HeatRush</strong><span>Web3 Ecosystem</span></div>
      <nav aria-label="Footer navigation"><Link to="/staking">Staking</Link><Link to="/presale">Buy HR</Link><Link to="/referral">Invite</Link><Link to="/faq">FAQ</Link></nav>
      <span>Base + BNB Chain</span>
    </footer>
  </div>
);

export default LandingPage;
