// src/lib/xpApi.js

// حط هون رابط الـ Worker تبع الـ XP
// انت استخدمت هذا الرابط بيدك قبل:
// https://heatrush-api.husam-aljabre33.workers.dev/xp/profile?wallet=...
// عشان هيك بخلي الـ BASE يساوي /xp

const XP_API_BASE =
  import.meta.env.VITE_XP_API_BASE ||
  "https://heatrush-api.husam-aljabre33.workers.dev/xp";

// ===== هان بنجيب كل الـ XP / Points للمستخدم =====
export async function fetchXpOverview(walletAddress) {
  if (!walletAddress) {
    throw new Error("Missing wallet address");
  }

  const url = `${XP_API_BASE}/profile?wallet=${walletAddress}`;

  const res = await fetch(url, {
    method: "GET",
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    console.error("XP API invalid JSON for /profile:", text);
    throw new Error("XP API /profile returned invalid JSON");
  }

  if (!res.ok || json.ok === false) {
    throw new Error(json.error || `XP API /profile error (${res.status})`);
  }

  return json;
}

// ===== خزان اليومي: +200 Points و +3 XP =====
export async function claimDailyTankApi(walletAddress) {
  if (!walletAddress) {
    throw new Error("Missing wallet address");
  }

  const res = await fetch(`${XP_API_BASE}/daily-claim`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ wallet: walletAddress }),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    console.error("XP API invalid JSON for /daily-claim:", text);
    throw new Error("XP API /daily-claim returned invalid JSON");
  }

  if (!res.ok || json.ok === false) {
    throw new Error(
      json.error || `XP API /daily-claim error (${res.status})`
    );
  }

  // شكل النتيجة المتوقع من الـ Worker:
  // {
  //   ok: true,
  //   wallet: "0x...",
  //   added: { points: 200, xp: 3 },
  //   totals: { points: 200, xp: 3 },
  //   tank: { lastClaimAt, totalPoints, totalXp }
  // }

  return json;
}



// 🧡 XP history (daily aggregates for last N days)
export async function fetchXpHistory(wallet, days = 30) {
  if (!wallet) return null;

  const url = `${XP_API_BASE}/history?wallet=${wallet.toLowerCase()}&days=${days}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!res.ok) {
    console.error("Failed to fetch XP history:", res.status, res.statusText);
    throw new Error("Failed to fetch XP history");
  }

  const data = await res.json();
  return data;
}




// ===== تكميل تاسك / كويست: نقاط + XP =====
// نمرّر: عنوان المحفظة + رقم/اسم التاسك + عدد النقاط + عدد الـ XP
export async function completeTaskApi(walletAddress, taskId, points = 0, xp = 0) {
  if (!walletAddress) {
    throw new Error("Missing wallet address");
  }
  if (!taskId) {
    throw new Error("Missing task id");
  }

  const res = await fetch(`${XP_API_BASE}/task-complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      wallet: walletAddress,
      taskId,
      points,
      xp,
    }),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    console.error("XP API invalid JSON for /task-complete:", text);
    throw new Error("XP API /task-complete returned invalid JSON");
  }

  if (!res.ok || json.ok === false) {
    throw new Error(
      json.error || `XP API /task-complete error (${res.status})`
    );
  }

  // الشكل المتوقع من الـ Worker (حسب الكود اللي عملناه):
  // {
  //   ok: true,
  //   wallet: "0x...",
  //   added: { points: 100, xp: 5 },
  //   totals: {
  //     points_offchain: 300,
  //     xp_offchain: 8
  //   }
  // }
  return json;
}

// 🧡 XP leaderboard (top 10 + current user rank)
export async function fetchXpLeaderboard(wallet) {
  const qs = wallet ? `?wallet=${wallet.toLowerCase()}` : "";
  const url = `${XP_API_BASE}/leaderboard${qs}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    console.error("Failed to fetch XP leaderboard:", res.status, res.statusText);
    throw new Error("Failed to fetch XP leaderboard");
  }

  return res.json();
}


// 🧡 Sync on-chain staking XP into XP backend
export async function syncOnchainXpApi(walletAddress, xpOnchain) {
  if (!walletAddress) {
    throw new Error("Missing wallet address");
  }

  const cleanWallet = walletAddress.toLowerCase();
  const cleanXp = Math.max(0, Math.floor(Number(xpOnchain || 0)));

  const res = await fetch(`${XP_API_BASE}/sync-onchain`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      wallet: cleanWallet,
      xp_onchain: cleanXp,
    }),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    console.error("XP API invalid JSON for /sync-onchain:", text);
    throw new Error("XP API /sync-onchain returned invalid JSON");
  }

  if (!res.ok || json.ok === false) {
    throw new Error(
      json.error || `XP API /sync-onchain error (${res.status})`
    );
  }

  // الشكل المتوقع:
  // {
  //   ok: true,
  //   wallet: "0x...",
  //   xp_onchain: 200,
  //   totals: {
  //     xp_offchain: ...,
  //     xp_onchain: ...,
  //     xp_global: ...
  //   }
  // }

  return json;
}
