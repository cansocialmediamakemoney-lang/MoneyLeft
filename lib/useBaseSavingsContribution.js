"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";

function prevMonthKey() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function prevMonthFirstDay() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/**
 * After a month ends, adds the base monthly savings goal (profile.savings_goal)
 * to profile.ml_savings — once per user per month.
 *
 * Idempotency:
 *   - DB SELECT confirms no row exists before attempting INSERT.
 *   - The UNIQUE constraint on (user_id, contribution_month) is a second atomic
 *     lock: concurrent inserts from two devices → one gets 23505, skip cleanly.
 *   - updateProfile is only called after a successful INSERT.
 *   - If updateProfile fails, the contribution row is deleted so the next session
 *     can retry cleanly.
 *
 * Guards:
 *   - Skips if savings_goal is 0.
 *   - Skips if the user's profile was created on or after the first day of the
 *     previous month (they didn't have a full month of savings to credit).
 */
export function useBaseSavingsContribution({ user, profile, updateProfile }) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    if (!user?.id || !profile) return;

    const savingsGoal = parseFloat(profile.savings_goal) || 0;
    if (savingsGoal <= 0) return;

    // User signed up during or after the previous month — no full month to credit.
    const profileCreated = (profile.created_at || "").slice(0, 10);
    if (profileCreated && profileCreated >= prevMonthFirstDay()) return;

    hasRun.current = true;
    const month = prevMonthKey(); // e.g. "2026-04"

    (async () => {
      const supabase = createClient();

      // ── 1. DB check — source of truth ──────────────────────────────────
      const { data: existing, error: checkErr } = await supabase
        .from("base_savings_contributions")
        .select("id")
        .eq("user_id", user.id)
        .eq("contribution_month", month)
        .maybeSingle();

      if (checkErr) {
        console.warn("[BaseSavings] check failed:", checkErr.message);
        return;
      }
      if (existing) return; // already applied this month

      // ── 2. INSERT first (idempotency lock) ──────────────────────────────
      const { error: insertErr } = await supabase
        .from("base_savings_contributions")
        .insert({
          user_id: user.id,
          contribution_month: month,
          amount: savingsGoal,
        });

      if (insertErr) {
        // 23505 = another device already inserted — skip cleanly
        if (insertErr.code !== "23505") {
          console.error("[BaseSavings] insert failed:", insertErr.code, insertErr.message);
        }
        return;
      }

      // ── 3. Fetch latest ml_savings from DB (don't trust stale React state) ──
      const { data: latestProfile, error: fetchErr } = await supabase
        .from("profiles")
        .select("ml_savings")
        .eq("id", user.id)
        .maybeSingle();

      if (fetchErr || !latestProfile) {
        console.error("[BaseSavings] profile fetch failed, rolling back");
        await supabase
          .from("base_savings_contributions")
          .delete()
          .eq("user_id", user.id)
          .eq("contribution_month", month)
          .catch(() => {});
        return;
      }

      const newMlSavings = (parseFloat(latestProfile.ml_savings) || 0) + savingsGoal;

      // ── 4. Update ml_savings ─────────────────────────────────────────────
      try {
        await updateProfile({ ml_savings: newMlSavings });
      } catch (err) {
        console.error("[BaseSavings] updateProfile failed:", err?.message || err);
        // Roll back so the next session can retry
        await supabase
          .from("base_savings_contributions")
          .delete()
          .eq("user_id", user.id)
          .eq("contribution_month", month)
          .catch(() => {});
      }
    })();
  }, [user?.id, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps
}
