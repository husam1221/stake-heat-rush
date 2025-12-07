// src/pages/tasks/TasksPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatEther, formatUnits } from "viem";

import DailyTankCard from "../../components/tasks/DailyTankCard.jsx";
import { TASKS } from "../../lib/tasks.js";
import {
  BASE_CHAIN_ID,
  STAKING_CONTRACT_ADDRESS,
} from "../../lib/constants.js";
import { PRESALE_ABI, PRESALE_ADDRESS } from "../../lib/presale.js";
import { completeTaskApi, fetchXpOverview } from "../../lib/xpApi.js";

import "../../styles/tasks.css";
import {
  Flame,
  Target,
  Coins,
  Twitter,
  Send,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// ABI مصغّر لعقد الستيك – قراءة فقط
const STAKING_ABI = [
  {
    type: "function",
    name: "userStaked",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "getTotalXP",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
];

const getTaskIcon = (task) => {
  if (task.type === "onchain") {
    if (task.id && task.id.startsWith("stake_")) return <Flame size={16} />;
    if (task.id && task.id.startsWith("join_presale")) return <Coins size={16} />;
    return <Target size={16} />;
  }

  if (task.type === "social") {
    if (task.id && task.id.includes("telegram")) return <Send size={16} />;
    return <Twitter size={16} />;
  }

  if (task.type === "system") {
    return <LayoutDashboard size={16} />;
  }

  return <Sparkles size={16} />;
};

const TasksPage = ({ showToast }) => {
  const { address, isConnected } = useAccount();

  // ====== ON-CHAIN DATA للريكواريمنت ======

  // Staked ETH
  const { data: stakedWei } = useReadContract({
    abi: STAKING_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "userStaked",
    args: [address || ZERO_ADDRESS],
    chainId: BASE_CHAIN_ID,
  });

  const stakedEth = stakedWei ? Number(formatEther(stakedWei)) : 0;

  // On-chain XP (من عقد الستيك)
  const { data: onchainXpData } = useReadContract({
    abi: STAKING_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "getTotalXP",
    args: [address || ZERO_ADDRESS],
    chainId: BASE_CHAIN_ID,
  });

  const onchainXp = onchainXpData ? Number(onchainXpData) : 0;

  // Presale total HR
  const { data: presaleHrData } = useReadContract({
    abi: PRESALE_ABI,
    address: PRESALE_ADDRESS,
    functionName: "totalHrFor",
    args: [address || ZERO_ADDRESS],
    chainId: BASE_CHAIN_ID,
  });

  const totalPresaleHr = presaleHrData
    ? Number(formatUnits(presaleHrData, 18))
    : 0;

  // ====== LOCAL STORAGE (المهام المنجزة) ======

  const [completed, setCompleted] = useState(new Set());
  const [savingTaskId, setSavingTaskId] = useState(null); // أي تاسك قيد الحفظ الآن

  // 👇 XP تبع البروفايل من /xp/profile (off-chain)
  const [profileXp, setProfileXp] = useState(0);

  const storageKey = useMemo(() => {
    if (!address) return null;
    return `hr_tasks_${address.toLowerCase()}`;
  }, [address]);

  // ✅ Global profile XP = on-chain XP + off-chain profile XP
  const profileGlobalXp = profileXp + onchainXp;

  // تحميل حالة المهام من localStorage فقط
  useEffect(() => {
    if (!storageKey) {
      setCompleted(new Set());
      return;
    }

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setCompleted(new Set());
        return;
      }
      const parsed = JSON.parse(raw);
      const ids = Array.isArray(parsed.completed) ? parsed.completed : [];
      setCompleted(new Set(ids));
    } catch (e) {
      console.error("Failed to load tasks from storage", e);
      setCompleted(new Set());
    }
  }, [storageKey]);

  // حفظ بالحفظ المحلي
  const persist = (nextSet) => {
    if (!storageKey) return;
    const payload = {
      completed: Array.from(nextSet),
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (e) {
      console.error("Failed to save tasks", e);
    }
  };

  // ====== LOCAL STORAGE (هل ضغط الزر وفتح الرابط قبل؟) ======
  const [visited, setVisited] = useState(new Set());

  const visitedKey = useMemo(() => {
    if (!address) return null;
    return `hr_tasks_visited_${address.toLowerCase()}`;
  }, [address]);

  useEffect(() => {
    if (!visitedKey) {
      setVisited(new Set());
      return;
    }
    try {
      const raw = localStorage.getItem(visitedKey);
      if (!raw) {
        setVisited(new Set());
        return;
      }
      const parsed = JSON.parse(raw);
      const ids = Array.isArray(parsed.visited) ? parsed.visited : [];
      setVisited(new Set(ids));
    } catch (e) {
      console.error("Failed to load visited tasks", e);
      setVisited(new Set());
    }
  }, [visitedKey]);

  const persistVisited = (nextSet) => {
    if (!visitedKey) return;
    const payload = {
      visited: Array.from(nextSet),
    };
    try {
      localStorage.setItem(visitedKey, JSON.stringify(payload));
    } catch (e) {
      console.error("Failed to save visited tasks", e);
    }
  };

  // 🔄 مزامنة حالة المهام مع الباكند (xp/profile → completedTasks + profileXp)
  useEffect(() => {
    if (!address) return;

    let cancelled = false;

    const syncFromServer = async () => {
      try {
        const data = await fetchXpOverview(address.toLowerCase());
        const serverCompleted = data?.completedTasks || [];
        const xpOffchain = data?.totals?.xp_offchain ?? 0; // 👈 XP من البروفايل (off-chain)

        if (cancelled) return;

        // نخزن XP البروفايل في state
        setProfileXp(xpOffchain);

        // ندمج اللي من السيرفر مع اللي في localStorage
        setCompleted((prev) => {
          const next = new Set(prev);
          for (const id of serverCompleted) {
            next.add(id);
          }

          // نحدّث localStorage كمان عشان المرة الجاية يفتح أسرع
          if (storageKey) {
            try {
              localStorage.setItem(
                storageKey,
                JSON.stringify({ completed: Array.from(next) })
              );
            } catch (e) {
              console.error("Failed to save merged tasks", e);
            }
          }

          return next;
        });
      } catch (e) {
        console.error("Failed to sync tasks from XP backend", e);
      }
    };

    syncFromServer();

    return () => {
      cancelled = true;
    };
  }, [address, storageKey]);

  // حساب مجموع الـ Points و XP من المهام المنجزة (محلياً فقط)
  const { totalPoints, totalXP } = useMemo(() => {
    let points = 0;
    let xp = 0;
    for (const task of TASKS) {
      if (completed.has(task.id)) {
        points += task.points || 0;
        xp += task.xp || 0;
      }
    }
    return { totalPoints: points, totalXP: xp };
  }, [completed]);

  const completedCount = completed.size;
  const totalTasks = TASKS.length;

  // ====== حساب حالة المهمة (مقفلة / جاهزة / مكتملة) ======

  const getTaskState = (task) => {
    const isCompleted = completed.has(task.id);

    // لو مش متصل محفظة → من ناحية التحقق يعتبر Locked
    if (!isConnected || !address) {
      return {
        isLocked: true,
        isCompleted,
        canComplete: false,
        reason: "Connect your wallet to track this quest for your address.",
      };
    }

    // لو مكتملة خلاص
    if (isCompleted) {
      return {
        isLocked: false,
        isCompleted: true,
        canComplete: false,
        reason: null,
      };
    }

    const req = task.requirement || { kind: "none" };

    // نوع المهمة: ON-CHAIN
    if (task.type === "onchain") {
      if (req.kind === "min_stake") {
        const needed = req.valueEth || 0;
        if (stakedEth < needed) {
          return {
            isLocked: true,
            isCompleted: false,
            canComplete: false,
            reason: `You need at least ${needed} ETH staked ( you have ${stakedEth.toFixed(
              4
            )} ETH ).`,
          };
        }
        return {
          isLocked: false,
          isCompleted: false,
          canComplete: true,
          reason: null,
        };
      }

      if (req.kind === "presale_min_hr") {
        const minHr = req.minHr || 0;
        if (totalPresaleHr < minHr) {
          return {
            isLocked: true,
            isCompleted: false,
            canComplete: false,
            reason: `You need to buy at least ${minHr} HR from the presale ( you have ${totalPresaleHr.toFixed(
              2
            )} HR ).`,
          };
        }
        return {
          isLocked: false,
          isCompleted: false,
          canComplete: true,
          reason: null,
        };
      }

      if (req.kind === "min_onchain_xp") {
        const minXp = req.minXp || 0;
        if (onchainXp < minXp) {
          return {
            isLocked: true,
            isCompleted: false,
            canComplete: false,
            reason: `You need at least ${minXp} XP on-chain ( you have ${onchainXp} XP ).`,
          };
        }
        return {
          isLocked: false,
          isCompleted: false,
          canComplete: true,
          reason: null,
        };
      }

      // 👇 الآن min_profile_xp تستخدم Global XP (on-chain + off-chain)
      if (req.kind === "min_profile_xp") {
        const minXp = req.minXp || 0;
        if (profileGlobalXp < minXp) {
          return {
            isLocked: true,
            isCompleted: false,
            canComplete: false,
            reason: `You need at least ${minXp} global profile XP ( you have ${profileGlobalXp} XP from staking + tasks ).`,
          };
        }
        return {
          isLocked: false,
          isCompleted: false,
          canComplete: true,
          reason: null,
        };
      }
    }

    // نوع المهمة: SOCIAL أو SYSTEM بدون شرط خاص
    if (req.kind === "none") {
      return {
        isLocked: false,
        isCompleted: false,
        canComplete: true,
        reason: null,
      };
    }

    // افتراضياً
    return {
      isLocked: false,
      isCompleted,
      canComplete: !isCompleted,
      reason: null,
    };
  };

  // ====== التعامل مع "التكميل" الفعلي (إرسال للباكند) ======
  const handleCompleteTask = async (task) => {
    const state = getTaskState(task);

    if (!isConnected || !address) {
      showToast?.("error", "Connect your wallet to track quest progress.");
      return;
    }

    if (state.isCompleted) {
      showToast?.("info", "This quest is already completed.");
      return;
    }

    if (state.isLocked) {
      if (state.reason) {
        showToast?.("error", state.reason);
      } else {
        showToast?.("error", "You don't meet the requirements yet.");
      }
      return;
    }

    // لو قيد الحفظ بالفعل، ما نعيد
    if (savingTaskId === task.id) return;

    try {
      setSavingTaskId(task.id);

      // إرسال للـ Worker عشان يضيف النقاط والـ XP في قاعدة البيانات
      await completeTaskApi(
        address,
        task.id,
        task.points || 0,
        task.xp || 0
      );

      // لو نجحت العملية على الـ backend → نحدث الواجهة + localStorage
      const next = new Set(completed);
      next.add(task.id);
      setCompleted(next);
      persist(next);

      const parts = [];
      if (task.points) parts.push(`${task.points} points`);
      if (task.xp) parts.push(`${task.xp} XP`);

      const rewardText = parts.length
        ? `You earned ${parts.join(" + ")}.`
        : "Progress updated.";

      showToast?.("success", `Quest marked as completed! ${rewardText}`);
    } catch (err) {
      console.error("completeTaskApi error:", err);
      showToast?.(
        "error",
        err?.message || "Failed to sync this quest with the XP backend."
      );
    } finally {
      setSavingTaskId(null);
    }
  };

  // ====== زر واحد: أول ضغطة → يفتح الرابط، بعدين → Verify & Complete ======
  const handleTaskButtonClick = (task) => {
    const state = getTaskState(task);
    const hasVisited = visited.has(task.id);

    // لو مكتمل → لا فتح رابط ولا تحقق
    if (state.isCompleted) {
      showToast?.("info", "This quest is already completed.");
      return;
    }

    // أول ضغطة: لو ما سبق زاره وفي link → نفتح الصفحة فقط
    if (!hasVisited && task.link) {
      const next = new Set(visited);
      next.add(task.id);
      setVisited(next);
      persistVisited(next);

      if (task.link.startsWith("http")) {
        window.open(task.link, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = task.link;
      }
      return;
    }

    // من الآن فصاعدًا (بعد ما صار visited):
    // لازم يكون متصل عشان نتحقق ونعطي مكافأة
    if (!isConnected || !address) {
      showToast?.("error", "Connect your wallet to verify this quest.");
      return;
    }

    // لو لسا ما استوفى الشروط → ما نوديه على الصفحة مرة ثانية، بس نفسر له السبب
    if (state.isLocked) {
      if (state.reason) {
        showToast?.("error", state.reason);
      } else {
        showToast?.("error", "You don't meet the requirements yet.");
      }
      return;
    }

    // جاهز → نكمّل فعلياً
    handleCompleteTask(task);
  };

  const shortAddress =
    isConnected && address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : "Not connected";

  // تقسيم المهام حسب النوع للعرض المنظم
  const onchainTasks = TASKS.filter((t) => t.type === "onchain");
  const socialTasks = TASKS.filter((t) => t.type === "social");
  const systemTasks = TASKS.filter((t) => t.type === "system");

  return (
    <div className="tasks-page">
      {/* ====== HEADER + SUMMARY ====== */}
      <div className="tasks-header">
        <div>
          <h1 className="tasks-title">Tasks & Quests</h1>
          <p className="tasks-subtitle">
            Lightweight off-chain quests that reward{" "}
            <span className="orange">Points</span> for simple actions and{" "}
            <span className="orange">XP</span> for deeper commitment.
          </p>
        </div>

        <div className="tasks-summary-card">
          <div className="tasks-summary-row">
            <span className="tasks-summary-label">Wallet</span>
            <span className="tasks-summary-value">{shortAddress}</span>
          </div>

          <div className="tasks-summary-row">
            <span className="tasks-summary-label">Quests completed</span>
            <span className="tasks-summary-value">
              {completedCount} / {totalTasks}
            </span>
          </div>

          <div className="tasks-summary-row">
            <span className="tasks-summary-label">Task Points (local)</span>
            <span className="tasks-summary-value">
              {totalPoints.toLocaleString("en-US")} pts
            </span>
          </div>

          <div className="tasks-summary-row">
            <span className="tasks-summary-label">Task XP (local)</span>
            <span className="tasks-summary-value">
              {totalXP.toLocaleString("en-US")}{" "}
              <span className="unit">XP</span>
            </span>
          </div>

          <div className="tasks-progress-bar">
            <div
              className="tasks-progress-fill"
              style={{
                width:
                  totalTasks === 0
                    ? "0%"
                    : `${Math.min(
                        100,
                        Math.round((completedCount / totalTasks) * 100)
                      )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ====== DAILY FUEL TANK ====== */}
      <DailyTankCard
        showToast={showToast}
        onClaim={(earnedToday, newTotalFromTank, gainedXpToday) => {
          showToast?.(
            "success",
            `Daily tank claimed: +${earnedToday} points, +${gainedXpToday} XP`
          );
        }}
      />

      {/* ====== ON-CHAIN QUESTS ====== */}
      {onchainTasks.length > 0 && (
        <>
          <h2 className="tasks-section-title">On-chain Missions</h2>
          <p className="tasks-section-subtitle">
            These quests verify real on-chain actions like staking and presale.
          </p>

          <div className="tasks-grid">
            {onchainTasks.map((task) => {
              const state = getTaskState(task);
              const hasVisited = visited.has(task.id);

              let rewardLabel = "";
              if (task.points && task.xp) {
                rewardLabel = `+${task.points.toLocaleString(
                  "en-US"
                )} pts • +${task.xp.toLocaleString("en-US")} XP`;
              } else if (task.points) {
                rewardLabel = `+${task.points.toLocaleString("en-US")} pts`;
              } else if (task.xp) {
                rewardLabel = `+${task.xp.toLocaleString("en-US")} XP`;
              } else {
                rewardLabel = "No reward set";
              }

              let requirementText = "";
              if (task.requirement?.kind === "min_stake") {
                requirementText = `Requires ≥ ${task.requirement.valueEth} ETH staked`;
              } else if (task.requirement?.kind === "presale_min_hr") {
                requirementText = `Requires presale allocation ≥ ${task.requirement.minHr} HR`;
              } else if (task.requirement?.kind === "min_onchain_xp") {
                requirementText = `Requires ≥ ${task.requirement.minXp} on-chain XP`;
              } else if (task.requirement?.kind === "min_profile_xp") {
                // 👇 توضيح إنها Global profile XP
                requirementText = `Requires ≥ ${task.requirement.minXp} global profile XP (on-chain + off-chain)`;
              }

              // نص الزر حسب الحالة + visited
              let buttonLabel = "Go to page";
              if (state.isCompleted) {
                buttonLabel = "Completed ✔";
              } else if (savingTaskId === task.id) {
                buttonLabel = "Syncing...";
              } else if (hasVisited && state.canComplete) {
                buttonLabel = "Verify & complete";
              } else if (!task.link) {
                buttonLabel = "Locked";
              }

              return (
                <div key={task.id} className="card task-card">
                  <div className="task-card-header">
                    <div className="task-icon-circle">
                      {getTaskIcon(task)}
                    </div>
                    <div>
                      <h2 className="task-title">{task.title}</h2>
                      <p className="task-description">{task.description}</p>
                    </div>
                    <span className="task-reward-pill">{rewardLabel}</span>
                  </div>

                  <div className="task-meta-row">
                    <span className="task-tag">{task.tag}</span>
                    {requirementText && (
                      <span className="task-requirement">
                        {requirementText}
                      </span>
                    )}
                  </div>

                  {state.isLocked &&
                    state.reason &&
                    !state.canComplete &&
                    hasVisited && (
                      <p className="task-hint locked-hint">
                        {state.reason}
                      </p>
                    )}

                  <button
                    className={`secondary-btn task-btn ${
                      state.isCompleted ? "task-btn-done" : ""
                    }`}
                    onClick={() => handleTaskButtonClick(task)}
                    disabled={savingTaskId === task.id}
                  >
                    {buttonLabel}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ====== SOCIAL QUESTS ====== */}
      {socialTasks.length > 0 && (
        <>
          <h2 className="tasks-section-title">Community & Social</h2>
          <p className="tasks-section-subtitle">
            Simple off-chain quests that help you plug into the HeatRush
            ecosystem.
          </p>

          <div className="tasks-grid">
            {socialTasks.map((task) => {
              const state = getTaskState(task);
              const hasVisited = visited.has(task.id);

              let rewardLabel = "";
              if (task.points && task.xp) {
                rewardLabel = `+${task.points.toLocaleString(
                  "en-US"
                )} pts • +${task.xp.toLocaleString("en-US")} XP`;
              } else if (task.points) {
                rewardLabel = `+${task.points.toLocaleString("en-US")} pts`;
              } else if (task.xp) {
                rewardLabel = `+${task.xp.toLocaleString("en-US")} XP`;
              } else {
                rewardLabel = "No reward set";
              }

              let buttonLabel = "Go to page";
              if (state.isCompleted) {
                buttonLabel = "Completed ✔";
              } else if (savingTaskId === task.id) {
                buttonLabel = "Syncing...";
              } else if (hasVisited && state.canComplete) {
                buttonLabel = "Verify & complete";
              } else if (!task.link) {
                buttonLabel = "Locked";
              }

              return (
                <div key={task.id} className="card task-card">
                  <div className="task-card-header">
                    <div className="task-icon-circle">
                      {getTaskIcon(task)}
                    </div>
                    <div>
                      <h2 className="task-title">{task.title}</h2>
                      <p className="task-description">{task.description}</p>
                    </div>
                    <span className="task-reward-pill">{rewardLabel}</span>
                  </div>

                  <div className="task-meta-row">
                    <span className="task-tag">{task.tag}</span>
                  </div>

                  {state.isLocked &&
                    state.reason &&
                    !state.canComplete &&
                    hasVisited && (
                      <p className="task-hint locked-hint">
                        {state.reason}
                      </p>
                    )}

                  <button
                    className={`secondary-btn task-btn ${
                      state.isCompleted ? "task-btn-done" : ""
                    }`}
                    onClick={() => handleTaskButtonClick(task)}
                    disabled={savingTaskId === task.id}
                  >
                    {buttonLabel}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ====== SYSTEM QUESTS ====== */}
      {systemTasks.length > 0 && (
        <>
          <h2 className="tasks-section-title">System & Lifetime Quests</h2>
          <p className="tasks-section-subtitle">
            High-level actions that show you&apos;re really exploring the
            HeatRush hub.
          </p>

          <div className="tasks-grid">
            {systemTasks.map((task) => {
              const state = getTaskState(task);
              const hasVisited = visited.has(task.id);

              let rewardLabel = "";
              if (task.points && task.xp) {
                rewardLabel = `+${task.points.toLocaleString(
                  "en-US"
                )} pts • +${task.xp.toLocaleString("en-US")} XP`;
              } else if (task.points) {
                rewardLabel = `+${task.points.toLocaleString("en-US")} pts`;
              } else if (task.xp) {
                rewardLabel = `+${task.xp.toLocaleString("en-US")} XP`;
              } else {
                rewardLabel = "No reward set";
              }

              let buttonLabel = "Go to page";
              if (state.isCompleted) {
                buttonLabel = "Completed ✔";
              } else if (savingTaskId === task.id) {
                buttonLabel = "Syncing...";
              } else if (hasVisited && state.canComplete) {
                buttonLabel = "Verify & complete";
              } else if (!task.link) {
                buttonLabel = "Locked";
              }

              return (
                <div key={task.id} className="card task-card">
                  <div className="task-card-header">
                    <div className="task-icon-circle">
                      {getTaskIcon(task)}
                    </div>
                    <div>
                      <h2 className="task-title">{task.title}</h2>
                      <p className="task-description">{task.description}</p>
                    </div>
                    <span className="task-reward-pill">{rewardLabel}</span>
                  </div>

                  <div className="task-meta-row">
                    <span className="task-tag">{task.tag}</span>
                  </div>

                  {state.isLocked &&
                    state.reason &&
                    !state.canComplete &&
                    hasVisited && (
                      <p className="task-hint locked-hint">
                        {state.reason}
                      </p>
                    )}

                  <button
                    className={`secondary-btn task-btn ${
                      state.isCompleted ? "task-btn-done" : ""
                    }`}
                    onClick={() => handleTaskButtonClick(task)}
                    disabled={savingTaskId === task.id}
                  >
                    {buttonLabel}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!isConnected && (
        <p className="tasks-footnote">
          Connect your wallet to store quest progress per address and keep your
          Points / XP synced across sessions (locally + backend).
        </p>
      )}
    </div>
  );
};

export default TasksPage;
