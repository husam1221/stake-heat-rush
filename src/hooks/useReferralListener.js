// src/hooks/useReferralListener.js
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { attachReferral } from "../lib/referralApi.js";

export function useReferralListener() {
  const { address, isConnected } = useAccount();

  // أول ما يدخل على الموقع: لو فيه ?ref=CODE نخزنه محلياً
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) {
        const clean = String(ref).trim().toUpperCase();
        if (clean) {
          window.localStorage.setItem("hr_pending_ref_code", clean);
          console.log("[Referral] Stored pending ref code:", clean);
        }
      }
    } catch (e) {
      console.warn("[Referral] Failed to read ?ref param", e);
    }
  }, []);

  // لما المحفظة تتصل: نحاول نعمل attach لو فيه ref pending
  useEffect(() => {
    if (!isConnected || !address) return;

    let refCode = null;
    try {
      refCode = window.localStorage.getItem("hr_pending_ref_code");
    } catch (e) {
      console.warn("[Referral] Failed to read pending ref from storage", e);
      return;
    }

    if (!refCode) return;
    refCode = String(refCode).trim().toUpperCase();
    if (!refCode) return;

    const lowerWallet = address.toLowerCase();
    const attachedKey = `hr_ref_attached_${lowerWallet}`;

    // لو أصلاً مسجّل إن هذه المحفظة انربطت بهالكود، ما نعيد الطلب
    const already = window.localStorage.getItem(attachedKey);
    if (already === refCode) {
      console.log("[Referral] Already attached this ref for this wallet");
      return;
    }

    console.log("[Referral] Attaching referral:", { refCode, wallet: address });

    attachReferral(refCode, address)
      .then((res) => {
        console.log("[Referral] attach result:", res);
        if (res.ok) {
          window.localStorage.setItem(attachedKey, refCode);
          window.localStorage.removeItem("hr_pending_ref_code");
        }
      })
      .catch((err) => {
        console.error("[Referral] attach failed", err);
      });
  }, [isConnected, address]);
}
