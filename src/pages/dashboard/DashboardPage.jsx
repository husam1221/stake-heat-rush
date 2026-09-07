// src/pages/dashboard/DashboardPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { useReferralListener } from "../../hooks/useReferralListener.js";
import { useNavigate } from "react-router-dom";
import TokensImg from "../../assets/Tokens.png";

// Recharts
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

import { BASE_CHAIN_ID } from "../../lib/constants.js";
import { useAirdrop } from "../../hooks/useAirdrop.js";
import { PRESALE_ABI, PRESALE_ADDRESS } from "../../lib/presale.js";
import { CLAIM_ABI, CLAIM_ADDRESS } from "../../lib/claim.js";

import "../../styles/dashboard.css";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// ============== TOKENOMICS DATA (نفس الداتا، ألوان بس) ==============
const tokenomicsData = [
  { name: "Community Incentives & Airdrops", value: 30, tokens: "30M", color: "#FF1744" },
  { name: "Ecosystem Dev & AI/Chain Tools", value: 20, tokens: "20M", color: "#FF6200" },
  { name: "Liquidity & Exchange Listings", value: 12, tokens: "12M", color: "#FFB300" },
  { name: "Team & Founders (vested)", value: 10, tokens: "10M", color: "#FFD54F" },
  { name: "Presale", value: 10, tokens: "10M", color: "#FFFF00" },
  { name: "Marketing & Community", value: 10, tokens: "10M", color: "#FF9100" },
  { name: "Staking Rewards", value: 4, tokens: "4M", color: "#00E676" },
  { name: "Strategic Partners & Advisors", value: 4, tokens: "4M", color: "#1DE9B6" },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tokenomics-tooltip-pro">
        <div className="tooltip-title">{payload[0].payload.name}</div>
        <div className="tooltip-big">{payload[0].value}%</div>
        <div className="tooltip-tokens">{payload[0].payload.tokens} HR</div>
      </div>
    );
  }
  return null;
};

const DashboardPage = () => {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  useReferralListener();

  const { data: balanceData } = useBalance({
    address,
    chainId: BASE_CHAIN_ID,
    watch: true,
  });

  const walletBalance = balanceData?.formatted
    ? Number(balanceData.formatted).toFixed(4)
    : "0.0000";

  const { airdrop, airdropLoading, airdropError } = useAirdrop(
    address || ZERO_ADDRESS
  );

  const baseAllocation =
    airdrop && typeof airdrop.hr_base === "number" ? airdrop.hr_base : 0;
  const points = airdrop && typeof airdrop.points === "number" ? airdrop.points : 0;

  const isEligible =
    airdrop &&
    !airdropError &&
    typeof airdrop.hr_base === "number" &&
    airdrop.hr_base > 0;

  const { data: presaleClaimableRaw } = useReadContract({
    abi: PRESALE_ABI,
    address: PRESALE_ADDRESS,
    functionName: "claimableHR",
    args: [address || ZERO_ADDRESS],
  });

  const presaleClaimableHR = presaleClaimableRaw
    ? Number(formatUnits(presaleClaimableRaw, 18))
    : 0;

  const { data: presaleTotalHrRaw } = useReadContract({
    abi: PRESALE_ABI,
    address: PRESALE_ADDRESS,
    functionName: "totalHrFor",
    args: [address || ZERO_ADDRESS],
  });

  const presaleTotalHr = presaleTotalHrRaw
    ? Number(formatUnits(presaleTotalHrRaw, 18))
    : 0;

  const { data: presaleClaimedRaw } = useReadContract({
    abi: PRESALE_ABI,
    address: PRESALE_ADDRESS,
    functionName: "claimed",
    args: [address || ZERO_ADDRESS],
  });

  const presaleClaimedHr = presaleClaimedRaw
    ? Number(formatUnits(presaleClaimedRaw, 18))
    : 0;

  const { data: claimableAirdropRaw } = useReadContract({
    abi: CLAIM_ABI,
    address: CLAIM_ADDRESS,
    functionName: "claimableAmount",
    args: [address || ZERO_ADDRESS, 0n],
  });

  const claimableAirdropHR = claimableAirdropRaw
    ? Number(formatUnits(claimableAirdropRaw, 18))
    : 0;

  // بيانات Legacy محفوظة كما هي حاليًا لعدم حذف أي منطق بدون إذن.
  // لا نعتمد عليها في شريط التقدم لأن claimableAirdropHR ليست قيمة "تم استلامها".
  const _totalOwnedHR = presaleTotalHr + baseAllocation;
  const _totalClaimedHR = presaleClaimedHr + claimableAirdropHR;

  // نسبة Claim الصحيحة المعروضة هنا تخص Presale فقط:
  // HR المستلمة ÷ إجمالي HR المشتراة.
  const claimProgress =
    presaleTotalHr > 0
      ? Math.min((presaleClaimedHr / presaleTotalHr) * 100, 100)
      : 0;

  // زر ينزلك على زر Claim Rewards في صفحة staking
  const handleGoToClaimRewards = () => {
    navigate("/staking#claim");
  };

  return (
    <div className="dashboard-page">
      {/* ===== REIGNITION STATUS ===== */}
      <section className="dash-reignition-card" aria-label="HeatRush platform status">
        <div className="dash-reignition-glow" aria-hidden="true" />

        <div className="dash-reignition-copy">
          <div className="dash-reignition-kicker">
            <span className="dash-live-dot" aria-hidden="true" />
            HEATRUSH REIGNITION
          </div>

          <h1 className="dash-reignition-title">
            The infrastructure is <span>live.</span>
          </h1>

          <p className="dash-reignition-text">
            HeatRush is moving into its next phase with active Base infrastructure,
            staking access, Season 2 participation, and the next ecosystem modules
            being prepared step by step.
          </p>

          <div className="dash-reignition-actions">
            <Link to="/staking" className="dash-reignition-btn primary">
              Stake Assets
            </Link>
            <Link to="/season2" className="dash-reignition-btn secondary">
              Explore Season 2
            </Link>
            <button
              type="button"
              className="dash-reignition-btn secondary"
              onClick={handleGoToClaimRewards}
            >
              Claim Rewards
            </button>
          </div>
        </div>

        <div className="dash-reignition-statuses">
          <div className="dash-status-row">
            <div>
              <span className="dash-status-name">Base + BNB Chain</span>
              <span className="dash-status-detail">Multi-chain staking live</span>
            </div>
            <span className="dash-status-badge live">LIVE</span>
          </div>

          <div className="dash-status-row">
            <div>
              <span className="dash-status-name">Staking</span>
              <span className="dash-status-detail">7 staking markets</span>
            </div>
            <span className="dash-status-badge live">ACTIVE</span>
          </div>

          <div className="dash-status-row">
            <div>
              <span className="dash-status-name">Season 2</span>
              <span className="dash-status-detail">Participation hub</span>
            </div>
            <span className="dash-status-badge ready">AVAILABLE</span>
          </div>
        </div>
      </section>


{/* ===== NEW MULTI-CHAIN STAKING DISCOVERY ===== */}
<section className="dash-multichain-staking" aria-label="New multi-chain staking markets">
  <div className="dash-multichain-head">
    <div>
      <div className="dash-multichain-kicker">
        <span className="dash-live-dot" aria-hidden="true" />
        NEW • MULTI-CHAIN STAKING
      </div>
      <h2>Stake across Base &amp; BNB Chain</h2>
      <p>
        7 staking markets are now available. Choose your asset, build XP,
        and qualify for HeatRush rewards.
      </p>
    </div>

    <Link to="/staking" className="dash-multichain-main-cta">
      Explore All Markets →
    </Link>
  </div>

  <div className="dash-multichain-network dash-multichain-network-base">
    <div className="dash-multichain-network-title">
      <img src="/baselogo.png" alt="Base" />
      <div>
        <span>BASE</span>
        <strong>Base Chain</strong>
      </div>
    </div>

    <div className="dash-multichain-market-grid dash-multichain-market-grid-base">
      <Link to="/staking" className="dash-multichain-market">
        <div className="dash-multichain-market-main">
          <img src="/ethlogo.png" alt="ETH" />
          <div>
            <strong>ETH</strong>
            <span>Stake ETH</span>
          </div>
        </div>
        <div className="dash-multichain-market-apy">
          <span>APY</span>
          <strong>2% - 4%</strong>
        </div>
      </Link>

      <Link to="/staking" className="dash-multichain-market">
        <div className="dash-multichain-market-main">
          <img src={TokensImg} alt="HR" />
          <div>
            <strong>HR</strong>
            <span>Stake HR</span>
          </div>
        </div>
        <div className="dash-multichain-market-apy">
          <span>APY</span>
          <strong>70%</strong>
        </div>
      </Link>

      <Link to="/staking" className="dash-multichain-market">
        <div className="dash-multichain-market-main">
          <img src="/usdclogo.png" alt="USDC" />
          <div>
            <strong>USDC</strong>
            <span>Stake USDC</span>
          </div>
        </div>
        <div className="dash-multichain-market-apy">
          <span>APY</span>
          <strong>5% - 30%</strong>
        </div>
      </Link>
    </div>
  </div>

  <div className="dash-multichain-network dash-multichain-network-bnb">
    <div className="dash-multichain-network-title">
      <img src="/smartchainlogo.png" alt="BNB Chain" />
      <div>
        <span>BNB</span>
        <strong>BNB Chain</strong>
      </div>
    </div>

    <div className="dash-multichain-market-grid dash-multichain-market-grid-bnb">
      <Link to="/staking" className="dash-multichain-market">
        <div className="dash-multichain-market-main">
          <img src="/smartchainlogo.png" alt="BNB" />
          <div>
            <strong>BNB</strong>
            <span>Stake BNB</span>
          </div>
        </div>
        <div className="dash-multichain-market-apy">
          <span>APY</span>
          <strong>17% - 32.5%</strong>
        </div>
      </Link>

      <Link to="/staking" className="dash-multichain-market">
        <div className="dash-multichain-market-main">
          <img src="/btclogo.png" alt="BTCB" />
          <div>
            <strong>BTCB</strong>
            <span>Stake BTCB</span>
          </div>
        </div>
        <div className="dash-multichain-market-apy">
          <span>APY</span>
          <strong>18% - 37%</strong>
        </div>
      </Link>

      <Link to="/staking" className="dash-multichain-market">
        <div className="dash-multichain-market-main">
          <img src="/bitcoinLogo.png" alt="USDT" />
          <div>
            <strong>USDT</strong>
            <span>Stake USDT</span>
          </div>
        </div>
        <div className="dash-multichain-market-apy">
          <span>APY</span>
          <strong>6% - 33%</strong>
        </div>
      </Link>

      <Link to="/staking" className="dash-multichain-market">
        <div className="dash-multichain-market-main">
          <img src="/usdclogo.png" alt="USDC" />
          <div>
            <strong>USDC</strong>
            <span>Stake USDC</span>
          </div>
        </div>
        <div className="dash-multichain-market-apy">
          <span>APY</span>
          <strong>7.4% - 29%</strong>
        </div>
      </Link>
    </div>
  </div>

  <div className="dash-multichain-footer">
    <span>Stake • Earn XP • Qualify for HR Rewards</span>
    <Link to="/staking">Open Staking →</Link>
  </div>
</section>



      {/* HERO CARD */}
      <div className="card dash-hero-card">
        <div className="dash-hero-left">
          <h1 className="dash-hero-title">
            Welcome to <span className="orange">HeatRush</span> Hub
          </h1>
          <p className="dash-hero-subtitle">
            This is your control center for{" "}
            <span className="orange">staking</span>,{" "}
            <span className="orange">airdrop</span>, and{" "}
            <span className="orange">presale</span>. One place to see where you
            stand and what you might be missing.
          </p>

          <div className="dash-hero-ctas">
            <Link to="/staking" className="dash-hero-btn primary">
              Start Staking
            </Link>

            <Link to="/airdrop" className="dash-hero-btn ghost">
              Check Season 1 Eligibility
            </Link>

            <button
              type="button"
              className="dash-hero-btn ghost claim-glow-btn"
              onClick={handleGoToClaimRewards}
            >
              Claim Rewards
            </button>
          </div>
        </div>

        <div className="dash-hero-right">
          <div className="dash-hero-stat">
            <span className="dash-hero-stat-label">Wallet on Base</span>
            <span className="dash-hero-stat-value">
              {isConnected ? (
                <>
                  {walletBalance} <span className="unit">ETH</span>
                </>
              ) : (
                "Connect wallet"
              )}
            </span>
          </div>

          <div className="dash-hero-stat">
            <span className="dash-hero-stat-label">Airdrop status</span>
            <span className="dash-hero-stat-value">
              {!isConnected && "Connect to check"}
              {isConnected && airdropLoading && "Loading..."}
              {isConnected && !airdropLoading && airdropError && "Error"}
              {isConnected &&
                !airdropLoading &&
                !airdropError &&
                (isEligible ? "Eligible" : "Not eligible")}
            </span>
          </div>
        </div>
      </div>
















      {/* ===== ECOSYSTEM STATUS ===== */}
      <section className="dash-ecosystem-section" aria-label="HeatRush ecosystem">
        <div className="dash-section-heading">
          <div>
            <span className="dash-section-kicker">PLATFORM STATUS</span>
            <h2>HeatRush Ecosystem</h2>
          </div>
          <p>Core areas of the platform and their current rollout status.</p>
        </div>

        <div className="dash-ecosystem-grid">
          <Link to="/staking" className="dash-ecosystem-card">
            <div className="dash-ecosystem-top">
              <span className="dash-ecosystem-icon">S</span>
              <span className="dash-status-badge live">LIVE</span>
            </div>
            <h3>Staking</h3>
            <p>Stake across Base and BNB Chain with 7 active staking markets.</p>
            <span className="dash-ecosystem-link">Open Staking →</span>
          </Link>

          <Link to="/season2" className="dash-ecosystem-card">
            <div className="dash-ecosystem-top">
              <span className="dash-ecosystem-icon">2</span>
              <span className="dash-status-badge ready">AVAILABLE</span>
            </div>
            <h3>Season 2</h3>
            <p>Follow Season 2 participation, progress, and platform activity.</p>
            <span className="dash-ecosystem-link">Explore Season 2 →</span>
          </Link>

          <Link to="/tasks" className="dash-ecosystem-card">
            <div className="dash-ecosystem-top">
              <span className="dash-ecosystem-icon">T</span>
              <span className="dash-status-badge ready">AVAILABLE</span>
            </div>
            <h3>Tasks</h3>
            <p>Complete active platform tasks and continue building your profile.</p>
            <span className="dash-ecosystem-link">View Tasks →</span>
          </Link>

          <Link to="/nodes" className="dash-ecosystem-card upcoming">
            <div className="dash-ecosystem-top">
              <span className="dash-ecosystem-icon">N</span>
              <span className="dash-status-badge upcoming">COMING NEXT</span>
            </div>
            <h3>Founders Node</h3>
            <p>The Nodes module is visible now and scheduled for the next activation step.</p>
            <span className="dash-ecosystem-link">Preview Nodes →</span>
          </Link>
        </div>
      </section>


      {/* MAIN GRID */}
      <div className="dash-grid">
        {/* TOKENOMICS CARD */}
        <div className="card dash-card tokenomics-card">
          <h2 className="dash-card-title">HeatRush Tokenomics</h2>
          <p className="dash-card-subtitle">
            Total Supply: <strong>100,000,000 HR</strong> • Community First
          </p>

          <div className="tokenomics-masterpiece">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={tokenomicsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={115}
                  paddingAngle={2}
                  cornerRadius={10}
                  dataKey="value"
                  stroke="#050509"
                  strokeWidth={4}
                >
                  {tokenomicsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: "#FF6200", strokeWidth: 3 }}
                />
                <text
                  x="50%"
                  y="47%"
                  textAnchor="middle"
                  className="donut-big-text"
                >
                  100M
                </text>
                <text
                  x="50%"
                  y="55%"
                  textAnchor="middle"
                  className="donut-small-text"
                >
                  HR Total Supply
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="tokenomics-legend-pro">
            {tokenomicsData.map((item) => (
              <div key={item.name} className="legend-pro-item">
                <div
                  className="legend-pro-color"
                  style={{ background: item.color }}
                />
                <div className="legend-pro-label">{item.name}</div>
                <div className="legend-pro-percent">{item.value}%</div>
                <div className="legend-pro-tokens">{item.tokens} HR</div>
              </div>
            ))}
          </div>
        </div>

        {/* باقي الكروت بدون تغيير */}
        <div className="card dash-card">
          <h2 className="dash-card-title">Your wallet snapshot</h2>
          <p className="dash-card-subtitle">
            Quick view of where you stand right now on HeatRush.
          </p>

          <div className="dash-stat-grid">
            <div className="dash-stat-item">
              <span className="dash-stat-label">Balance on Base</span>
              <span className="dash-stat-value">
                {walletBalance} <span className="unit">ETH</span>
              </span>
            </div>

            <div className="dash-stat-item">
              <span className="dash-stat-label">Airdrop base allocation</span>
              <span className="dash-stat-value">
                {isEligible ? `${baseAllocation.toLocaleString("en-US")} HR` : "0 HR"}
              </span>
            </div>

            <div className="dash-stat-item">
              <span className="dash-stat-label">Airdrop points snapshot</span>
              <span className="dash-stat-value">
                {points ? points.toLocaleString("en-US") : "0"}
              </span>
            </div>
          </div>

          <p className="dash-footnote">
            *Detailed unlock schedule &amp; Merkle-based claim are available on the{" "}
            <Link to="/airdrop" className="dash-link">
              Airdrop page
            </Link>
            .
          </p>
        </div>

        <div className="card dash-card">
          <h2 className="dash-card-title">Presale performance</h2>
          <p className="dash-card-subtitle">
            Everything you&apos;ve done in the public presale – fully on-chain.
          </p>

          <div className="dash-stat-grid">
            <div className="dash-stat-item">
              <span className="dash-stat-label">Total HR bought</span>
              <span className="dash-stat-value">
                {presaleTotalHr > 0 ? `${presaleTotalHr.toLocaleString("en-US")} HR` : "0 HR"}
              </span>
            </div>

            <div className="dash-stat-item">
              <span className="dash-stat-label">Already claimed</span>
              <span className="dash-stat-value">
                {presaleClaimedHr > 0 ? `${presaleClaimedHr.toLocaleString("en-US")} HR` : "0 HR"}
              </span>
            </div>

            <div className="dash-stat-item">
              <span className="dash-stat-label">Still claimable</span>
              <span className="dash-stat-value">
                {presaleClaimableHR > 0 ? `${presaleClaimableHR.toLocaleString("en-US")} HR` : "0 HR"}
              </span>
            </div>
          </div>

          <div className="dash-claim-progress">
            <div className="dash-claim-progress-head">
              <div>
                <span className="dash-claim-progress-label">Claim Progress</span>
                <span className="dash-claim-progress-detail">
                  {presaleClaimedHr.toLocaleString("en-US")} HR claimed of{" "}
                  {presaleTotalHr.toLocaleString("en-US")} HR
                </span>
              </div>

              <span className="dash-claim-progress-percent">
                {claimProgress.toFixed(1)}%
              </span>
            </div>

            <div
              className="dash-claim-progress-track"
              role="progressbar"
              aria-label="Presale claim progress"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={Number(claimProgress.toFixed(1))}
            >
              <div
                className="dash-claim-progress-fill"
                style={{ width: `${claimProgress}%` }}
              />
            </div>
          </div>

          <p className="dash-footnote">
            To buy more or claim instantly, go to the{" "}
            <Link to="/presale" className="dash-link">
              Presale page
            </Link>
            .
          </p>
        </div>

        <div className="card dash-card">
          <h2 className="dash-card-title">Your HeatRush journey</h2>
          <p className="dash-card-subtitle">
            Follow these steps to avoid missing out on core HeatRush rewards.
          </p>

          <ol className="dash-steps">
            <li>
              <div className="step-badge">1</div>
              <div className="step-body">
                <div className="step-title">Stake ETH on Base</div>
                <div className="step-text">
                  This is the foundation of your HeatRush reputation. XP and levels are fully on-chain
                  and will matter in every future drop.
                </div>
                <Link to="/staking" className="step-link">
                  Go to Staking →
                </Link>
              </div>
            </li>

            <li>
              <div className="step-badge">2</div>
              <div className="step-body">
                <div className="step-title">Check your airdrop eligibility</div>
                <div className="step-text">
                  If you participated in earlier campaigns, you may already have HR allocated and slowly
                  unlocking over time.
                </div>
                <Link to="/airdrop" className="step-link">
                  Open Airdrop →
                </Link>
              </div>
            </li>

            <li>
              <div className="step-badge">3</div>
              <div className="step-body">
                <div className="step-title">Join the public presale</div>
                <div className="step-text">
                  For new users or bigger conviction, presale is your direct way to accumulate HR before
                  the wider market catches up.
                </div>
                <Link to="/presale" className="step-link">
                  Join Presale →
                </Link>
              </div>
            </li>
          </ol>
        </div>

        <div className="card dash-card dash-why-card">
          <h2 className="dash-card-title">Why act early?</h2>
          <p className="dash-card-subtitle">
            HeatRush is still in its early chapters. The addresses that move now are the ones that narratives are built around later.
          </p>
          <ul className="dash-why-list">
            <li>
              <span className="bullet" />
              <span>
                <strong>Staking</strong> feeds the treasury that powers future campaigns, experiments, and collaborations.
              </span>
            </li>
            <li>
              <span className="bullet" />
              <span>
                <strong>Airdrop allocations</strong> are finite. If you&apos;re eligible and don&apos;t claim, the unclaimed HR doesn&apos;t work for you.
              </span>
            </li>
            <li>
              <span className="bullet" />
              <span>
                <strong>Presale</strong> is designed as the cleanest entry point before liquidity and full market discovery.
              </span>
            </li>
          </ul>
          <p className="dash-why-footnote">
            Ignoring all three doesn&apos;t punish you directly… it just means other addresses will be ahead of you when HeatRush expands.
          </p>
        </div>

        <div className="card dash-card dash-links-card">
          <h2 className="dash-card-title">Quick links & resources</h2>

          {/* Core & app links */}
          <div className="dash-links-section">
            <h3 className="dash-links-section-title">Core app & docs</h3>
            <div className="dash-links-grid">
              <a href="https://heatrush.xyz" target="_blank" rel="noreferrer" className="dash-link-pill">
                Main HeatRush site
              </a>
              <a href="https://docs.heatrush.xyz/" target="_blank" rel="noreferrer" className="dash-link-pill">
                Docs & litepaper
              </a>
              <a href="https://zealy.io/cw/heatrush/questboard" target="_blank" rel="noreferrer" className="dash-link-pill">
                Zealy questboard
              </a>
              <a href="https://guild.xyz/heatrush" target="_blank" rel="noreferrer" className="dash-link-pill">
                Guild – roles & access
              </a>
            </div>
          </div>

          {/* Community & social */}
          <div className="dash-links-section">
            <h3 className="dash-links-section-title">Community & social</h3>
            <div className="dash-links-grid">
              <a href="https://x.com/Rush_finance" target="_blank" rel="noreferrer" className="dash-link-pill">
                X (Rush Finance)
              </a>
              <a href="https://farcaster.xyz/heatrush.eth" target="_blank" rel="noreferrer" className="dash-link-pill">
                Farcaster – @heatrush.eth
              </a>
              <a href="https://t.me/Heat_rush" target="_blank" rel="noreferrer" className="dash-link-pill">
                Telegram community
              </a>
            </div>
          </div>

          {/* On-chain / NFTs */}
          <div className="dash-links-section">
            <h3 className="dash-links-section-title">On-chain & NFTs</h3>
            <div className="dash-links-grid">
              <a
                href="https://opensea.io/0xf1417c94d4827ea5f59c3ccd4884e44af5d099e1"
                target="_blank"
                rel="noreferrer"
                className="dash-link-pill"
              >
                Official OpenSea profile
              </a>
            </div>
          </div>

          {/* Support */}
          <div className="dash-links-section">
            <h3 className="dash-links-section-title">Support & contact</h3>
            <p className="dash-links-support-text">
              For questions or support, reach us at{" "}
              <a href="mailto:support@heatrush.xyz" className="dash-link-mail">
                support@heatrush.xyz
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
