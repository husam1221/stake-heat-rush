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
  Volume2,
  VolumeX,
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
import {
  fetchFuelRunLeaderboard,
  fetchFuelRunPlayer,
  registerFuelRunPlayer,
  startFuelRun,
  submitFuelRunScore,
} from "../../lib/fuelRunApi.js";
import "../../styles/fuel-run.css";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const RUN_DURATION_MS = 30_000;
const TICK_MS = 50;
const LANES = [0, 1, 2];
const COUNTRY_CODES = `AF AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UM UY UZ VU VE VN VG VI WF EH YE ZM ZW`.split(" ");
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const COUNTRY_OPTIONS = COUNTRY_CODES.map((code) => ({
  code,
  name: regionNames.of(code) || code,
})).sort((a, b) => a.name.localeCompare(b.name));

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

function countryFlag(code) {
  if (!code) return "🌍";
  return code
    .toUpperCase()
    .split("")
    .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
    .join("");
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
  const [playerProfile, setPlayerProfile] = useState(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [registering, setRegistering] = useState(false);
  const [startingRun, setStartingRun] = useState(false);
  const [scoreStatus, setScoreStatus] = useState("idle");
  const [weeklyBoard, setWeeklyBoard] = useState([]);
  const [currentRank, setCurrentRank] = useState(null);
  const [leaderboardWeek, setLeaderboardWeek] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return window.localStorage.getItem("hr_fuel_run_sound") !== "off";
    } catch {
      return true;
    }
  });
  const nextItemId = useRef(1);
  const startTimeRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const pointerStartRef = useRef(null);
  const statusRef = useRef(status);
  const runIdRef = useRef(null);
  const submittedRunRef = useRef(null);
  const audioContextRef = useRef(null);
  const previousGameRef = useRef(game);
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

  const playSound = useCallback((type) => {
    if (!soundEnabled) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const context = audioContextRef.current || new AudioContext();
      audioContextRef.current = context;
      if (context.state === "suspended") context.resume();

      const settings = {
        start: [260, 0.12, "square"],
        collect: [520, 0.08, "sine"],
        golden: [880, 0.18, "sine"],
        obstacle: [115, 0.22, "sawtooth"],
        complete: [660, 0.3, "triangle"],
      };
      const [frequency, duration, wave] = settings[type] || settings.collect;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;

      oscillator.type = wave;
      oscillator.frequency.setValueAtTime(frequency, now);
      if (type === "golden" || type === "complete") {
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.45, now + duration);
      }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.02);
    } catch {
      // Sound is optional; gameplay continues if the browser blocks audio.
    }
  }, [soundEnabled]);

  const loadLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const data = await fetchFuelRunLeaderboard(address);
      setWeeklyBoard(data.leaderboard || []);
      setCurrentRank(data.currentPlayer || null);
      setLeaderboardWeek(data.week || null);
    } catch {
      setWeeklyBoard([]);
      setCurrentRank(null);
    } finally {
      setLeaderboardLoading(false);
    }
  }, [address]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    let active = true;
    setPlayerError("");
    setPlayerProfile(null);

    if (!address) {
      setPlayerLoading(false);
      return undefined;
    }

    setPlayerLoading(true);
    fetchFuelRunPlayer(address)
      .then((data) => {
        if (active) setPlayerProfile(data.player || null);
      })
      .catch(() => {
        if (active) setPlayerError("Could not load your player profile.");
      })
      .finally(() => {
        if (active) setPlayerLoading(false);
      });

    return () => {
      active = false;
    };
  }, [address]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "hr_fuel_run_sound",
        soundEnabled ? "on" : "off"
      );
    } catch {
      // Sound preference remains active for the current session.
    }
  }, [soundEnabled]);

  useEffect(() => {
    const previous = previousGameRef.current;
    if (status === "running") {
      if (game.score > previous.score) {
        playSound(game.score - previous.score >= 100 ? "golden" : "collect");
      } else if (previous.fuel - game.fuel > 5) {
        playSound("obstacle");
      }
    }
    previousGameRef.current = game;
  }, [game, playSound, status]);

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

  const handleRegisterPlayer = async (event) => {
    event.preventDefault();
    if (!address || registering) return;

    setRegistering(true);
    setPlayerError("");
    try {
      const data = await registerFuelRunPlayer({
        wallet: address,
        name: playerName,
        countryCode,
      });
      setPlayerProfile(data.player);
      showToast?.("success", "Player profile locked. Welcome to Fuel Run!");
      loadLeaderboard();
    } catch (error) {
      const messages = {
        INVALID_NAME: "Use 2–24 letters or numbers for your player name.",
        INVALID_COUNTRY: "Choose your country.",
        PROFILE_ALREADY_LOCKED: "This wallet already has a locked player profile.",
      };
      setPlayerError(messages[error.code] || "Could not save your player profile.");
    } finally {
      setRegistering(false);
    }
  };

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
    if (
      status !== "complete" ||
      !address ||
      !runIdRef.current ||
      submittedRunRef.current === runIdRef.current
    ) {
      return;
    }

    const completedRunId = runIdRef.current;
    submittedRunRef.current = completedRunId;
    setScoreStatus("saving");
    playSound("complete");

    submitFuelRunScore({
      wallet: address,
      runId: completedRunId,
      score,
    })
      .then(() => {
        setScoreStatus("saved");
        loadLeaderboard();
      })
      .catch(() => {
        setScoreStatus("error");
        submittedRunRef.current = null;
      });
  }, [address, loadLeaderboard, playSound, score, status]);

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

  const startRun = async () => {
    if (!address || !playerProfile || startingRun) return;

    setStartingRun(true);
    setScoreStatus("idle");
    try {
      const data = await startFuelRun(address);
      runIdRef.current = data.runId;
      submittedRunRef.current = null;
      setStatus("running");
      setPlayerLane(1);
      const freshGame = {
        items: [],
        score: 0,
        fuel: 100,
        timeLeft: 30,
        combo: 0,
      };
      setGame(freshGame);
      previousGameRef.current = freshGame;
      startTimeRef.current = Date.now();
      lastSpawnRef.current = Date.now() - 400;
      playSound("start");
    } catch {
      showToast?.("error", "Could not start this run. Please try again.");
    } finally {
      setStartingRun(false);
    }
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
  const weekEndsLabel = leaderboardWeek?.endsAt
    ? new Intl.DateTimeFormat("en", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(leaderboardWeek.endsAt))
    : "Loading…";

  return (
    <main className="fuel-run-page">
      <section className="fuel-run-shell">
        <header className="fuel-run-header">
          <div>
            <span className="fuel-run-kicker"><Gamepad2 size={15} /> HEATRUSH ARCADE</span>
            <h1>FUEL RUN</h1>
          </div>
          <div className="fuel-run-header-actions">
            {playerProfile && (
              <span className="fuel-player-chip">
                {countryFlag(playerProfile.countryCode)} {playerProfile.name}
              </span>
            )}
            <button
              type="button"
              className="fuel-sound-toggle"
              onClick={() => setSoundEnabled((enabled) => !enabled)}
              aria-label={soundEnabled ? "Mute game sounds" : "Enable game sounds"}
              title={soundEnabled ? "Sound on" : "Sound off"}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>
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

            {status === "idle" && !isConnected && (
              <div className="fuel-start-panel">
                <span className="fuel-start-icon"><Flame size={42} fill="currentColor" /></span>
                <h2>Connect to enter Fuel Run.</h2>
                <p>Your wallet keeps your player profile and weekly score together.</p>
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button type="button" onClick={openConnectModal}>CONNECT WALLET</button>
                  )}
                </ConnectButton.Custom>
              </div>
            )}

            {status === "idle" && isConnected && playerLoading && (
              <div className="fuel-start-panel">
                <span className="fuel-start-icon"><Flame size={42} fill="currentColor" /></span>
                <h2>Loading your player…</h2>
                <p>Checking your Fuel Run profile.</p>
              </div>
            )}

            {status === "idle" && isConnected && !playerLoading && !playerProfile && (
              <form className="fuel-start-panel fuel-register-panel" onSubmit={handleRegisterPlayer}>
                <span className="fuel-result-label">ONE-TIME PLAYER SETUP</span>
                <h2>Choose your player identity.</h2>
                <p>Your name and country lock after saving and cannot be changed.</p>
                <label>
                  <span>PLAYER NAME</span>
                  <input
                    value={playerName}
                    onChange={(event) => setPlayerName(event.target.value)}
                    minLength={2}
                    maxLength={24}
                    placeholder="Enter your name"
                    autoComplete="nickname"
                    required
                  />
                </label>
                <label>
                  <span>COUNTRY</span>
                  <select
                    value={countryCode}
                    onChange={(event) => setCountryCode(event.target.value)}
                    required
                  >
                    <option value="">Choose your country</option>
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={country.code} value={country.code}>
                        {countryFlag(country.code)} {country.name}
                      </option>
                    ))}
                  </select>
                </label>
                {playerError && <span className="fuel-form-error">{playerError}</span>}
                <button type="submit" disabled={registering || !playerName.trim() || !countryCode}>
                  {registering ? "SAVING…" : "LOCK & CONTINUE"}
                </button>
              </form>
            )}

            {status === "idle" && isConnected && !playerLoading && playerProfile && (
              <div className="fuel-start-panel">
                <span className="fuel-start-icon"><Flame size={42} fill="currentColor" /></span>
                <h2>Ready, {playerProfile.name}?</h2>
                <p>Swipe or use the arrows. Collect heat. Dodge the barriers.</p>
                <button type="button" onClick={startRun} disabled={startingRun}>
                  {startingRun ? "STARTING…" : "PLAY NOW"} <Flame size={18} />
                </button>
              </div>
            )}

            {status === "complete" && (
              <div className="fuel-results-panel">
                <span className="fuel-result-label">{fuel <= 0 ? "RUN OVER" : "RUN COMPLETE"}</span>
                <h2>{score.toLocaleString("en-US")}</h2>
                <p>SCORE</p>
                <span className={`fuel-score-status fuel-score-status-${scoreStatus}`}>
                  {scoreStatus === "saving" && "Saving weekly score…"}
                  {scoreStatus === "saved" && "Weekly score saved"}
                  {scoreStatus === "error" && "Score was not saved. Play again to retry."}
                </span>
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

        <section className="fuel-weekly-board">
          <div className="fuel-weekly-heading">
            <div>
              <span>WEEKLY COMPETITION</span>
              <h2>Fuel Run Leaderboard</h2>
            </div>
            <div className="fuel-week-reset">
              <span>RESETS</span>
              <strong>{weekEndsLabel}</strong>
            </div>
          </div>

          {currentRank && (
            <div className="fuel-current-rank">
              <span>YOUR WEEKLY RANK</span>
              <strong>#{currentRank.rank}</strong>
              <span>{currentRank.score.toLocaleString("en-US")} pts</span>
            </div>
          )}

          {leaderboardLoading && (
            <p className="fuel-board-message">Loading this week’s players…</p>
          )}

          {!leaderboardLoading && weeklyBoard.length === 0 && (
            <p className="fuel-board-message">No scores yet. Be the first player this week.</p>
          )}

          {!leaderboardLoading && weeklyBoard.length > 0 && (
            <div className="fuel-board-list">
              {weeklyBoard.map((player) => {
                const isCurrentPlayer =
                  address && player.wallet.toLowerCase() === address.toLowerCase();
                return (
                  <div
                    className={`fuel-board-row ${isCurrentPlayer ? "is-current" : ""}`}
                    key={player.wallet}
                  >
                    <strong className="fuel-board-position">#{player.rank}</strong>
                    <span className="fuel-board-flag">{countryFlag(player.countryCode)}</span>
                    <div className="fuel-board-player">
                      <strong>{player.name}</strong>
                      <span>{shortWallet(player.wallet)}{isCurrentPlayer ? " · YOU" : ""}</span>
                    </div>
                    <strong className="fuel-board-score">
                      {player.score.toLocaleString("en-US")}
                    </strong>
                  </div>
                );
              })}
            </div>
          )}
        </section>

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
