"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";

// "YYYY-MM" for the previous month
function prevMonthKey() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// First day of the current month — used as refDateStr so the formula matches
// what the dashboard calculates on the first day of the month.
function currentMonthFirstDay() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

const lsKey = (goalId, month) => `ml_gc_${goalId}_${month}`;

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
 * On the first render of a new month, applies the previous month's savings
 * contribution to each active savings goal.
 *
 * Cross-device idempotency: INSERT into goal_contributions is attempted first.
 * The unique constraint on (user_id, goal_id, contribution_month) makes this
 * atomic — if another device already inserted the row, the insert fails with
 * code 23505 and updatePlan is never called. localStorage is a fast-path cache
 * only; it does not guard against a second device.
 */
export function useGoalContributions({ user, plans, updatePlan }) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    if (!user?.id) return;

    const savingPlans = plans.filter((p) => p.plan_type === "saving");
    if (savingPlans.length === 0) return;

    hasRun.current = true;

    const month = prevMonthKey();
    const refDateStr = currentMonthFirstDay();

    (async () => {
      const supabase = createClient();

      for (const plan of savingPlans) {
        // Fast-path: localStorage confirms this device already applied this month
        if (localStorage.getItem(lsKey(plan.id, month))) continue;

        // Fetch the latest plan state from DB — do not rely on stale hook data
        const { data: latest, error: fetchErr } = await supabase
          .from("plans")
          .select("current_saved, amount, end_date, start_date")
          .eq("id", plan.id)
          .single();

        if (fetchErr || !latest) continue;

        // Skip goals that started in the current month — they have no prior-month history.
        // Without this check, a goal created today would incorrectly receive last month's
        // contribution, making current_saved equal the monthly requirement on day 1.
        if (latest.start_date && latest.start_date >= refDateStr) continue;

        // Skip completed goals (fresh from DB)
        const remaining = Math.max(
          0,
          (parseFloat(latest.amount) || 0) - (parseFloat(latest.current_saved) || 0)
        );
        if (remaining <= 0) {
          localStorage.setItem(lsKey(plan.id, month), "1");
          continue;
        }

        const monthly = monthlyForGoal({ ...plan, ...latest }, refDateStr);
        if (monthly < 0.005) continue;

        const contribution = Math.min(monthly, remaining);
        if (contribution < 0.005) continue;

        // INSERT the contribution record FIRST.
        // The unique constraint on (user_id, goal_id, contribution_month) is the
        // cross-device lock. If device B tries to insert after device A already did,
        // Postgres rejects it with code 23505 and we skip updatePlan entirely.
        const { error: insertErr } = await supabase
          .from("goal_contributions")
          .insert({
            user_id: user.id,
            goal_id: plan.id,
            contribution_month: month,
            amount: contribution,
          });

        if (insertErr) {
          if (insertErr.code === "23505") {
            // Duplicate — another device already applied this contribution
            localStorage.setItem(lsKey(plan.id, month), "1");
          }
          // Any other error (table missing, network, RLS): skip — be conservative
          continue;
        }

        // Insert succeeded — safe to update the plan's progress
        const newSaved = (parseFloat(latest.current_saved) || 0) + contribution;
        try {
          await updatePlan(plan.id, { current_saved: newSaved });
          localStorage.setItem(lsKey(plan.id, month), "1");
        } catch (err) {
          console.error("[useGoalContributions] updatePlan failed for plan", plan.id, err);
          // Roll back the contribution record so the next session can retry cleanly
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
