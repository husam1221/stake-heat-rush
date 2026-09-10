import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import {
  ArrowLeft,
  ArrowRight,
  Flame,
  Gamepad2,
  RotateCcw,
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";

import { ERC20_ABI } from "../../lib/erc20.js";
import { STAKING_ABI } from "../../lib/staking.js";
import { HR_STAKING_ABI } from "../../lib/hrStaking.js";
import {
  MULTICHAIN_STAKING_ASSETS,
  MULTICHAIN_STAKING_READ_ABI,
} from "../../lib/multichainStaking.js";
import {
  BASE_CHAIN_ID,
  HR_STAKING_CONTRACT_ADDRESS,
  HR_TOKEN_ADDRESS,
  STAKING_CONTRACT_ADDRESS,
} from "../../lib/constants.js";
import { fetchReferralStats } from "../../lib/referralApi.js";
import "../../styles/fuel-run.css";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const RUN_DURATION_MS = 30_000;
const TICK_MS = 50;
const LANES = [0, 1, 2];

const ITEM_CONFIG = {
  flame: { label: "Flame", score: 10, fuel: 8, icon: Flame },
  orb: { label: "XP Orb", score: 25, fuel: 2, icon: Zap },
  golden: { label: "Golden Flame", score: 100, fuel: 12, icon: Sparkles },
  obstacle: { label: "Obstacle", score: 0, fuel: -22, icon: ShieldCheck },
};

function pickItemType() {
  const roll = Math.random();
  if (roll < 0.12) return "obstacle";
  if (roll < 0.19) return "golden";
  if (roll < 0.39) return "orb";
  return "flame";
}

function shortWallet(address) {
  if (!address) return "A HeatRush player";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function FuelRunPage({ showToast }) {
  const { address, isConnected } = useAccount();
  const [searchParams] = useSearchParams();
  const challengeScore = Number(searchParams.get("challenge") || 0);
  const challenger = searchParams.get("from") || "A HeatRush player";

  const [status, setStatus] = useState("idle");
  const [playerLane, setPlayerLane] = useState(1);
  const [game, setGame] = useState({
    items: [],
    score: 0,
    fuel: 100,
    timeLeft: 30,
    combo: 0,
  });
  const [bestScore, setBestScore] = useState(() => {
    try {
      return Number(window.localStorage.getItem("hr_fuel_run_best") || 0);
    } catch {
      return 0;
    }
  });
  const [referralStats, setReferralStats] = useState(null);
  const nextItemId = useRef(1);
  const startTimeRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const pointerStartRef = useRef(null);
  const statusRef = useRef(status);
  const { items, score, fuel, timeLeft, combo } = game;

  const { data: stakedRaw } = useReadContract({
    abi: STAKING_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "userStaked",
    args: [address || ZERO_ADDRESS],
    chainId: BASE_CHAIN_ID,
    query: { enabled: Boolean(address) },
  });

  const { data: hrBalanceRaw } = useReadContract({
    abi: ERC20_ABI,
    address: HR_TOKEN_ADDRESS,
    functionName: "balanceOf",
    args: [address || ZERO_ADDRESS],
    chainId: BASE_CHAIN_ID,
    query: { enabled: Boolean(address) },
  });

  const { data: hrStakedRaw } = useReadContract({
    abi: HR_STAKING_ABI,
    address: HR_STAKING_CONTRACT_ADDRESS,
    functionName: "deposited",
    args: [address || ZERO_ADDRESS],
    chainId: BASE_CHAIN_ID,
    query: { enabled: Boolean(address) },
  });

  const { data: multichainStakeResults } = useReadContracts({
    contracts: MULTICHAIN_STAKING_ASSETS.map((asset) => ({
      abi: MULTICHAIN_STAKING_READ_ABI,
      address: asset.stakingAddress,
      functionName: "userStaked",
      args: [address || ZERO_ADDRESS],
      chainId: asset.chainId,
    })),
    query: { enabled: Boolean(address) },
  });

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    let active = true;
    if (!address) {
      setReferralStats(null);
      return undefined;
    }

    fetchReferralStats(address)
      .then((data) => {
        if (active) setReferralStats(data);
      })
      .catch(() => {
        if (active) setReferralStats(null);
      });

    return () => {
      active = false;
    };
  }, [address]);

  const finishRun = useCallback(() => {
    setStatus("complete");
    setGame((current) => ({ ...current, items: [] }));
  }, []);

  useEffect(() => {
    if (status !== "running") return undefined;

    const timer = window.setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const remainingMs = Math.max(0, RUN_DURATION_MS - elapsed);
      let spawnedItem = null;

      // Keep ref mutations outside React's state updater. In StrictMode React may
      // call an updater more than once to verify that it is pure.
      if (now - lastSpawnRef.current >= 620) {
        spawnedItem = {
          id: nextItemId.current,
          lane: LANES[Math.floor(Math.random() * LANES.length)],
          y: -10,
          type: pickItemType(),
        };
        nextItemId.current += 1;
        lastSpawnRef.current = now;
      }

      setGame((current) => {
        const workingItems = spawnedItem
          ? [...current.items, spawnedItem]
          : current.items;
        let nextFuel = Math.max(0, current.fuel - 0.085);
        let nextCombo = current.combo;
        let nextScore = current.score;

        const survivors = [];
        workingItems.forEach((item) => {
          const moved = { ...item, y: item.y + 2.05 };
          const didCollide =
            moved.lane === playerLane && moved.y >= 76 && moved.y <= 91;

          if (didCollide) {
            const config = ITEM_CONFIG[moved.type];
            if (moved.type === "obstacle") {
              nextCombo = 0;
              nextFuel = Math.max(0, nextFuel + config.fuel);
            } else {
              nextCombo += 1;
              nextFuel = Math.min(100, nextFuel + config.fuel);
              const multiplier = nextCombo >= 10 ? 3 : nextCombo >= 5 ? 2 : 1;
              nextScore += config.score * multiplier;
            }
            return;
          }

          if (moved.y <= 105) survivors.push(moved);
        });

        return {
          items: survivors,
          score: nextScore,
          fuel: nextFuel,
          timeLeft: Math.ceil(remainingMs / 1000),
          combo: nextCombo,
        };
      });
    }, TICK_MS);

    return () => window.clearInterval(timer);
  }, [playerLane, status]);

  useEffect(() => {
    if (status === "running" && (timeLeft <= 0 || fuel <= 0)) {
      finishRun();
    }
  }, [finishRun, fuel, status, timeLeft]);

  useEffect(() => {
    if (status !== "complete") return;
    const nextBest = Math.max(bestScore, score);
    setBestScore(nextBest);
    try {
      window.localStorage.setItem("hr_fuel_run_best", String(nextBest));
      if (address) {
        window.localStorage.setItem(
          `hr_fuel_run_best_${address.toLowerCase()}`,
          String(nextBest)
        );
      }
    } catch {
      // The game still works when browser storage is unavailable.
    }
  }, [address, bestScore, score, status]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (statusRef.current !== "running") return;
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        event.preventDefault();
        setPlayerLane((lane) => Math.max(0, lane - 1));
      }
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        event.preventDefault();
        setPlayerLane((lane) => Math.min(2, lane + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const startRun = () => {
    setStatus("running");
    setPlayerLane(1);
    setGame({
      items: [],
      score: 0,
      fuel: 100,
      timeLeft: 30,
      combo: 0,
    });
    startTimeRef.current = Date.now();
    lastSpawnRef.current = Date.now() - 400;
  };

  const moveLeft = () => {
    if (status === "running") setPlayerLane((lane) => Math.max(0, lane - 1));
  };

  const moveRight = () => {
    if (status === "running") setPlayerLane((lane) => Math.min(2, lane + 1));
  };

  const handlePointerDown = (event) => {
    pointerStartRef.current = event.clientX;
  };

  const handlePointerUp = (event) => {
    if (pointerStartRef.current === null || status !== "running") return;
    const distance = event.clientX - pointerStartRef.current;
    if (distance > 28) moveRight();
    if (distance < -28) moveLeft();
    pointerStartRef.current = null;
  };

  const shareChallenge = async () => {
    const shareScore = Math.max(score, bestScore);
    const url = new URL("/fuel-run", window.location.origin);
    url.searchParams.set("challenge", String(shareScore));
    url.searchParams.set("from", shortWallet(address));
    const text = `I scored ${shareScore.toLocaleString("en-US")} 🔥 on HeatRush Fuel Run. Can you beat me?`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "HeatRush Fuel Run", text, url: url.toString() });
      } else {
        await navigator.clipboard.writeText(`${text} ${url.toString()}`);
        showToast?.("success", "Challenge link copied!");
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        showToast?.("error", "Could not share your challenge.");
      }
    }
  };

  const qualifiedReferrals = Number(
    referralStats?.totals?.totalQualified ??
      referralStats?.totals?.qualifiedReferrals ??
      0
  );

  const nextAction = useMemo(() => {
    if (!isConnected) {
      return {
        eyebrow: "SAVE YOUR RUN",
        title: "Connect your wallet",
        text: "Save your best score and unlock your next HeatRush move.",
        kind: "connect",
      };
    }

    const hasAnyStake =
      (stakedRaw ?? 0n) > 0n ||
      (hrStakedRaw ?? 0n) > 0n ||
      Boolean(
        multichainStakeResults?.some(
          (result) => result.status === "success" && (result.result ?? 0n) > 0n
        )
      );

    if (!hasAnyStake) {
      return {
        eyebrow: "NEXT BEST ACTION",
        title: "Build XP by staking",
        text: "Start a staking position and turn this run into platform progress.",
        kind: "link",
        to: "/staking",
        label: "Explore Staking",
      };
    }

    if (!hrBalanceRaw || hrBalanceRaw === 0n) {
      return {
        eyebrow: "NEXT BEST ACTION",
        title: "Get your first HR",
        text: "Add HR to your wallet and grow your HeatRush position.",
        kind: "link",
        to: "/presale",
        label: "Buy HR",
      };
    }

    if (qualifiedReferrals > 0) {
      return {
        eyebrow: "KEEP THE LOOP GOING",
        title: "Share your challenge",
        text: "Your network is active. Give them a score to beat.",
        kind: "share",
        label: "Share Challenge",
      };
    }

    return {
      eyebrow: "YOUR NEXT MOVE",
      title: "Challenge a friend",
      text: "Turn your score into an invitation that feels like a competition.",
      kind: "share",
      label: "Challenge a Friend",
    };
  }, [
    hrBalanceRaw,
    hrStakedRaw,
    isConnected,
    multichainStakeResults,
    qualifiedReferrals,
    stakedRaw,
  ]);

  const comboMultiplier = combo >= 10 ? 3 : combo >= 5 ? 2 : 1;
  const beatChallenge = challengeScore > 0 && score > challengeScore;

  return (
    <main className="fuel-run-page">
      <section className="fuel-run-shell">
        <header className="fuel-run-header">
          <div>
            <span className="fuel-run-kicker"><Gamepad2 size={15} /> HEATRUSH ARCADE</span>
            <h1>FUEL RUN</h1>
          </div>
          <span className="fuel-run-motto">KEEP THE HEAT ALIVE.</span>
        </header>

        {challengeScore > 0 && status !== "complete" && (
          <div className="fuel-challenge-banner">
            <Trophy size={18} />
            <span><strong>{challenger}</strong> challenged you to beat <strong>{challengeScore.toLocaleString("en-US")}</strong>.</span>
          </div>
        )}

        <div className="fuel-game-frame">
          <div className="fuel-hud" aria-live="polite">
            <div><span>TIME</span><strong>00:{String(timeLeft).padStart(2, "0")}</strong></div>
            <div><span>SCORE</span><strong>{score.toLocaleString("en-US")}</strong></div>
            <div><span>COMBO</span><strong>×{comboMultiplier}</strong></div>
          </div>

          <div className="fuel-meter-row">
            <span>FUEL</span>
            <div className="fuel-meter"><i style={{ width: `${fuel}%` }} /></div>
            <strong>{Math.ceil(fuel)}%</strong>
          </div>

          <div
            className={`fuel-track fuel-track-${status}`}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
          >
            <div className="fuel-track-glow" />
            <div className="fuel-lane-line lane-one" />
            <div className="fuel-lane-line lane-two" />

            {items.map((item) => {
              const config = ITEM_CONFIG[item.type];
              const Icon = config.icon;
              return (
                <span
                  key={item.id}
                  className={`fuel-item fuel-item-${item.type}`}
                  style={{ left: `${16.66 + item.lane * 33.33}%`, top: `${item.y}%` }}
                  aria-label={config.label}
                >
                  <Icon size={item.type === "golden" ? 29 : 25} />
                </span>
              );
            })}

            <div
              className="fuel-player"
              style={{ left: `${16.66 + playerLane * 33.33}%` }}
              aria-label="HeatRush energy core"
            >
              <span className="fuel-player-aura" />
              <Flame size={38} fill="currentColor" />
            </div>

            {status === "idle" && (
              <div className="fuel-start-panel">
                <span className="fuel-start-icon"><Flame size={42} fill="currentColor" /></span>
                <h2>Keep the flame alive for 30 seconds.</h2>
                <p>Swipe or use the arrows. Collect heat. Dodge the barriers.</p>
                <button type="button" onClick={startRun}>PLAY NOW <Flame size={18} /></button>
              </div>
            )}

            {status === "complete" && (
              <div className="fuel-results-panel">
                <span className="fuel-result-label">{fuel <= 0 ? "RUN OVER" : "RUN COMPLETE"}</span>
                <h2>{score.toLocaleString("en-US")}</h2>
                <p>SCORE</p>
                <div className="fuel-result-stats">
                  <div><span>DEVICE BEST</span><strong>{Math.max(bestScore, score).toLocaleString("en-US")}</strong></div>
                  {challengeScore > 0 && (
                    <div><span>CHALLENGE</span><strong className={beatChallenge ? "is-won" : ""}>{beatChallenge ? "BEATEN" : challengeScore.toLocaleString("en-US")}</strong></div>
                  )}
                </div>
                <div className="fuel-result-buttons">
                  <button type="button" onClick={startRun}><RotateCcw size={17} /> PLAY AGAIN</button>
                  <button type="button" className="secondary" onClick={shareChallenge}><Share2 size={17} /> SHARE SCORE</button>
                </div>
              </div>
            )}
          </div>

          <div className="fuel-controls">
            <button type="button" onClick={moveLeft} disabled={status !== "running"} aria-label="Move left">
              <ArrowLeft size={24} />
            </button>
            <span>SWIPE OR TAP</span>
            <button type="button" onClick={moveRight} disabled={status !== "running"} aria-label="Move right">
              <ArrowRight size={24} />
            </button>
          </div>
        </div>

        {status === "complete" && (
          <section className="fuel-next-action">
            <div>
              <span>{nextAction.eyebrow}</span>
              <h2>{nextAction.title}</h2>
              <p>{nextAction.text}</p>
            </div>

            {nextAction.kind === "connect" && (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button type="button" onClick={openConnectModal}>CONNECT WALLET</button>
                )}
              </ConnectButton.Custom>
            )}

            {nextAction.kind === "link" && (
              <Link to={nextAction.to}>{nextAction.label} →</Link>
            )}

            {nextAction.kind === "share" && (
              <button type="button" onClick={shareChallenge}>{nextAction.label} <Share2 size={17} /></button>
            )}
          </section>
        )}

        <footer className="fuel-run-note">
          <span>V1 PRACTICE MODE</span>
          <p>Scores stay on this device for now. XP, Points and HR rewards are not active in this test version.</p>
        </footer>
      </section>
    </main>
  );
}
