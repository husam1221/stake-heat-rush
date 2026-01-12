// src/pages/staking/StakingPage.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  useAccount,
  useBalance,
  useSendTransaction,
  useReadContract,
  useWriteContract,
  usePublicClient,
} from "wagmi";
import { parseEther, formatEther, parseUnits, formatUnits } from "viem";

import {
  BASE_CHAIN_ID,
  STAKING_CONTRACT_ADDRESS,
  FEE_DISTRIBUTOR_ADDRESS,
  HR_TOKEN_ADDRESS,
  HR_STAKING_CONTRACT_ADDRESS,
  ETH_HR_REWARDS_CONTRACT_ADDRESS,
} from "../../lib/constants.js";

import { STAKING_ABI } from "../../lib/staking.js";
import { FEE_DISTRIBUTOR_ABI } from "../../lib/fees";
import { HR_STAKING_ABI } from "../../lib/hrStaking.js";
import { ETH_HR_REWARDS_ABI } from "../../lib/ethHrRewards.js";
import { ERC20_ABI } from "../../lib/erc20.js";

import { qualifyReferral } from "../../lib/referralApi.js";
import { syncOnchainXpApi } from "../../lib/xpApi.js";
import TokensImg from "../../assets/Tokens.png";

import "../../styles/staking.css";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// ====== 3D TILT HANDLERS (خفيف/أنيق) ======
const handleTierTiltMove = (e) => {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();

  const x = e.clientX - r.left;
  const y = e.clientY - r.top;

  const px = x / r.width; // 0..1
  const py = y / r.height; // 0..1

  // ميلان خفيف (إلغاء الميلان القوي)
  const ry = (px - 0.5) * 8; // يمين/يسار
  const rx = (py - 0.5) * -6; // فوق/تحت

  el.style.setProperty("--rx", `${rx}deg`);
  el.style.setProperty("--ry", `${ry}deg`);
  el.style.setProperty("--gx", `${px * 100}%`);
  el.style.setProperty("--gy", `${py * 100}%`);
  el.classList.add("is-tilting");
};

const handleTierTiltLeave = (e) => {
  const el = e.currentTarget;
  el.style.setProperty("--rx", `1deg`);
  el.style.setProperty("--ry", `0deg`);
  el.style.setProperty("--gx", `20%`);
  el.style.setProperty("--gy", `0%`);
  el.classList.remove("is-tilting");
};

// فورمات ETH بأربعة أرقام بعد الفاصلة
const formatEth = (value) => {
  const num = Number(value || 0);
  if (!isFinite(num)) return "0.0000";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
};

const formatNum = (value, decimals = 2) => {
  const num = Number(value || 0);
  if (!isFinite(num)) return "0";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

const formatShortAddress = (addr) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

const getLevelInfo = (level, userStakedEth = 0) => {
  // ✅ UI-only Platinum tier for 3 ETH+
  if (Number(userStakedEth || 0) >= 3) {
    return { label: "Platinum", desc: "Stake ≥ 3.00 ETH to reach Platinum." };
  }

  switch (level) {
    case 1:
      return { label: "Bronze", desc: "Stake ≥ 0.10 ETH to reach Bronze." };
    case 2:
      return { label: "Silver", desc: "Stake ≥ 0.50 ETH to reach Silver." };
    case 3:
      return { label: "Gold", desc: "Stake ≥ 1.00 ETH to reach Gold." };
    default:
      return {
        label: "No Tier Yet",
        desc: "Stake ETH to unlock your first tier and boost your rewards.",
      };
  }
};


// ===== HR Tier / Multiplier (واجهة فقط) =====
const getHrMultiplierInfo = (hrAmount) => {
  const amt = Number(hrAmount || 0);

  // نفس الشرائح اللي اتفقنا عليها
  if (amt >= 200_000) return { mult: 2.0, label: "Elite", nextTarget: null };
  if (amt >= 100_000)
    return { mult: 1.65, label: "Diamond", nextTarget: 200_000 };
  if (amt >= 50_000)
    return { mult: 1.35, label: "Platinum", nextTarget: 100_000 };
  if (amt >= 10_000) return { mult: 1.15, label: "Silver", nextTarget: 50_000 };
  return { mult: 1.0, label: "Starter", nextTarget: 10_000 };
};

const StakingPage = ({ showToast }) => {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient({ chainId: BASE_CHAIN_ID });

  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();

  // ===== ETH WALLET BALANCE =====
  const { data: ethBalData } = useBalance({
    address,
    chainId: BASE_CHAIN_ID,
    watch: true,
  });

  const userBalance = ethBalData?.formatted
    ? Number(ethBalData.formatted).toFixed(6)
    : "0.0000";

  // ===== HR WALLET BALANCE =====
  const { data: hrBalData } = useBalance({
    address,
    chainId: BASE_CHAIN_ID,
    token: HR_TOKEN_ADDRESS,
    watch: true,
  });

  const hrWalletBalance = hrBalData?.formatted
    ? Number(hrBalData.formatted).toFixed(4)
    : "0.0000";

  // ===== Token decimals (للاحتياط) =====
  const { data: hrDecimalsData } = useReadContract({
    abi: ERC20_ABI,
    address: HR_TOKEN_ADDRESS,
    functionName: "decimals",
  });

  const HR_DECIMALS =
    typeof hrDecimalsData === "number"
      ? hrDecimalsData
      : Number(hrDecimalsData || 18);

  // ===== Local UI state =====
  const [amount, setAmount] = useState(""); // ETH stake input
  const [hrAmount, setHrAmount] = useState(""); // HR stake input

  const [isLoading, setIsLoading] = useState(false); // ETH stake
  const [isClaiming, setIsClaiming] = useState(false); // fee distributor claim (old)
  const [showNoRewardsBubble, setShowNoRewardsBubble] = useState(false);

  const [isHrStaking, setIsHrStaking] = useState(false);
  const [isHrClaiming, setIsHrClaiming] = useState(false);
  const [isEthHrClaiming, setIsEthHrClaiming] = useState(false);
  const [isApprovingHr, setIsApprovingHr] = useState(false);

  const claimButtonRef = useRef(null);

  // لو جينا على الصفحة مع #claim ننزل مباشرة لزر المطالبة
  useEffect(() => {
    if (window.location.hash === "#claim" && claimButtonRef.current) {
      claimButtonRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, []);

  // ===== ON-CHAIN METRICS (ETH STAKING) =====
  const { data: totalStakedData } = useReadContract({
    abi: STAKING_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "totalStaked",
  });

  const tvlEth = totalStakedData ? Number(formatEther(totalStakedData)) : 0;

  const { data: userStakedData } = useReadContract({
    abi: STAKING_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "userStaked",
    args: [address || ZERO_ADDRESS],
  });

  const userStakedEth = userStakedData ? Number(formatEther(userStakedData)) : 0;

  const { data: totalXPData } = useReadContract({
    abi: STAKING_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "getTotalXP",
    args: [address || ZERO_ADDRESS],
  });

  const userXP = totalXPData ? Number(totalXPData) : 0;

  // 🔄 مزامنة XP مع backend
  useEffect(() => {
    if (!address || !isConnected) return;

    const xpNumber = Number(userXP);
    if (!Number.isFinite(xpNumber) || xpNumber < 0) return;

    syncOnchainXpApi(address, xpNumber).catch((err) => {
      console.error("Failed to sync on-chain XP:", err);
    });
  }, [address, isConnected, userXP]);

  const { data: levelData } = useReadContract({
    abi: STAKING_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "level",
    args: [address || ZERO_ADDRESS],
  });

  const userLevel =
    typeof levelData === "number" ? levelData : Number(levelData || 0);
const levelInfo = getLevelInfo(userLevel, userStakedEth);



// ===== ETH Boost (UI only) =====
const ethNextTarget = useMemo(() => {
  if (userStakedEth >= 3) return null; // already Platinum
  if (userStakedEth >= 1) return 3;    // next is Platinum
  return 1;                            // next is Gold
}, [userStakedEth]);

const ethProgressPct = useMemo(() => {
  const target = ethNextTarget ?? 3;
  if (!target || target <= 0) return 100;
  return Math.max(0, Math.min(100, (userStakedEth / target) * 100));
}, [userStakedEth, ethNextTarget]);






  // ===== Leaderboard (ETH staking) =====
  const { data: stakersData } = useReadContract({
    abi: STAKING_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "getAllStakers",
  });

  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        if (!publicClient) return;

        if (!stakersData || !Array.isArray(stakersData)) {
          setLeaderboard([]);
          return;
        }

        if (stakersData.length === 0) {
          setLeaderboard([]);
          return;
        }

        setLeaderboardLoading(true);
        setLeaderboardError(null);

        const addresses = stakersData;

        const stakePromises = addresses.map((addr) =>
          publicClient.readContract({
            abi: STAKING_ABI,
            address: STAKING_CONTRACT_ADDRESS,
            functionName: "userStaked",
            args: [addr],
          })
        );

        const stakesRaw = await Promise.all(stakePromises);

        const rows = addresses
          .map((addr, idx) => {
            const amountEth = stakesRaw[idx]
              ? Number(formatEther(stakesRaw[idx]))
              : 0;
            return { address: addr, amountEth };
          })
          .filter((row) => row.amountEth > 0);

        rows.sort((a, b) => b.amountEth - a.amountEth);

        setLeaderboard(rows.slice(0, 10));
      } catch (err) {
        console.error(err);
        setLeaderboardError("Failed to load leaderboard.");
      } finally {
        setLeaderboardLoading(false);
      }
    };

    loadLeaderboard();
  }, [publicClient, stakersData]);

  // ===== FEE DISTRIBUTOR (old rewards) =====
  const { data: pendingRewardsData, refetch: refetchPendingRewards } =
    useReadContract({
      abi: FEE_DISTRIBUTOR_ABI,
      address: FEE_DISTRIBUTOR_ADDRESS,
      functionName: "pendingRewards",
      args: [address || ZERO_ADDRESS],
    });

  const pendingRewardsEth = pendingRewardsData
    ? Number(formatEther(pendingRewardsData))
    : 0;
  const hasRewards = pendingRewardsData && pendingRewardsData > 0n;

  // ===== HR STAKING (new) reads =====
  const { data: userHrDepositedRaw } = useReadContract({
    abi: HR_STAKING_ABI,
    address: HR_STAKING_CONTRACT_ADDRESS,
    functionName: "deposited",
    args: [address || ZERO_ADDRESS],
  });

  const userHrDeposited = userHrDepositedRaw
    ? Number(formatUnits(userHrDepositedRaw, HR_DECIMALS))
    : 0;

  const { data: pendingHrRewardsRaw, refetch: refetchPendingHrRewards } =
    useReadContract({
      abi: HR_STAKING_ABI,
      address: HR_STAKING_CONTRACT_ADDRESS,
      functionName: "pendingRewards",
      args: [address || ZERO_ADDRESS],
    });

  const pendingHrRewards = pendingHrRewardsRaw
    ? Number(formatUnits(pendingHrRewardsRaw, HR_DECIMALS))
    : 0;

  // ===== ETH STAKERS -> HR REWARDS reads =====
  const { data: pendingEthHrRaw, refetch: refetchPendingEthHr } = useReadContract({
    abi: ETH_HR_REWARDS_ABI,
    address: ETH_HR_REWARDS_CONTRACT_ADDRESS,
    functionName: "pendingRewards",
    args: [address || ZERO_ADDRESS],
  });

  const pendingEthHr = pendingEthHrRaw
    ? Number(formatUnits(pendingEthHrRaw, HR_DECIMALS))
    : 0;

  // ===== HR allowance for staking =====
  const hrToStakeWei = useMemo(() => {
    try {
      if (!hrAmount) return 0n;
      return parseUnits(hrAmount, HR_DECIMALS);
    } catch {
      return 0n;
    }
  }, [hrAmount, HR_DECIMALS]);

  const { data: allowanceRaw, refetch: refetchAllowance } = useReadContract({
    abi: ERC20_ABI,
    address: HR_TOKEN_ADDRESS,
    functionName: "allowance",
    args: [address || ZERO_ADDRESS, HR_STAKING_CONTRACT_ADDRESS],
  });

  const allowance = allowanceRaw ?? 0n;
  const needsApprove = hrToStakeWei > 0n && allowance < hrToStakeWei;

  // ===== Incentive calc (HR tiers) =====
  const hrTier = useMemo(
    () => getHrMultiplierInfo(userHrDeposited),
    [userHrDeposited]
  );

  const hrProgressToElite = useMemo(() => {
    const eliteTarget = 200_000;
    const pct = (userHrDeposited / eliteTarget) * 100;
    return Math.max(0, Math.min(100, pct));
  }, [userHrDeposited]);

  const hrToNextTier = useMemo(() => {
    if (!hrTier.nextTarget) return 0;
    return Math.max(0, hrTier.nextTarget - userHrDeposited);
  }, [hrTier, userHrDeposited]);

  // ===== HANDLERS =====
  const handleMax = () => {
    const bal = parseFloat(userBalance);
    if (!isNaN(bal) && bal > 0) {
      setAmount(bal.toFixed(4));
    } else {
      showToast?.("info", "No ETH balance available on Base.");
    }
  };

  const handleMaxHr = () => {
    const bal = parseFloat(hrWalletBalance);
    if (!isNaN(bal) && bal > 0) {
      setHrAmount(bal.toString());
    } else {
      showToast?.("info", "No HR balance available on Base.");
    }
  };

  const handleStake = async () => {
    if (!isConnected) {
      showToast?.("error", "Please connect your wallet first.");
      return;
    }

    if (chainId !== BASE_CHAIN_ID) {
      showToast?.("error", "Please switch to Base network.");
      return;
    }

    const ethValue = Number(amount);
    if (!ethValue || ethValue <= 0) {
      showToast?.("error", "Enter a valid ETH amount.");
      return;
    }

    try {
      setIsLoading(true);

      await sendTransactionAsync({
        to: STAKING_CONTRACT_ADDRESS,
        value: parseEther(amount),
      });

      setIsLoading(false);
      setAmount("");

      showToast?.("success", "Transaction sent successfully!");

      try {
        if (address) {
          qualifyReferral(address.toLowerCase(), "stake").catch((err) => {
            console.error("Failed to qualify referral via stake:", err);
          });
        }
      } catch (e) {
        console.error("Local qualifyReferral(stake) error:", e);
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      showToast?.("error", error.shortMessage || error.message);
    }
  };

  const formatXP = (value) => {
    const num = Number(value || 0);
    if (!isFinite(num)) return "0";

    return num.toLocaleString("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 4,
    });
  };

  // Claim old fee rewards
  const handleClaimRewards = async () => {
    if (!address) {
      showToast?.("error", "Connect your wallet first.");
      return;
    }

    if (chainId !== BASE_CHAIN_ID) {
      showToast?.("error", "Please switch to Base network to claim.");
      return;
    }

    if (!hasRewards) {
      setShowNoRewardsBubble(true);
      setTimeout(() => setShowNoRewardsBubble(false), 4000);
      return;
    }

    try {
      setIsClaiming(true);

      await writeContractAsync({
        abi: FEE_DISTRIBUTOR_ABI,
        address: FEE_DISTRIBUTOR_ADDRESS,
        functionName: "claim",
        chainId: BASE_CHAIN_ID,
      });

      showToast?.("success", "Rewards claimed successfully!");
      refetchPendingRewards?.();
    } catch (e) {
      console.error("Claim rewards failed:", e);
      showToast?.("error", "Claim transaction failed or was rejected.");
    } finally {
      setIsClaiming(false);
    }
  };

  // Approve HR for HR staking contract
  const handleApproveHr = async () => {
    if (!address) return showToast?.("error", "Connect your wallet first.");
    if (chainId !== BASE_CHAIN_ID)
      return showToast?.("error", "Please switch to Base network.");
    if (!hrToStakeWei || hrToStakeWei <= 0n)
      return showToast?.("error", "Enter a valid HR amount.");

    try {
      setIsApprovingHr(true);
      await writeContractAsync({
        abi: ERC20_ABI,
        address: HR_TOKEN_ADDRESS,
        functionName: "approve",
        args: [HR_STAKING_CONTRACT_ADDRESS, hrToStakeWei],
        chainId: BASE_CHAIN_ID,
      });
      showToast?.("success", "Approve done!");
      refetchAllowance?.();
    } catch (e) {
      console.error(e);
      showToast?.("error", "Approve failed or was rejected.");
    } finally {
      setIsApprovingHr(false);
    }
  };

  // Stake HR into HR staking contract
  const handleStakeHr = async () => {
    if (!address) return showToast?.("error", "Connect your wallet first.");
    if (chainId !== BASE_CHAIN_ID)
      return showToast?.("error", "Please switch to Base network.");
    if (!hrToStakeWei || hrToStakeWei <= 0n)
      return showToast?.("error", "Enter a valid HR amount.");
    if (needsApprove) return showToast?.("info", "Please approve HR first.");

    try {
      setIsHrStaking(true);
      await writeContractAsync({
        abi: HR_STAKING_ABI,
        address: HR_STAKING_CONTRACT_ADDRESS,
        functionName: "stake",
        args: [hrToStakeWei],
        chainId: BASE_CHAIN_ID,
      });

      setHrAmount("");
      showToast?.("success", "HR staked successfully!");
      refetchPendingHrRewards?.();
      refetchAllowance?.();
    } catch (e) {
      console.error(e);
      showToast?.("error", e.shortMessage || e.message || "HR stake failed.");
    } finally {
      setIsHrStaking(false);
    }
  };

  // Claim HR rewards from HR staking
  const handleClaimHrRewards = async () => {
    if (!address) return showToast?.("error", "Connect your wallet first.");
    if (chainId !== BASE_CHAIN_ID)
      return showToast?.("error", "Please switch to Base network.");

    if (!pendingHrRewardsRaw || pendingHrRewardsRaw === 0n) {
      showToast?.("info", "No HR rewards yet.");
      return;
    }

    try {
      setIsHrClaiming(true);
      await writeContractAsync({
        abi: HR_STAKING_ABI,
        address: HR_STAKING_CONTRACT_ADDRESS,
        functionName: "claim",
        chainId: BASE_CHAIN_ID,
      });

      showToast?.("success", "HR rewards claimed!");
      refetchPendingHrRewards?.();
    } catch (e) {
      console.error(e);
      showToast?.("error", "Claim failed (maybe cooldown).");
    } finally {
      setIsHrClaiming(false);
    }
  };

  // Claim HR rewards for ETH stakers (new contract)
  const handleClaimEthHrRewards = async () => {
    if (!address) return showToast?.("error", "Connect your wallet first.");
    if (chainId !== BASE_CHAIN_ID)
      return showToast?.("error", "Please switch to Base network.");

    // إذا ما عنده أي ETH staked أصلاً
    if (!userStakedData || userStakedData === 0n) {
      showToast?.("info", "You have no ETH staked yet.");
      return;
    }

    try {
      setIsEthHrClaiming(true);

      // دائمًا Sync أولاً (تفعيل/تحديث)
      await writeContractAsync({
        abi: ETH_HR_REWARDS_ABI,
        address: ETH_HR_REWARDS_CONTRACT_ADDRESS,
        functionName: "sync",
        chainId: BASE_CHAIN_ID,
      });

      // إذا ما في pending بعد (أول مرة غالبًا) -> نخليه تفعيل فقط
      if (!pendingEthHrRaw || pendingEthHrRaw === 0n) {
        showToast?.("success", "HR rewards activated ✅ Come back later to claim.");
        refetchPendingEthHr?.();
        return;
      }

      // إذا في pending -> claim
      await writeContractAsync({
        abi: ETH_HR_REWARDS_ABI,
        address: ETH_HR_REWARDS_CONTRACT_ADDRESS,
        functionName: "claim",
        chainId: BASE_CHAIN_ID,
      });

      showToast?.("success", "ETH-staker HR rewards claimed!");
      refetchPendingEthHr?.();
    } catch (e) {
      console.error(e);
      showToast?.("error", "Claim failed (maybe cooldown / rejected).");
    } finally {
      setIsEthHrClaiming(false);
    }
  };

  return (
    <div className="staking-page">
      {/* tiny local styles for the animated motivation banner (UI only) */}
      <style>{`
        @keyframes hrShimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes hrPulseDot {
          0%, 100% { transform: scale(1); opacity: .8; }
          50% { transform: scale(1.25); opacity: 1; }
        }
      `}</style>

      <div className="staking-grid">
        {/* ===== Hero Card ===== */}
        <div className="card staking-card staking-hero">
          <div className="staking-hero-header">
            <div className="hero-title-wrap">
              <h1 className="hero-title">
                <span className="hero-title-highlight">HeatRush Staking</span>
              </h1>
              <p className="hero-subtitle">
                Stake ETH or HR on <span className="orange">Base</span>{" "}
                and earn daily HR rewards.
              </p>
            </div>
          </div>

          <div className="hero-tags-row">
            <span className="hero-pill accent">Live on Base</span>
            <span className="hero-pill subtle">ETH staking</span>
            <span className="hero-pill subtle">HR staking (daily)</span>
          </div>

          <p className="hero-note">
            ETH staking strengthens the treasury. HR staking rewards long-term believers.
          </p>
          <p className="hero-note">
            <strong>Bigger stake = bigger daily rewards.</strong>
          </p>
        </div>

        {/* ===== Wallet / On-chain Status Card ===== */}
        <div className="card staking-card staking-status">
          <h2 className="card-title">Your Staking Snapshot</h2>

          <div className="status-row">
            <span className="status-label">You Staked (ETH)</span>
            <span className="status-chip">
              {formatEth(userStakedEth)} <span className="status-unit">ETH</span>
            </span>
          </div>

          <div className="status-row">
            <span className="status-label">You Staked (HR)</span>
            <span className="status-chip">
              {formatNum(userHrDeposited, 2)} <span className="status-unit">HR</span>
            </span>
          </div>

          <div className="status-row">
            <span className="status-label">Your HR Multiplier</span>
            <span className="status-chip">
              {hrTier.mult.toFixed(2)}x{" "}
              <span className="status-unit">{hrTier.label}</span>
            </span>
          </div>

          <div className="status-row">
            <span className="status-label">Your Total XP</span>
            <span className="status-chip">{formatXP(userXP)}</span>
          </div>

          <div className="status-row">
            <span className="status-label">Your ETH Tier</span>
            <span className="status-value">
              <span className="status-chip">{levelInfo.label}</span>
            </span>
          </div>


          <div className="status-row">
            <span className="status-label">HR Wallet Balance</span>
            <span className="status-chip">
              {hrWalletBalance} <span className="status-unit">HR</span>
            </span>
          </div>

          <p className="status-note">
            HR staking rewards are claimable daily. Principal unlock will come later.
          </p>
        </div>

        {/* ===== Stake ETH Action Card ===== */}
        <div className="card staking-card staking-action">
<h2
  className="card-title"
  style={{ display: "flex", alignItems: "center", gap: 10 }}
>
  <img
    src="/eth.svg"
    alt="ETH"
    width={33}
    height={33}
    style={{ display: "block" }}
  />
  Stake ETH
</h2>
          <p className="card-subtitle">
            Staking is executed directly through HeatRush’s secure on-chain contract.
          </p>






{/* ===== ETH quick stats (UI only) ===== */}
<div style={{ marginTop: 12 }}>
  <div className="status-row">
    <span className="status-label">Your ETH Staked</span>
    <span className="status-value">
      <span className="status-chip">
        {formatEth(userStakedEth)} <span className="status-unit">ETH</span>
      </span>
    </span>
  </div>

  <div className="status-row">
    <span className="status-label">Pending Fees</span>
    <span className="status-value">
      <span className="status-chip">
        {pendingRewardsEth.toFixed(4)} <span className="status-unit">ETH</span>
      </span>
    </span>
  </div>

  <div className="status-row">
    <span className="status-label">Pending HR (from ETH stake)</span>
    <span className="status-value">
      <span className="status-chip">
        {formatNum(pendingEthHr, 4)} <span className="status-unit">HR</span>
      </span>
    </span>
  </div>
</div>






{/* ===== ETH Boost Box (UI only) ===== */}
<div className="xp-formula-box" style={{ marginTop: 12 }}>
  <div className="xp-formula-label">Boost your daily rewards</div>

  <div className="xp-formula-code">
    Current tier: <strong>{levelInfo.label}</strong>
  </div>

  <p className="xp-formula-note">{levelInfo.desc}</p>

  {ethNextTarget ? (
    <>
      <p className="xp-formula-note" style={{ marginTop: 6 }}>
        Next milestone at <strong>{ethNextTarget.toFixed(2)} ETH</strong>. You’re{" "}
        <strong>{formatEth(Math.max(0, ethNextTarget - userStakedEth))} ETH</strong> away.
      </p>

      <div style={{ marginTop: 10 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            opacity: 0.85,
          }}
        >
          <span>
            Progress to {ethNextTarget === 1 ? "Gold (1.00 ETH)" : "Platinum (3.00 ETH)"}
          </span>
          <span>{formatNum(ethProgressPct, 1)}%</span>
        </div>

        <div
          style={{
            height: 10,
            borderRadius: 999,
            background: "rgba(255,255,255,0.08)",
            overflow: "hidden",
            marginTop: 6,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${ethProgressPct}%`,
              background: "rgba(255, 140, 0, 0.9)",
            }}
          />
        </div>
      </div>
    </>
  ) : (
    <p className="xp-formula-note" style={{ marginTop: 6 }}>
      You’re at <strong>Platinum (3.00 ETH)</strong>. Maximum tier unlocked.
    </p>
  )}
</div>





          <div className="stake-input-block">
            <div className="stake-input-header">
              <span className="stake-label">Amount to stake</span>
              <span className="stake-hint">
                Enter the amount of ETH you want to lock into HeatRush.
              </span>
            </div>

            <div className="input-row">
              <input
                type="text"
                inputMode="decimal"
                className="input"
                placeholder="Enter ETH amount"
                value={amount}
                onChange={(e) => {
                  const raw = e.target.value.replace(",", ".");
                  const regex = /^[0-9]*\.?[0-9]*$/;
                  if (raw === "" || regex.test(raw)) {
                    setAmount(raw);
                  }
                }}
              />
              <button className="max-btn" onClick={handleMax}>
                MAX
              </button>
            </div>
          </div>

          <button
            className={`stake-btn ${isLoading ? "loading" : ""}`}
            onClick={handleStake}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Stake ETH"}
          </button>

          <div className="secondary-actions">
            <button
              ref={claimButtonRef}
              className={`secondary-btn claim-btn ${
                hasRewards ? "claim-btn-glow" : ""
              }`}
              onClick={handleClaimRewards}
              disabled={isClaiming || !address || chainId !== BASE_CHAIN_ID}
            >
              {isClaiming
                ? "Claiming..."
                : `Claim Fees (${pendingRewardsEth.toFixed(4)} ETH)`}
            </button>

            {/* ✅ HR claim for ETH stakers moved right under Claim Fees (UI only) */}
            <button
              className={`secondary-btn claim-btn ${
                pendingEthHrRaw > 0n ? "claim-btn-glow" : ""
              }`}
              onClick={handleClaimEthHrRewards}
              disabled={isEthHrClaiming || !address || chainId !== BASE_CHAIN_ID}
            >
              {isEthHrClaiming
                ? "Claiming..."
                : `Claim HR (${formatNum(pendingEthHr, 4)} HR)`}
            </button>

            <button
              className="secondary-btn"
              onClick={() =>
                showToast?.("info", "Unstaking will be introduced in a later stage.")
              }
            >
              Unstake (coming later)
            </button>
          </div>

          {showNoRewardsBubble && (
            <div className="no-rewards-bubble">
              <div className="no-rewards-bubble-arrow" />
              <div className="no-rewards-bubble-title">No rewards yet</div>
              <div className="no-rewards-bubble-text">
                Stake ETH to start earning your share of swap &amp; bridge fees.
              </div>
            </div>
          )}

          <p className="stake-footnote">
            ETH staking is live. HR rewards for ETH stakers can be claimed right above.
          </p>
        </div>

        {/* ===== NEW: Stake HR + Claim HR rewards ===== */}
        <div className="card staking-card staking-action">
<h2
  className="card-title"
  style={{ display: "flex", alignItems: "center", gap: 10 }}
>
  <img
    src={TokensImg}
    alt="Tokens"
    width={36}
    height={43}
    style={{ display: "block", borderRadius: 6 }}
  />
  Stake HR
</h2>
          <p className="card-subtitle">
            Stake HR directly in the HR staking contract. Principal is locked for now. Claim rewards daily.
          </p>

          <div className="status-row">
            <span className="status-label">Your HR Staked</span>
            <span className="status-chip">
              {formatNum(userHrDeposited, 2)} <span className="status-unit">HR</span>
            </span>
          </div>

          <div className="status-row">
            <span className="status-label">Pending HR Rewards</span>
            <span className="status-chip">
              {formatNum(pendingHrRewards, 2)} <span className="status-unit">HR</span>
            </span>
          </div>

          {/* Incentive: progress to 200k */}
          <div className="xp-formula-box" style={{ marginTop: 12 }}>
            <div className="xp-formula-label">Boost your daily rewards</div>
            <div className="xp-formula-code">
              Current multiplier: <strong>{hrTier.mult.toFixed(2)}x</strong> (
              {hrTier.label})
            </div>

            {hrTier.nextTarget ? (
              <p className="xp-formula-note">
                Next tier at <strong>{hrTier.nextTarget.toLocaleString()} HR</strong>.
                You’re <strong>{formatNum(hrToNextTier, 0)} HR</strong> away.
              </p>
            ) : (
              <p className="xp-formula-note">
                You’re at <strong>Elite (2.00x)</strong>. Daily rewards are maximized.
              </p>
            )}

            <div style={{ marginTop: 10 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  opacity: 0.85,
                }}
              >
                <span>Progress to 200,000 HR</span>
                <span>{formatNum(hrProgressToElite, 1)}%</span>
              </div>
              <div
                style={{
                  height: 10,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                  marginTop: 6,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${hrProgressToElite}%`,
                    background: "rgba(255, 140, 0, 0.9)",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="stake-input-block">
            <div className="stake-input-header">
              <span className="stake-label">Amount to stake</span>
              <span className="stake-hint">Approve once, then stake HR.</span>
            </div>

            <div className="input-row">
              <input
                type="text"
                inputMode="decimal"
                className="input"
                placeholder="Enter HR amount"
                value={hrAmount}
                onChange={(e) => {
                  const raw = e.target.value.replace(",", ".");
                  const regex = /^[0-9]*\.?[0-9]*$/;
                  if (raw === "" || regex.test(raw)) setHrAmount(raw);
                }}
              />
              <button className="max-btn" onClick={handleMaxHr}>
                MAX
              </button>
            </div>
          </div>

          {needsApprove ? (
            <button
              className={`stake-btn ${isApprovingHr ? "loading" : ""}`}
              onClick={handleApproveHr}
              disabled={isApprovingHr}
            >
              {isApprovingHr ? "Approving..." : "Approve HR"}
            </button>
          ) : (
            <button
              className={`stake-btn ${isHrStaking ? "loading" : ""}`}
              onClick={handleStakeHr}
              disabled={isHrStaking}
            >
              {isHrStaking ? "Processing..." : "Stake HR"}
            </button>
          )}

          <div className="secondary-actions">
            <button
              className={`secondary-btn claim-btn ${
                pendingHrRewardsRaw > 0n ? "claim-btn-glow" : ""
              }`}
              onClick={handleClaimHrRewards}
              disabled={isHrClaiming || !address || chainId !== BASE_CHAIN_ID}
            >
              {isHrClaiming ? "Claiming..." : "Claim HR Rewards"}
            </button>
          </div>

          <p className="stake-footnote">
            Rewards are distributed daily. Unstaking will be enabled in a later phase.
          </p>
        </div>

        {/* ===== XP & Levels Card ===== */}
        <div className="card staking-card staking-xp-info">
          <h2 className="card-title">Your XP & Levels</h2>

          <p className="xp-intro">
            XP boosts your weight for airdrops, future campaigns, and on-chain reputation.
          </p>

          <div className="xp-formula-box">
            <div className="xp-formula-label">On-chain XP</div>
            <div className="xp-formula-code">Total XP: {formatXP(userXP)}</div>
            <p className="xp-formula-note">
              XP is tracked directly by the HeatRush ETH staking contract.
            </p>
          </div>

          <div className="xp-levels-grid">
            <div
              className="xp-level-card bronze tier-3d"
              onMouseMove={handleTierTiltMove}
              onMouseLeave={handleTierTiltLeave}
            >
              <div className="xp-level-title">Bronze</div>
              <div className="xp-level-threshold">Stake ≥ 0.10 ETH</div>
              <p className="xp-level-desc">Stake ≥ 0.10 ETH to reach Bronze.</p>
            </div>

            <div
              className="xp-level-card silver tier-3d"
              onMouseMove={handleTierTiltMove}
              onMouseLeave={handleTierTiltLeave}
            >
              <div className="xp-level-title">Silver</div>
              <div className="xp-level-threshold">Stake ≥ 0.50 ETH</div>
              <p className="xp-level-desc">Stake ≥ 0.50 ETH to reach Silver.</p>
            </div>

            <div
              className="xp-level-card gold tier-3d"
              onMouseMove={handleTierTiltMove}
              onMouseLeave={handleTierTiltLeave}
            >
              <div className="xp-level-title">Gold</div>
              <div className="xp-level-threshold">Stake ≥ 1.00 ETH</div>
              <p className="xp-level-desc">Stake ≥ 1.00 ETH to reach Gold.</p>
            </div>

<div
  className="xp-level-card platinum tier-3d"
  onMouseMove={handleTierTiltMove}
  onMouseLeave={handleTierTiltLeave}
>
  <div className="xp-level-title">Platinum</div>
  <div className="xp-level-threshold">Stake ≥ 3.00 ETH</div>
  <p className="xp-level-desc">
    Stake ≥ 3.00 ETH to reach Platinum.
  </p>
</div>


          </div>
        </div>

        {/* ===== Why Stake Card ===== */}
        <div className="card staking-card staking-why">
          <h2 className="card-title">Why stake with HeatRush?</h2>

          <ul className="why-list">
            <li>
              <span className="dot" />
              <span>Daily HR rewards for HR stakers.</span>
            </li>
            <li>
              <span className="dot" />
              <span>HR rewards for ETH stakers (claimable daily).</span>
            </li>
            <li>
              <span className="dot" />
              <span>Progress-based multipliers encourage bigger HR stakes.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* ===== Top Stakers Leaderboard ===== */}
      <div className="card staking-card staking-leaderboard">
        <h2 className="card-title">Top ETH Stakers</h2>
        <p className="card-subtitle">
          Addresses with the highest total ETH staked into HeatRush.
        </p>

        {leaderboardLoading && (
          <p className="staking-leaderboard-note">Loading leaderboard...</p>
        )}

        {leaderboardError && !leaderboardLoading && (
          <p className="staking-leaderboard-error">{leaderboardError}</p>
        )}

        {!leaderboardLoading && !leaderboardError && leaderboard.length === 0 && (
          <p className="staking-leaderboard-note">
            No staking activity yet. Be the first to appear on the leaderboard.
          </p>
        )}

        {!leaderboardLoading && !leaderboardError && leaderboard.length > 0 && (
          <ul className="staking-leaderboard-list">
            {leaderboard.map((row, index) => {
              const isYou =
                address &&
                row.address &&
                row.address.toLowerCase() === address.toLowerCase();




                
              return (
                <li
                  key={row.address}
                  className={`staking-leaderboard-row ${
                    isYou ? "staking-leaderboard-row-you" : ""
                  }`}
                >
                  <span className="staking-leader-rank">{index + 1}</span>

                  <span className="staking-leader-address">
                    <span className="staking-leader-wallet">
                      {formatShortAddress(row.address)}
                    </span>
                    {isYou && (
                      <span className="staking-leader-you-pill">YOU</span>
                    )}
                  </span>

                  <span className="staking-leader-amount">
                    {formatEth(row.amountEth)}{" "}
                    <span className="status-unit">ETH</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StakingPage;
