"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";

// "YYYY-MM" for the previous calendar month
function prevMonthKey() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// First day of the current month — used as the reference date for the monthly
// contribution formula so it matches what the dashboard shows on the 1st.
function currentMonthFirstDay() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

// Mirror the dashboard's planSavingsMonthly formula exactly.
function monthlyForGoal(plan, refDateStr) {
  if (plan.end_date <= refDateStr) return 0;
  const remaining = Math.max(
    0,
    (parseFloat(plan.amount) || 0) - (parseFloat(plan.current_saved) || 0)
  );
  if (remaining <= 0) return 0;
  const msLeft =
    new Date(plan.end_date + "T00:00:00") - new Date(refDateStr + "T00:00:00");
  const months = Math.max(0, msLeft / 86400000) / 30.4375;
  return months > 0 ? remaining / months : 0;
}

/**
 * After a month ends, applies the previous month's savings contribution to each
 * active savings goal — once per goal per month.
 *
 * This runs on dashboard load. If the previous month's contribution has already
 * been recorded in goal_contributions (for any device), it is skipped.
 *
 * Idempotency:
 *   - DB SELECT confirms no row exists before attempting INSERT.
 *   - The UNIQUE constraint on (user_id, goal_id, contribution_month) is a
 *     second atomic lock: concurrent inserts from two devices → one gets 23505.
 *   - updatePlan is only called after a successful INSERT.
 *   - If updatePlan fails, the contribution row is deleted so the next session
 *     can retry cleanly.
 */
export function useGoalContributions({ user, plans, updatePlan }) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    if (!user?.id) return;

    const savingPlans = plans.filter((p) => p.plan_type === "saving");
    if (savingPlans.length === 0) return;

    hasRun.current = true;

    const month      = prevMonthKey();         // e.g. "2026-04"
    const refDateStr = currentMonthFirstDay(); // e.g. "2026-05-01"

    (async () => {
      const supabase = createClient();

      for (const plan of savingPlans) {
        // Skip goals created this month — they have no previous-month history.
        // start_date is set to today when a goal is created via SavingsGoalCreate.
        const startDate = plan.start_date || "";
        if (startDate >= refDateStr) continue;

        // ── 1. DB check — source of truth ──────────────────────────────
        const { data: existing, error: checkErr } = await supabase
          .from("goal_contributions")
          .select("id")
          .eq("user_id", user.id)
          .eq("goal_id", plan.id)
          .eq("contribution_month", month)
          .maybeSingle();

        if (checkErr) {
          console.warn("[GoalContributions] check failed:", plan.name, checkErr.message);
          continue;
        }
        if (existing) continue; // already applied this month

        // ── 2. Fetch latest plan state ──────────────────────────────────
        const { data: latest, error: fetchErr } = await supabase
          .from("plans")
          .select("current_saved, amount, end_date, start_date")
          .eq("id", plan.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (fetchErr) {
          console.error("[GoalContributions] fetch failed:", plan.id, fetchErr.message);
          continue;
        }
        if (!latest) continue; // plan not found — skip safely

        // Re-check start_date from fresh DB data
        if (latest.start_date && latest.start_date >= refDateStr) continue;

        const remaining = Math.max(
          0,
          (parseFloat(latest.amount) || 0) - (parseFloat(latest.current_saved) || 0)
        );
        if (remaining <= 0) continue;

        const monthly = monthlyForGoal({ ...plan, ...latest }, refDateStr);
        if (monthly < 0.005) continue;

        const contribution = Math.min(monthly, remaining);
        if (contribution < 0.005) continue;

        // ── 3. INSERT first (idempotency lock) ──────────────────────────
        const { error: insertErr } = await supabase
          .from("goal_contributions")
          .insert({
            user_id: user.id,
            goal_id: plan.id,
            contribution_month: month,
            amount: contribution,
          });

        if (insertErr) {
          // 23505 = another device already inserted — skip cleanly
          if (insertErr.code !== "23505") {
            console.error("[GoalContributions] insert failed:", plan.name, insertErr.code, insertErr.message);
          }
          continue;
        }

        // ── 4. Update current_saved ─────────────────────────────────────
        const newSaved = (parseFloat(latest.current_saved) || 0) + contribution;
        try {
          await updatePlan(plan.id, { current_saved: newSaved });
        } catch (err) {
          console.error("[GoalContributions] updatePlan failed:", plan.name, err?.message || err);
          // Roll back so the next session can retry
          await supabase
            .from("goal_contributions")
            .delete()
            .eq("user_id", user.id)
            .eq("goal_id", plan.id)
            .eq("contribution_month", month)
            .catch(() => {});
        }
      }
    })();
  }, [user?.id, plans.length]); // eslint-disable-line react-hooks/exhaustive-deps
}
