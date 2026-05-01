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
 * Idempotency: localStorage key `ml_gc_<goalId>_<YYYY-MM>` is the primary
 * guard — it works even if the goal_contributions Supabase table hasn't been
 * created yet. The DB upsert is best-effort only.
 *
 * Formula: mirrors the dashboard's planSavingsMonthly exactly, using the
 * first day of the current month as the reference date so the numbers match.
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
      for (const plan of savingPlans) {
        // PRIMARY idempotency guard — localStorage
        if (localStorage.getItem(lsKey(plan.id, month))) continue;

        const monthly = monthlyForGoal(plan, refDateStr);
        if (monthly < 0.005) continue;

        const remaining = Math.max(
          0,
          (parseFloat(plan.amount) || 0) - (parseFloat(plan.current_saved) || 0)
        );
        const contribution = Math.min(monthly, remaining);
        if (contribution < 0.005) continue;

        const newSaved = (parseFloat(plan.current_saved) || 0) + contribution;

        try {
          await updatePlan(plan.id, { current_saved: newSaved });
          // Mark applied in localStorage immediately after the plan update succeeds
          localStorage.setItem(lsKey(plan.id, month), "1");
        } catch (err) {
          console.error("[useGoalContributions] updatePlan failed for plan", plan.id, err);
          continue;
        }

        // Best-effort DB record — non-fatal if table doesn't exist
        try {
          const supabase = createClient();
          await supabase.from("goal_contributions").upsert(
            {
              user_id: user.id,
              goal_id: plan.id,
              contribution_month: month,
              amount: contribution,
            },
            { onConflict: "user_id,goal_id,contribution_month", ignoreDuplicates: true }
          );
        } catch {
          // silently ignore — localStorage guard is authoritative
        }
      }
    })();
  }, [user?.id, plans.length]); // eslint-disable-line react-hooks/exhaustive-deps
}
