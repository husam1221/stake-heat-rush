// src/pages/season2/Season2Page.jsx
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { formatUnits } from "viem";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Trophy,
  Users,
  Flame,
  Coins,
  ExternalLink,
  Info,
  ShieldCheck,
  BadgeCheck,
  ShoppingBag,
  Lock,
  Route,
  Layers,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import { STAKING_ABI } from "../../lib/staking.js";
import { STAKING_CONTRACT_ADDRESS, TGE_TIMESTAMP } from "../../lib/constants.js";
import { CLAIM_ABI, CLAIM_ADDRESS } from "../../lib/claim.js";

// ✅ NEW: Read presale progress from presale contract itself
import { PRESALE_ABI, PRESALE_ADDRESS } from "../../lib/presale.js";

import ownImg from "../../assets/own.png";
import AirsropsImg from "../../assets/Airsrops.png";
import HrWordIcon from "../../assets/Tokens.png";

import "../../styles/season2.css";

function HRTag({ size = 26, className = "" }) {
  return (
    <span className={`hr-inline ${className}`} aria-label="HR">
      <img
        src={HrWordIcon}
        alt="HR"
        style={{ width: size, height: size }}
        className="hr-inline-img"
      />
      <span className="hr-inline-text">HR</span>
    </span>
  );
}

// =============================
// ✅ CONFIG (edit anytime)
// =============================
const S2 = {
  startTs: Number(import.meta.env.VITE_S2_START_TS || TGE_TIMESTAMP),

  // Used as “Season 2 activation”
  minStakeEth: Number(import.meta.env.VITE_S2_MIN_STAKE_ETH || 0.01),

  // Ticket unlock (optional) for Twitter campaigns
  minXpForTicket: Number(import.meta.env.VITE_S2_MIN_XP_TICKET || 50),

  // Presale checker (ERC20 token balance)
  // (kept as-is, even if we now read from presale contract)
  presaleTokenAddress: import.meta.env.VITE_PRESALE_TOKEN_ADDRESS || "",
  presaleTokenDecimals: Number(import.meta.env.VITE_PRESALE_TOKEN_DECIMALS || 18),

  // Presale requirement (HR)
  presaleMinHr: Number(import.meta.env.VITE_PRESALE_MIN_HR || 100),

  // Preferred network (Base mainnet by default)
  requiredChainId: Number(import.meta.env.VITE_REQUIRED_CHAIN_ID || 8453), // Base = 8453, Base Sepolia = 84532

  twitter: {
    prizePerWinnerHr: Number(import.meta.env.VITE_TWITTER_PRIZE_HR || 625),
    weeklyWinners: Number(import.meta.env.VITE_TWITTER_WINNERS || 10),
  },
};

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://heatrush-api.husam-aljabre33.workers.dev";

const TWITTER_CLAIM_ADDRESS =
  import.meta.env.VITE_TWITTER_CLAIM_ADDRESS || "";

// (Optional) ERC20 ABI for presale verification if you add token address later
// ✅ kept (don’t delete)
const ERC20_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

// Twitter Winners Claim ABI
const TWITTER_CLAIM_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "week", type: "uint256" },
      { internalType: "address", name: "wallet", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "bytes32[]", name: "proof", type: "bytes32[]" },
    ],
    name: "canClaim",
    outputs: [{ internalType: "bool", name: "bool", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "week", type: "uint256" },
      { internalType: "address", name: "wallet", type: "address" },
    ],
    name: "claimed",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "week", type: "uint256" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "bytes32[]", name: "proof", type: "bytes32[]" },
    ],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const safeNum = (x, fallback = 0) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
};

const shortAddr = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function chainName(id) {
  if (id === 8453) return "Base";
  if (id === 84532) return "Base Sepolia";
  return `Chain ${id}`;
}

function pow10BigInt(decimals) {
  const d = Math.max(0, Math.min(36, Number(decimals) || 18));
  return 10n ** BigInt(d);
}

// ======================================
// Small reusable UI
// ======================================
const Pill = ({ ok, text }) => (
  <div className={`s2-pill ${ok ? "ok" : "warn"}`}>
    {ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
    <span>{text}</span>
  </div>
);

function StatusBadge({ variant = "muted", children }) {
  return <span className={`s2-status-badge ${variant}`}>{children}</span>;
}

function StationDot({ state }) {
  const icon =
    state === "done" ? (
      <CheckCircle2 size={16} />
    ) : state === "locked" ? (
      <Lock size={16} />
    ) : (
      <Route size={16} />
    );

  return (
    <div className={`s2-station-dot ${state}`}>
      <div className="s2-station-dot-inner">{icon}</div>
      {state === "next" && <span className="s2-ripple" aria-hidden="true" />}
    </div>
  );
}

function StationClickable({ onClick, disabled, children, className = "" }) {
  return (
    <div
      className={`s2-clickable ${disabled ? "disabled" : ""} ${className}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onClick}
      onKeyDown={
        disabled
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") onClick?.();
            }
      }
    >
      {children}
    </div>
  );
}

function StationCard({
  title,
  desc,
  meta,
  cta,
  state,
  required,
  onClick,
  disabledClick,
}) {
  const badge =
    state === "done" ? (
      <StatusBadge variant="ok">Completed</StatusBadge>
    ) : state === "next" ? (
      <StatusBadge variant="next">Next</StatusBadge>
    ) : state === "locked" ? (
      <StatusBadge variant="locked">Locked</StatusBadge>
    ) : required ? (
      <StatusBadge variant="req">Required</StatusBadge>
    ) : (
      <StatusBadge variant="muted">Optional</StatusBadge>
    );

  return (
    <StationClickable
      onClick={onClick}
      disabled={disabledClick}
      className="s2-card-click"
    >
      <motion.div
        className={`s2-station-card ${state}`}
        whileHover={disabledClick ? undefined : { y: -2 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
      >
        <div className="s2-station-card-head">
          <div className="s2-station-card-title">
            {title} {badge}
          </div>
          <div className="s2-station-card-desc">{desc}</div>
        </div>

        {meta && <div className="s2-station-card-meta">{meta}</div>}

        {cta && <div className="s2-station-card-cta">{cta}</div>}
      </motion.div>
    </StationClickable>
  );
}

function Tilt3DCard({ title, subtitle, buttonText, href }) {
  const ref = useRef(null);
  const [style, setStyle] = useState({});

  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height; // 0..1
    const rotY = (px - 0.5) * 10;
    const rotX = (0.5 - py) * 10;
    setStyle({
      transform: `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-2px)`,
    });
  }, []);

  const onLeave = useCallback(() => {
    setStyle({ transform: "perspective(900px) rotateX(0deg) rotateY(0deg)" });
  }, []);

  return (
    <a
      ref={ref}
      className="s2-tilt-card"
      href={href}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={style}
    >
      <div className="s2-tilt-card-glow" aria-hidden="true" />
      <div className="s2-tilt-card-body">
        <div className="s2-tilt-card-kicker">
          <Layers size={16} /> Season 1
        </div>
        <div className="s2-tilt-card-title">{title}</div>
        <div className="s2-tilt-card-sub">{subtitle}</div>
        <div className="s2-tilt-card-btn">
          <span>{buttonText}</span>
          <ExternalLink size={16} />
        </div>
      </div>
    </a>
  );
}

export default function Season2Page({ showToast }) {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // Network checks
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const isOnRequiredChain = useMemo(() => {
    if (!isConnected) return false;
    return chainId === S2.requiredChainId;
  }, [isConnected, chainId]);

  // =============================
  // 1) STAKING (mandatory activation)
  // =============================
  const { data: stakedData } = useReadContract({
    abi: STAKING_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "userStaked",
    args: [address || ZERO_ADDRESS],
  });

  const stakedEth = useMemo(() => {
    if (!stakedData || stakedData <= 0n) return 0;
    return safeNum(formatUnits(stakedData, 18), 0);
  }, [stakedData]);

  const seasonActivated = stakedEth >= S2.minStakeEth;

  // =============================
  // 2) XP + History (Worker)
  // =============================
  const [xpProfile, setXpProfile] = useState(null);
  const [xpHistory, setXpHistory] = useState(null);
  const [xpLoading, setXpLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!address) {
        setXpProfile(null);
        setXpHistory(null);
        return;
      }
      try {
        setXpLoading(true);

        const p = await fetch(
          `${API_BASE}/xp/profile?wallet=${address.toLowerCase()}`
        ).then((r) => r.json());

        const h = await fetch(
          `${API_BASE}/xp/history?wallet=${address.toLowerCase()}&days=14`
        ).then((r) => r.json());

        if (!cancelled) {
          setXpProfile(p?.ok ? p : null);
          setXpHistory(h?.ok ? h : null);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setXpProfile(null);
          setXpHistory(null);
        }
      } finally {
        if (!cancelled) setXpLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [address]);

  const xpGlobal = safeNum(xpProfile?.totals?.xp_global, 0);

  // =============================
  // 3) REFERRALS (Worker) (kept as-is)
  // =============================
  const [refStats, setRefStats] = useState(null);
  const [refLoading, setRefLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!address) {
        setRefStats(null);
        return;
      }
      try {
        setRefLoading(true);
        const s = await fetch(
          `${API_BASE}/referral/stats?wallet=${address.toLowerCase()}`
        ).then((r) => r.json());

        if (!cancelled) setRefStats(s?.ok ? s : null);
      } catch (e) {
        console.error(e);
        if (!cancelled) setRefStats(null);
      } finally {
        if (!cancelled) setRefLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [address]);

  const qualifiedRefs = safeNum(refStats?.totals?.totalQualified, 0);

  // =============================
  // 4) “Claim once” (optional boost) (kept as-is)
  // =============================
  const [airdropMerkleEntry, setAirdropMerkleEntry] = useState(null);

  useEffect(() => {
    if (!address) {
      setAirdropMerkleEntry(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/airdrop-merkle.json");
        if (!res.ok) return;

        const json = await res.json();
        const lower = address.toLowerCase();

        const entry =
          (json?.claims && (json.claims[lower] || json.claims[address])) || null;

        if (!cancelled) {
          if (entry?.totalAllocationWei) {
            setAirdropMerkleEntry({
              totalAllocationWei: entry.totalAllocationWei,
            });
          } else {
            setAirdropMerkleEntry(null);
          }
        }
      } catch {
        if (!cancelled) setAirdropMerkleEntry(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address]);

  const totalAllocWei = airdropMerkleEntry?.totalAllocationWei
    ? BigInt(airdropMerkleEntry.totalAllocationWei)
    : 0n;

  const { data: unlockedData } = useReadContract({
    abi: CLAIM_ABI,
    address: CLAIM_ADDRESS,
    functionName: "unlockedAmount",
    args: [address || ZERO_ADDRESS, totalAllocWei],
  });

  const { data: claimableData } = useReadContract({
    abi: CLAIM_ABI,
    address: CLAIM_ADDRESS,
    functionName: "claimableAmount",
    args: [address || ZERO_ADDRESS, totalAllocWei],
  });

  const hasClaimedOnce = useMemo(() => {
    if (!unlockedData || unlockedData <= 0n) return false;
    const c = claimableData ?? 0n;
    return unlockedData > c;
  }, [unlockedData, claimableData]);

  // =============================
  // 5) PRESALE (required for eligibility here)
  // ✅ NOW reads from Presale contract totalHrFor(address)
  // (kept old ERC20 ABI/config above without deleting)
  // =============================
  const presaleConfigured =
    !!PRESALE_ADDRESS &&
    typeof PRESALE_ADDRESS === "string" &&
    PRESALE_ADDRESS.startsWith("0x");

  const { data: presaleTotalHrFor } = useReadContract({
    abi: PRESALE_ABI,
    address: presaleConfigured ? PRESALE_ADDRESS : undefined,
    functionName: "totalHrFor",
    args: [address || ZERO_ADDRESS],
    query: { enabled: !!address && presaleConfigured },
  });

  const presaleBalHr = useMemo(() => {
    if (!presaleConfigured || !presaleTotalHrFor) return 0;
    // totalHrFor is 18 decimals
    return safeNum(formatUnits(presaleTotalHrFor, 18), 0);
  }, [presaleConfigured, presaleTotalHrFor]);

  // Keeping these (not used now) to avoid “deleting” anything important:
  const presaleMinWei = useMemo(() => {
    const d = Number.isFinite(S2.presaleTokenDecimals)
      ? S2.presaleTokenDecimals
      : 18;
    const min = Number.isFinite(S2.presaleMinHr) ? S2.presaleMinHr : 100;
    return BigInt(Math.max(0, Math.floor(min))) * pow10BigInt(d);
  }, []);

  const presaleDone = useMemo(() => {
    if (!presaleConfigured) return false;
    return presaleBalHr >= S2.presaleMinHr;
  }, [presaleConfigured, presaleBalHr]);

  // =============================
  // 6) WEEK (kept)
  // =============================
  const currentWeek = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - S2.startTs;
    if (diff <= 0) return 1;
    return Math.floor(diff / (7 * 86400)) + 1;
  }, []);

  // =============================
  // 7) CHART (kept)
  // =============================
  const chartData = useMemo(() => {
    const items = xpHistory?.items || [];
    return items.map((d) => ({
      day: d.date,
      xp: safeNum(d.totalXp, 0),
    }));
  }, [xpHistory]);

  // =============================
  // UI helpers
  // =============================
  const walletVerified = isConnected && !!address;
  const walletVerifiedAndCorrectChain = walletVerified && isOnRequiredChain;

  const xpDone = xpGlobal > 0;

  const activationProgress = seasonActivated
    ? 100
    : clamp((stakedEth / S2.minStakeEth) * 100, 0, 100);

  // =============================
  // Twitter Rewards Claim (kept)
  // =============================
  const twitterAddressReady =
    !!TWITTER_CLAIM_ADDRESS && TWITTER_CLAIM_ADDRESS.startsWith("0x");

  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  useEffect(() => setSelectedWeek(currentWeek), [currentWeek]);

  const [weekFile, setWeekFile] = useState(null);
  const [weekFileError, setWeekFileError] = useState(null);
  const [weekFileLoading, setWeekFileLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadWeek() {
      setWeekFileLoading(true);
      setWeekFileError(null);
      setWeekFile(null);

      try {
        const res = await fetch(`/twitter-week-${selectedWeek}-merkle.json`);
        if (!res.ok) throw new Error("Week file not found");
        const json = await res.json();
        if (!cancelled) setWeekFile(json);
      } catch {
        if (!cancelled) {
          setWeekFileError("This week's winners file is not published yet.");
          setWeekFile(null);
        }
      } finally {
        if (!cancelled) setWeekFileLoading(false);
      }
    }

    if (selectedWeek) loadWeek();
    return () => {
      cancelled = true;
    };
  }, [selectedWeek]);

  const myWeekClaim = useMemo(() => {
    if (!address || !weekFile?.claims) return null;
    return weekFile.claims[address.toLowerCase()] || null;
  }, [address, weekFile]);

  const myPrizeWei = myWeekClaim?.amountWei ? BigInt(myWeekClaim.amountWei) : 0n;
  const myProof = Array.isArray(myWeekClaim?.proof) ? myWeekClaim.proof : [];

  const { data: alreadyClaimedTwitter } = useReadContract({
    abi: TWITTER_CLAIM_ABI,
    address: twitterAddressReady ? TWITTER_CLAIM_ADDRESS : undefined,
    functionName: "claimed",
    args: [BigInt(selectedWeek || 0), address || ZERO_ADDRESS],
    query: { enabled: !!address && twitterAddressReady && !!selectedWeek },
  });

  const { data: canClaimTwitter } = useReadContract({
    abi: TWITTER_CLAIM_ABI,
    address: twitterAddressReady ? TWITTER_CLAIM_ADDRESS : undefined,
    functionName: "canClaim",
    args: [BigInt(selectedWeek || 0), address || ZERO_ADDRESS, myPrizeWei, myProof],
    query: {
      enabled:
        !!address &&
        twitterAddressReady &&
        !!selectedWeek &&
        myPrizeWei > 0n &&
        myProof.length > 0,
    },
  });

  const [isClaimingTwitter, setIsClaimingTwitter] = useState(false);

  const handleSwitchNetwork = async () => {
    try {
      await switchChainAsync({ chainId: S2.requiredChainId });
    } catch (e) {
      console.error(e);
      showToast?.(
        "error",
        e?.shortMessage || e?.message || "Failed to switch network"
      );
    }
  };

  const handleTwitterClaim = async () => {
    if (!isConnected) {
      showToast?.("error", "Connect your wallet first.");
      return;
    }
    if (!isOnRequiredChain) {
      showToast?.(
        "error",
        `Please switch to ${chainName(S2.requiredChainId)} to claim.`
      );
      return;
    }
    if (!twitterAddressReady) {
      showToast?.("error", "Twitter claim contract address is not configured.");
      return;
    }
    if (!myWeekClaim || myPrizeWei === 0n || myProof.length === 0) {
      showToast?.("error", "You are not eligible for this week's Twitter reward.");
      return;
    }
    if (alreadyClaimedTwitter) {
      showToast?.("error", "Already claimed for this week.");
      return;
    }
    if (canClaimTwitter === false) {
      showToast?.("error", "Not claimable (root/proof mismatch).");
      return;
    }

    try {
      setIsClaimingTwitter(true);

      const hash = await writeContractAsync({
        abi: TWITTER_CLAIM_ABI,
        address: TWITTER_CLAIM_ADDRESS,
        functionName: "claim",
        args: [BigInt(selectedWeek), myPrizeWei, myProof],
      });

      showToast?.("success", "Reward claim transaction sent ✅");

      const isSepolia = S2.requiredChainId === 84532;
      const baseScan = isSepolia
        ? "https://sepolia.basescan.org"
        : "https://basescan.org";
      if (hash) window.open(`${baseScan}/tx/${hash}`, "_blank");
    } catch (e) {
      console.error(e);
      showToast?.("error", e?.shortMessage || e?.message || "Claim failed");
    } finally {
      setIsClaimingTwitter(false);
    }
  };

  // =============================
  // Journey (Eligibility Path) — UI ONLY
  // Required steps:
  // 1) Verify wallet
  // 2) Stake (activate)
  // 3) Earn XP
  // 4) Presale >= 100 HR
  // =============================
  const journey = useMemo(() => {
    const verifyDone = walletVerifiedAndCorrectChain;
    const stakeDone = seasonActivated;
    const xpDoneLocal = xpDone;
    const presaleDoneLocal = presaleDone;

    const verifyState = verifyDone ? "done" : "next";

    const stakeState = !verifyDone ? "locked" : stakeDone ? "done" : "next";

    const xpState = !stakeDone ? "locked" : xpDoneLocal ? "done" : "next";

    const presaleState = !xpDoneLocal ? "locked" : presaleDoneLocal ? "done" : "next";

    // Next best action (single CTA)
    let next = {
      title: "Verify your wallet",
      why: "Connect your wallet and switch to the correct network.",
      ctaText: "Connect wallet",
      ctaHref: null,
      ctaOnClick: null,
      icon: <ShieldCheck size={18} />,
    };

    if (!walletVerified) {
      next = {
        title: "Verify your wallet",
        why: "Connect your wallet to continue.",
        ctaText: "Connect wallet",
        ctaHref: null,
        ctaOnClick: null,
        icon: <ShieldCheck size={18} />,
      };
    } else if (!isOnRequiredChain) {
      next = {
        title: "Switch to the correct network",
        why: `Eligibility runs on ${chainName(S2.requiredChainId)}.`,
        ctaText: `Switch to ${chainName(S2.requiredChainId)}`,
        ctaHref: null,
        ctaOnClick: handleSwitchNetwork,
        icon: <ShieldCheck size={18} />,
      };
    } else if (!stakeDone) {
      next = {
        title: "Stake to activate",
        why: `Stake at least ${S2.minStakeEth} ETH to activate.`,
        ctaText: "Go to Staking",
        ctaHref: "/staking",
        ctaOnClick: null,
        icon: <Flame size={18} />,
      };
    } else if (!xpDoneLocal) {
      next = {
        title: "Earn XP",
        why: "Complete tasks to earn XP and continue eligibility.",
        ctaText: "Go to Tasks",
        ctaHref: "/tasks",
        ctaOnClick: null,
        icon: <BadgeCheck size={18} />,
      };
    } else if (!presaleDoneLocal) {
      next = {
        title: "Complete Presale requirement",
        why: `You need at least ${S2.presaleMinHr} HR.`,
        ctaText: "Go to Presale",
        ctaHref: "/presale",
        ctaOnClick: null,
        icon: <ShoppingBag size={18} />,
      };
    } else {
      next = {
        title: "Check Season 1 eligibility",
        why: "You completed the eligibility path. Now verify your Season 1 airdrop.",
        ctaText: "Check Eligibility",
        ctaHref: "/airdrop",
        ctaOnClick: null,
        icon: <Layers size={18} />,
      };
    }

    return {
      verifyDone,
      stakeDone,
      xpDoneLocal,
      presaleDoneLocal,
      verifyState,
      stakeState,
      xpState,
      presaleState,
      next,
    };
  }, [
    walletVerified,
    walletVerifiedAndCorrectChain,
    isOnRequiredChain,
    seasonActivated,
    xpDone,
    presaleDone,
    handleSwitchNetwork,
  ]);

  // Click handlers (any click on a step goes to target)
  const goStake = () => (window.location.href = "/staking");
  const goTasks = () => (window.location.href = "/tasks");
  const goPresale = () => (window.location.href = "/presale");
  const goAirdrop = () => (window.location.href = "/airdrop");

  const onVerifyClick = async () => {
    if (!walletVerified) {
      showToast?.("info", "Use “Connect Wallet” in the header.");
      return;
    }
    if (!isOnRequiredChain) {
      await handleSwitchNetwork();
      return;
    }
    showToast?.("success", "Wallet is already verified ✅");
  };

  return (
    <div className="season2-page">
      <div className="s2-kicker">
        <Sparkles size={16} /> Season 2 Dashboard
      </div>

      {/* ================= HERO ================= */}
      <motion.div
        className="card s2-hero"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="s2-hero-left">
          {/* 3D Card: Season 1 Eligibility */}
          <div className="s2-hero-cta-row">
            <Tilt3DCard
              title="Check Season 1 Eligibility"
              subtitle="Verify your Season 1 airdrop eligibility and claim schedule."
              buttonText="Check Eligibility"
              href="/airdrop"
            />
          </div>
        </div>

        <div className="s2-hero-right">
          <div className="s2-mini">
            <div className="s2-mini-label">Wallet</div>
            <div className="s2-mini-value">
              {isConnected ? shortAddr(address) : "Not connected"}
            </div>
          </div>

          <div className="s2-mini">
            <div className="s2-mini-label">Network</div>
            <div className={`s2-mini-value ${isOnRequiredChain ? "okText" : ""}`}>
              {walletVerified ? chainName(chainId) : "—"}
            </div>
          </div>

          {!isOnRequiredChain && walletVerified && (
            <button
              className="s2-btn small s2-glow-btn is-next"
              onClick={handleSwitchNetwork}
            >
              Switch to {chainName(S2.requiredChainId)} <ExternalLink size={16} />
            </button>
          )}
        </div>
      </motion.div>

      {/* ================= SEASON 2 SECTION ================= */}
      <div className="s2-section">
        <div className="s2-section-head">
          <div className="s2-tilt-card-kicker">
            <Layers size={20} /> <strong>Season 2 ( Eligibility Path )</strong>
          </div>

          <div className="muted">
            Required steps: Verify → Stake → XP → Presale ≥ {S2.presaleMinHr} HR
          </div>
        </div>

        <div className="s2-grid">
          {/* Journey (Metro UI) */}
          <motion.div
            className="card s2-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
          >
            <div className="s2-journey-head">
              <div>
                <h3 className="s2-card-title" style={{ marginBottom: 6 }}>
                  Your Journey
                </h3>
                <div className="muted">Click any step to jump to its page.</div>
              </div>

              <div className="s2-journey-chip">
                <Route size={16} />
                <span>{journey.presaleDoneLocal ? "Eligible " : "In progress"}</span>
              </div>
            </div>

            <div className="s2-progress">
              <div className="s2-progress-top">
                <span>Stake activation progress</span>
                <span className="muted">{activationProgress.toFixed(0)}%</span>
              </div>
              <div className="s2-progress-bar">
                <motion.div
                  className="s2-progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${activationProgress}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <div className="s2-progress-note muted">
                {seasonActivated
                  ? "✅ Stake activated. Continue with XP then Presale."
                  : "❗ Stake is required to continue the eligibility path."}
              </div>
            </div>

            {/* Metro Map (single required line with 4 steps) */}
            <div className="s2-metro">
              <div className="s2-line-block">
                <div className="s2-line-label">
                  <span className="s2-line-pill req">Required Steps</span>
                  <span className="muted">Click any step</span>
                </div>

                {/* Vertical Timeline */}
                <div className="s2-timeline">
                  {/* 1) Verify */}
                  <StationClickable
                    onClick={onVerifyClick}
                    disabled={false}
                    className="s2-tl-item"
                  >
                    <div
                      className={`s2-tl-connector top ${
                        journey.verifyState === "done" ? "lit" : ""
                      }`}
                    />
                    <StationDot state={journey.verifyState} />
                    <div className="s2-tl-body">
                      <div className="s2-tl-title">Verify wallet</div>
                      <div className="s2-tl-sub muted">
                        {walletVerified
                          ? isOnRequiredChain
                            ? "Verified "
                            : `Wrong network — switch to ${chainName(S2.requiredChainId)}`
                          : "Connect wallet to continue"}
                      </div>
                    </div>
                    <div className="s2-tl-arrow">↗</div>
                    <div
                      className={`s2-tl-connector bottom ${
                        journey.stakeState === "done" ? "lit" : ""
                      }`}
                    />
                  </StationClickable>

                  {/* 2) Stake */}
                  <StationClickable
                    onClick={goStake}
                    disabled={journey.stakeState === "locked"}
                    className="s2-tl-item"
                  >
                    <div
                      className={`s2-tl-connector top ${
                        journey.stakeState === "done" ? "lit" : ""
                      }`}
                    />
                    <StationDot state={journey.stakeState} />
                    <div className="s2-tl-body">
                      <div className="s2-tl-title">Stake 0.01 EH</div>
                      <div className="s2-tl-sub muted">
                        {journey.stakeState === "locked"
                          ? "Locked — verify wallet first"
                          : `Staked: ${stakedEth.toFixed(4)} ETH`}
                      </div>
                    </div>
                    <div className="s2-tl-arrow">↗</div>
                    <div
                      className={`s2-tl-connector bottom ${
                        journey.xpState === "done" ? "lit" : ""
                      }`}
                    />
                  </StationClickable>

                  {/* 3) XP */}
                  <StationClickable
                    onClick={goTasks}
                    disabled={journey.xpState === "locked"}
                    className="s2-tl-item"
                  >
                    <div
                      className={`s2-tl-connector top ${
                        journey.xpState === "done" ? "lit" : ""
                      }`}
                    />
                    <StationDot state={journey.xpState} />
                    <div className="s2-tl-body">
                      <div className="s2-tl-title">Earn XP</div>
                      <div className="s2-tl-sub muted">
                        {journey.xpState === "locked"
                          ? "Locked — stake first"
                          : `XP: ${xpLoading ? "…" : xpGlobal}`}
                      </div>
                    </div>
                    <div className="s2-tl-arrow">↗</div>
                    <div
                      className={`s2-tl-connector bottom ${
                        journey.presaleState === "done" ? "lit" : ""
                      }`}
                    />
                  </StationClickable>

                  {/* 4) Presale */}
                  <StationClickable
                    onClick={goPresale}
                    disabled={journey.presaleState === "locked"}
                    className="s2-tl-item"
                  >
                    <div
                      className={`s2-tl-connector top ${
                        journey.presaleState === "done" ? "lit" : ""
                      }`}
                    />
                    <StationDot state={journey.presaleState} />
                    <div className="s2-tl-body">
                      <div className="s2-tl-title">
                        Presale ≥ {S2.presaleMinHr} <HRTag />
                      </div>
                      <div className="s2-tl-sub muted">
                        {journey.presaleState === "locked"
                          ? "Locked — earn XP first"
                          : presaleConfigured
                          ? `HR: ${presaleBalHr.toFixed(2)} / ${S2.presaleMinHr}`
                          : "Presale check not configured"}
                      </div>
                    </div>
                    <div className="s2-tl-arrow">↗</div>
                    <div className="s2-tl-connector bottom end" />
                  </StationClickable>
                </div>

                {/* Next Preview */}
                <div className="s2-map-next">
                  <div className="s2-map-next-head">
                    <div className="s2-map-next-kicker">Next best action</div>
                    <div className="s2-map-next-title">{journey.next.title}</div>
                    <div className="s2-map-next-why muted">{journey.next.why}</div>
                  </div>

                  <div className="s2-map-next-cta">
                    {journey.next.ctaOnClick ? (
                      <button
                        className="s2-btn s2-glow-btn is-next"
                        onClick={journey.next.ctaOnClick}
                      >
                        {journey.next.ctaText} <ExternalLink size={18} />
                      </button>
                    ) : journey.next.ctaHref ? (
                      <a className="s2-btn s2-glow-btn is-next" href={journey.next.ctaHref}>
                        {journey.next.ctaText} <ExternalLink size={18} />
                      </a>
                    ) : (
                      <div className="muted">Use “Connect Wallet” from the header.</div>
                    )}
                  </div>
                </div>

                <div className="s2-map-next-art">
                  <img src={ownImg} alt="Season 1" />
                </div>
              </div>

              {/* Details Panel */}
              <div className="s2-metro-details">
                <div className="s2-details-title">
                  <Info size={16} /> Steps details
                </div>

                <div className="s2-details-list">
                  <StationCard
                    title="1) Verify wallet"
                    desc={`Connect your wallet and use ${chainName(S2.requiredChainId)}.`}
                    required
                    state={journey.verifyState}
                    onClick={onVerifyClick}
                    disabledClick={false}
                    meta={
                      walletVerified
                        ? `Status: ${isOnRequiredChain ? "Verified " : "Connected but wrong network"}`
                        : "Status: Not connected"
                    }
                    cta={
                      !walletVerified ? (
                        <button
                          className={`s2-btn s2-glow-btn ${
                            journey.verifyState === "next" ? "is-next" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            showToast?.("info", "Use “Connect Wallet” in the header.");
                          }}
                        >
                          Connect Wallet <ExternalLink size={18} />
                        </button>
                      ) : !isOnRequiredChain ? (
                        <button
                          className={`s2-btn s2-glow-btn ${
                            journey.verifyState === "next" ? "is-next" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSwitchNetwork();
                          }}
                        >
                          Switch to {chainName(S2.requiredChainId)} <ExternalLink size={18} />
                        </button>
                      ) : (
                        <button
                          className="s2-btn s2-glow-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            showToast?.("success", "Already verified ");
                          }}
                        >
                          Verified <CheckCircle2 size={18} />
                        </button>
                      )
                    }
                  />

                  <StationCard
                    title="2) Stake (activate)"
                    desc={`Stake at least ${S2.minStakeEth} ETH to continue.`}
                    required
                    state={journey.stakeState}
                    onClick={goStake}
                    disabledClick={journey.stakeState === "locked"}
                    meta={`Your staked ETH: ${stakedEth.toFixed(4)} ETH`}
                    cta={
                      <a
                        className={`s2-btn s2-glow-btn ${
                          journey.stakeState === "next" ? "is-next" : ""
                        } ${journey.stakeState === "locked" ? "disabled" : ""}`}
                        href="/staking"
                        onClick={(e) => {
                          if (journey.stakeState === "locked") {
                            e.preventDefault();
                            e.stopPropagation();
                            showToast?.("error", "Verify wallet first.");
                          }
                        }}
                      >
                        Go to Staking <ExternalLink size={18} />
                      </a>
                    }
                  />

                  <StationCard
                    title="3) Earn XP"
                    desc="Complete tasks/daily to earn XP and continue."
                    required
                    state={journey.xpState}
                    onClick={goTasks}
                    disabledClick={journey.xpState === "locked"}
                    meta={xpLoading ? "Loading XP…" : `Your XP: ${xpGlobal}`}
                    cta={
                      <a
                        className={`s2-btn s2-glow-btn ${
                          journey.xpState === "next" ? "is-next" : ""
                        } ${journey.xpState === "locked" ? "disabled" : ""}`}
                        href="/tasks"
                        onClick={(e) => {
                          if (journey.xpState === "locked") {
                            e.preventDefault();
                            e.stopPropagation();
                            showToast?.("error", "Stake first to unlock this step.");
                          }
                        }}
                      >
                        Go to Tasks <ExternalLink size={18} />
                      </a>
                    }
                  />

                  <StationCard
                    title={`4) Presale (≥ ${S2.presaleMinHr} HR)`}
                    desc={`Buy at least ${S2.presaleMinHr} HR to complete eligibility.`}
                    required
                    state={journey.presaleState}
                    onClick={goPresale}
                    disabledClick={journey.presaleState === "locked"}
                    meta={
                      presaleConfigured
                        ? `Your HR: ${presaleBalHr.toFixed(2)} / ${S2.presaleMinHr}`
                        : "Presale check is not configured yet."
                    }
                    cta={
                      <a
                        className={`s2-btn s2-glow-btn ${
                          journey.presaleState === "next" ? "is-next" : ""
                        } ${journey.presaleState === "locked" ? "disabled" : ""}`}
                        href="/presale"
                        onClick={(e) => {
                          if (journey.presaleState === "locked") {
                            e.preventDefault();
                            e.stopPropagation();
                            showToast?.("error", "Earn XP first to unlock this step.");
                          }
                        }}
                      >
                        Go to Presale <ExternalLink size={18} />
                      </a>
                    }
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Progress & Activity (kept) */}
          <motion.div
            className="card s2-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
          >
            <h3 className="s2-card-title">Your progress</h3>

            {!isConnected ? (
              <div className="muted">Connect your wallet to see your progress.</div>
            ) : (
              <>
                <div className="s2-stat-grid">
                  <div className="s2-stat">
                    <div className="label">Stake activation</div>
                    <div className={`value ${seasonActivated ? "okText" : ""}`}>
                      {seasonActivated ? "Activated " : "Not activated"}
                    </div>
                    <div className="hint muted">Stake ≥ {S2.minStakeEth} ETH</div>
                  </div>

                  <div className="s2-stat">
                    <div className="label">Your staked ETH</div>
                    <div className="value">{stakedEth.toFixed(4)} ETH</div>
                    <div className="hint muted">Required</div>
                  </div>

                  <div className="s2-stat">
                    <div className="label">XP</div>
                    <div className="value">{xpLoading ? "…" : xpGlobal}</div>
                    <div className="hint muted">Required</div>
                  </div>

                  <div className="s2-stat">
                    <div className="label">Presale HR</div>
                    <div className="value">{presaleConfigured ? presaleBalHr.toFixed(2) : "—"}</div>
                    <div className="hint muted">Required ≥ {S2.presaleMinHr}</div>
                  </div>
                </div>

                <div className="s2-divider" />

                <div className="s2-chart-head">
                  <h3 className="s2-card-title" style={{ marginBottom: 0 }}>
                    XP activity (last 14 days)
                  </h3>
                  <div className="muted">Consistent activity helps you complete the path.</div>
                </div>

                <div className="s2-chart-wrap">
                  <ResponsiveContainer>
                    <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(255, 170, 0, 0.35)" />
                          <stop offset="60%" stopColor="rgba(255, 138, 38, 0.12)" />
                          <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="4 6" opacity={0.12} vertical={false} />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 11, fill: "rgba(255,255,255,0.55)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "rgba(255,255,255,0.45)" }}
                        axisLine={false}
                        tickLine={false}
                        width={32}
                      />
                      <Tooltip
                        cursor={{ stroke: "rgba(255, 170, 0, 0.18)", strokeWidth: 1 }}
                        contentStyle={{
                          background: "rgba(10,10,12,0.88)",
                          border: "1px solid rgba(255,170,0,0.18)",
                          borderRadius: 14,
                          boxShadow: "0 18px 36px rgba(0,0,0,0.35)",
                          color: "rgba(255,255,255,0.9)",
                        }}
                        labelStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}
                        itemStyle={{ color: "rgba(255,170,0,0.95)", fontWeight: 900 }}
                      />

                      <Area
                        type="monotone"
                        dataKey="xp"
                        stroke="rgba(255, 170, 0, 0.95)"
                        strokeWidth={2.3}
                        fill="url(#xpFill)"
                        dot={false}
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            <div className="airdrop-after-chart">
              <img src={AirsropsImg} alt="Airdrops" className="airdrop-after-chart-img" />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="s2-note-box">
        <div className="s2-note-title">
          <Info size={16} /> Notes
        </div>
        <div className="muted">
          Referrals are optional (Qualified: {refLoading ? "…" : qualifiedRefs}). Claim-once boost detected:{" "}
          {hasClaimedOnce ? "Yes ✅" : "No"}
        </div>
      </div>

      <div className="s2-links">
        <a className="s2-link" href="/airdrop">
          Season 1 Airdrop <ExternalLink size={16} />
        </a>
        <a className="s2-link" href="/profile">
          Profile <ExternalLink size={16} />
        </a>
      </div>

      {/* ================= TWITTER SECTION (SEPARATE) (kept) ================= */}
      <div className="s2-section twitter">
        <div className="s2-section-head">
          <h2 className="s2-h2">Twitter Rewards</h2>
          <div className="muted">
            Winners are published weekly. If your wallet is selected, you can claim here.
          </div>
        </div>

        <motion.div
          className="card s2-card twitter-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
        >
          {!twitterAddressReady && (
            <div className="s2-alert warn">
              <AlertTriangle size={18} />
              <div>
                Twitter claim contract is not configured. Add:
                <div className="mono">VITE_TWITTER_CLAIM_ADDRESS=0x...</div>
              </div>
            </div>
          )}

          <div className="tw-head">
            <div className="tw-title">
              <Trophy size={18} /> Weekly Winners Claim
            </div>

            <div className="tw-week">
              <span className="muted">Week</span>
              <select
                className="s2-select"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
              >
                {Array.from({ length: Math.max(currentWeek, 6) }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    Week {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="tw-grid">
            <div className="tw-box">
              <div className="tw-row">
                <div className="muted">Winners file</div>
                <div>
                  {weekFileLoading
                    ? "Loading…"
                    : weekFile
                    ? `twitter-week-${selectedWeek}-winners file ✅`
                    : "Not found ❌"}
                </div>
              </div>

              {weekFileError && (
                <div className="s2-alert">
                  <Info size={18} />
                  <div>{weekFileError}</div>
                </div>
              )}

              <div className="tw-row">
                <div className="muted">Wallet</div>
                <div>{isConnected ? shortAddr(address) : "Not connected"}</div>
              </div>

              <div className="tw-row">
                <div className="muted">Eligible?</div>
                <div className={myPrizeWei > 0n ? "okText" : "muted"}>
                  {myPrizeWei > 0n ? "Yes ✅" : "No"}
                </div>
              </div>

              <div className="tw-row">
                <div className="muted">Reward</div>
                <div className="orange">
                  {myPrizeWei > 0n ? `${S2.twitter.prizePerWinnerHr} HR` : "—"}
                </div>
              </div>

              <div className="tw-row">
                <div className="muted">Already claimed</div>
                <div>
                  {alreadyClaimedTwitter === true
                    ? "Yes ✅"
                    : alreadyClaimedTwitter === false
                    ? "No"
                    : "…"}
                </div>
              </div>

              <div className="tw-row">
                <div className="muted">canClaim()</div>
                <div>
                  {canClaimTwitter === true
                    ? "true ✅"
                    : canClaimTwitter === false
                    ? "false ❌"
                    : "…"}
                </div>
              </div>

              {!isOnRequiredChain && isConnected && (
                <div className="s2-alert warn">
                  <AlertTriangle size={18} />
                  <div>
                    Switch to <strong>{chainName(S2.requiredChainId)}</strong> to claim.
                  </div>
                </div>
              )}

              <button
                className={`s2-btn ${
                  !isConnected ||
                  !isOnRequiredChain ||
                  !twitterAddressReady ||
                  !weekFile ||
                  myPrizeWei === 0n ||
                  alreadyClaimedTwitter === true ||
                  canClaimTwitter === false ||
                  isClaimingTwitter
                    ? "disabled"
                    : ""
                }`}
                disabled={
                  !isConnected ||
                  !isOnRequiredChain ||
                  !twitterAddressReady ||
                  !weekFile ||
                  myPrizeWei === 0n ||
                  alreadyClaimedTwitter === true ||
                  canClaimTwitter === false ||
                  isClaimingTwitter
                }
                onClick={handleTwitterClaim}
              >
                {isClaimingTwitter ? "Processing…" : "Claim reward"} <Coins size={18} />
              </button>
            </div>

            <div className="tw-box glass">
              <div className="tw-how">
                <div className="tw-how-title">
                  <BadgeCheck size={18} /> How to claim
                </div>

                <ul className="tw-list">
                  <li>Your wallet must be in the weekly winners file</li>
                  <li>Connect the same winning wallet.</li>
                  <li>Switch to the correct network ({chainName(S2.requiredChainId)}).</li>
                  <li>Each wallet can claim once per week.</li>
                </ul>

                <div className="tw-mini-note muted">
                  Not eligible? That means your wallet wasn’t selected for this week.
                </div>

                <div className="tw-stats">
                  <div className="chip">
                    <Trophy size={16} /> {S2.twitter.weeklyWinners} winners / week
                  </div>
                  <div className="chip">
                    <Coins size={16} /> {S2.twitter.prizePerWinnerHr} HR each
                  </div>
                </div>

                <div className="tw-mini-note muted">claim Twitter rewards.</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
