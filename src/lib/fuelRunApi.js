const FUEL_RUN_API_BASE =
  import.meta.env.VITE_FUEL_RUN_API_BASE ||
  "https://heatrush-game-api.husam-aljabre33.workers.dev";

async function gameRequest(path, options = {}) {
  const response = await fetch(`${FUEL_RUN_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = { ok: false, error: "INVALID_RESPONSE" };
  }

  if (!response.ok || !data?.ok) {
    const error = new Error(data?.error || "GAME_API_ERROR");
    error.code = data?.error || "GAME_API_ERROR";
    error.status = response.status;
    throw error;
  }

  return data;
}

export function fetchFuelRunPlayer(wallet) {
  return gameRequest(`/fuel-run/player?wallet=${encodeURIComponent(wallet)}`);
}

export function registerFuelRunPlayer({ wallet, name, countryCode }) {
  return gameRequest("/fuel-run/register", {
    method: "POST",
    body: JSON.stringify({ wallet, name, countryCode }),
  });
}

export function startFuelRun(wallet) {
  return gameRequest("/fuel-run/start", {
    method: "POST",
    body: JSON.stringify({ wallet }),
  });
}

export function submitFuelRunScore({ wallet, runId, score }) {
  return gameRequest("/fuel-run/score", {
    method: "POST",
    body: JSON.stringify({ wallet, runId, score }),
  });
}

export function fetchFuelRunLeaderboard(wallet) {
  const query = wallet ? `?wallet=${encodeURIComponent(wallet)}` : "";
  return gameRequest(`/fuel-run/leaderboard${query}`);
}
