// src/lib/referralApi.js

const REF_API_BASE =
  import.meta.env.VITE_REF_API_BASE ||
  "https://heatrush-api.husam-aljabre33.workers.dev";

// دالة مساعدة داخلية لكل طلبات GET فقط (آمنة 100% وما بتأثر على أي شي موجود)
async function _apiGet(endpoint) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const res = await fetch(`${REF_API_BASE}${endpoint}`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : {};
    } catch (err) {
      console.error(`Referral API invalid JSON for ${endpoint}:`, text);
      throw new Error(`Invalid JSON response from ${endpoint}`);
    }

    if (!res.ok || json.ok === false) {
      throw new Error(json.error || `API error (${res.status})`);
    }

    return json;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw err;
  }
}

// ✅ استرجاع أو إنشاء كود الإحالة للمستخدم
export async function fetchReferralCode(walletAddress) {
  if (!walletAddress) throw new Error("Missing wallet address");
  return await _apiGet(`/referral/code?wallet=${walletAddress}`);
}

// ✅ إحصائيات الإحالة للمحيل
export async function fetchReferralStats(walletAddress) {
  if (!walletAddress) throw new Error("Missing wallet address");
  return await _apiGet(`/referral/stats?wallet=${walletAddress}`);
}

// ✅ ليدر بورد أعلى 10 محيلين (حسب الإحالات المؤهلة)
export async function fetchReferralLeaderboard() {
  const url = `${REF_API_BASE}/referral/leaderboard`;
  const res = await fetch(url, { method: "GET" });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    console.error("Referral API invalid JSON for /referral/leaderboard:", text);
    throw new Error(
      "Referral API /referral/leaderboard returned invalid JSON"
    );
  }
  if (!res.ok || json.ok === false) {
    throw new Error(
      json.error ||
        `Referral API /referral/leaderboard error (${res.status})`
    );
  }
  return json; // { ok: true, items: [ { wallet, code, qualifiedCount }, ... ] }
}

// ✅ ربط مستخدم جديد بكود إحالة (attach)
export async function attachReferral(refCode, refereeWallet) {
  if (!refCode) throw new Error("Missing refCode");
  if (!refereeWallet) throw new Error("Missing referee wallet");

  const payload = {
    refCode: refCode,
    refereeWallet: refereeWallet,
  };

  const res = await fetch(`${REF_API_BASE}/referral/attach`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    console.error("Referral API invalid JSON for /referral/attach:", text);
    throw new Error("Referral API /referral/attach returned invalid JSON");
  }

  if (!res.ok || json.ok === false) {
    throw new Error(
      json.error || `Referral API /referral/attach error (${res.status})`
    );
  }

  return json;
}

// ✅ تأهيل إحالة (بعد ما يحقّق شرط stake/presale/xp)
export async function qualifyReferral(refereeWallet, reason = "xp") {
  if (!refereeWallet) throw new Error("Missing referee wallet");

  const res = await fetch(`${REF_API_BASE}/referral/qualify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refereeWallet,
      reason,
    }),
  });

  const text = await res.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    console.error(
      "Referral API invalid JSON for /referral/qualify:",
      text
    );
    throw new Error(
      "Referral API /referral/qualify returned invalid JSON"
    );
  }

  if (!res.ok || json.ok === false) {
    throw new Error(
      json.error || `Referral API /referral/qualify error (${res.status})`
    );
  }

  return json;
}