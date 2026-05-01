"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";

// Returns the "YYYY-MM" key for the month immediately before today.
function prevMonthKey() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Returns an array of "YYYY-MM" keys from startKey through endKey (inclusive),
// capped at 24 months to avoid excessive work for long-dormant accounts.
function monthsBetween(startKey, endKey) {
  if (startKey > endKey) return [];
  const [sy, sm] = startKey.split("-").map(Number);
  const [ey, em] = endKey.split("-").map(Number);
  const result = [];
  let y = sy, m = sm;
  while ((y < ey || (y === ey && m <= em)) && result.length < 24) {
    result.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return result;
}

/**
 * Automatically applies monthly savings contributions to active savings goals
 * when a new month begins. Runs once per session.
 *
 * How idempotency works:
 *   The goal_contributions table has a unique(user_id, goal_id, contribution_month)
 *   constraint. Before inserting, we fetch all existing records for this user and
 *   skip any (goal, month) pair that already has a row. Even if this hook fires
 *   multiple times (e.g. hot reload, duplicate mounts), the DB rejects duplicates.
 *
 * What gets contributed:
 *   For each active saving goal and each unprocessed past month, we calculate
 *   the monthly requirement the same way the dashboard does:
 *     monthly = remaining / months_until_deadline
 *   and cap it at the remaining amount so the goal never overshoots its target.
 *
 * What this does NOT touch:
 *   - Base savings goal (profile.savings_goal) — separate from plan goals
 *   - currentSavings / mlSavings — stored in localStorage, unrelated
 *   - leftover Money Left rollover — user-controlled, handled by useMonthEnd
 */
export function useGoalContributions({ user, plans, updatePlan }) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    if (!user?.id) return;

    const savingPlans = plans.filter((p) => p.plan_type === "saving");
    if (savingPlans.length === 0) return;

    hasRun.current = true; // prevent re-runs within the same session

    const supabase = createClient();
    const lastMonth = prevMonthKey();

    (async () => {
      try {
        // Batch-fetch all existing contributions for this user in one query,
        // so we can do the idempotency check in memory without N+1 round-trips.
        const { data: existing, error: fetchErr } = await supabase
          .from("goal_contributions")
          .select("goal_id, contribution_month")
          .eq("user_id", user.id);

        if (fetchErr) {
          // Table may not exist yet (migration not run). Bail silently.
          console.warn("[useGoalContributions] could not fetch contributions:", fetchErr.message);
          return;
        }

        const alreadyApplied = new Set(
          (existing || []).map((r) => `${r.goal_id}:${r.contribution_month}`)
        );

        for (const plan of savingPlans) {
          const target = parseFloat(plan.amount) || 0;
          if (target <= 0) continue;

          // Determine which months this goal could have contributions for.
          // Start from the plan's creation month, capped at 24 months back.
          const createdKey = (plan.created_at || "").substring(0, 7);
          const startKey = createdKey && createdKey <= lastMonth ? createdKey : lastMonth;
          const allMonths = monthsBetween(startKey, lastMonth);
          const unprocessed = allMonths.filter(
            (m) => !alreadyApplied.has(`${plan.id}:${m}`)
          );
          if (unprocessed.length === 0) continue;

          // Simulate contributions in chronological order so each month's
          // calculation is based on the running total including prior months.
          let runningTotal = parseFloat(plan.current_saved) || 0;
          const toInsert = [];

          for (const month of unprocessed) {
            const remaining = Math.max(0, target - runningTotal);
            if (remaining <= 0) break; // goal fully funded

            // Skip months before the goal's deadline (goal wasn't active)
            const firstOfMonth = `${month}-01`;
            if (plan.end_date < firstOfMonth) continue;

            // Use the first day of the following month as the reference point
            // (≈ end of the contribution month) when calculating months remaining.
            const [my, mm] = month.split("-").map(Number);
            let ny = my, nm = mm + 1;
            if (nm > 12) { nm = 1; ny++; }
            const refDate = `${ny}-${String(nm).padStart(2, "0")}-01`;

            const msLeft =
              new Date(plan.end_date + "T00:00:00") -
              new Date(refDate + "T00:00:00");
            const monthsLeft = Math.max(0, msLeft / 86400000) / 30.4375;

            let contribution;
            if (monthsLeft <= 0) {
              // Deadline falls within this contribution month — fund whatever's left.
              contribution = remaining;
            } else {
              const monthly = remaining / monthsLeft;
              contribution = Math.min(monthly, remaining);
            }

            if (contribution < 0.005) continue; // ignore rounding noise

            runningTotal += contribution;
            toInsert.push({ month, amount: contribution });

            if (monthsLeft <= 0) break; // goal finished after this month
          }

          if (toInsert.length === 0) continue;

          // Update the goal's current_saved to the new running total.
          await updatePlan(plan.id, { current_saved: runningTotal });

          // Record each contribution. ignoreDuplicates is a safety net in case
          // of a race condition (e.g. two tabs open); the unique constraint in
          // the DB is the authoritative idempotency guard.
          const { error: insertErr } = await supabase
            .from("goal_contributions")
            .upsert(
              toInsert.map(({ month, amount }) => ({
                user_id: user.id,
                goal_id: plan.id,
                contribution_month: month,
                amount,
              })),
              { onConflict: "user_id,goal_id,contribution_month", ignoreDuplicates: true }
            );

          if (insertErr) {
            console.error("[useGoalContributions] insert failed for plan", plan.id, insertErr.message);
          }
        }
      } catch (err) {
        console.error("[useGoalContributions]", err);
      }
    })();
  }, [user?.id, plans.length]); // eslint-disable-line react-hooks/exhaustive-deps
}
