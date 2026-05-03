"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { currentMonthKey } from "@/lib/constants";

// Today's local date as YYYY-MM-DD — mirrors the dashboard's todayStr formula so
// the contribution amount matches exactly what planSavingsMonthly deducts.
function todayLocalStr() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
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
 * Applies the current month's savings contribution to each active savings goal
 * on dashboard load — if it hasn't been applied yet this month.
 *
 * Duplicate-prevention: the goal_contributions table has a UNIQUE constraint on
 * (user_id, goal_id, contribution_month). We SELECT first to check — the DB is
 * always the source of truth, not localStorage. localStorage is only written
 * after both the DB insert AND the plan update are confirmed.
 */
export function useGoalContributions({ user, plans, updatePlan }) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    if (!user?.id) return;

    const savingPlans = plans.filter((p) => p.plan_type === "saving");
    if (savingPlans.length === 0) return;

    hasRun.current = true;

    const month      = currentMonthKey();
    const refDateStr = todayLocalStr();

    (async () => {
      const supabase = createClient();

      for (const plan of savingPlans) {
        // ── Step 1: Check DB directly — localStorage may be stale ──────────
        // We do NOT check localStorage first. If a previous session inserted
        // the contribution record but failed to update current_saved, localStorage
        // would block all future attempts. The DB record is the only trusted gate.
        const { data: existing, error: checkErr } = await supabase
          .from("goal_contributions")
          .select("id")
          .eq("user_id", user.id)
          .eq("goal_id", plan.id)
          .eq("contribution_month", month)
          .maybeSingle();

        if (checkErr) {
          console.warn("[GoalContributions] DB check failed for", plan.name, checkErr.message);
          continue;
        }

        if (existing) {
          // Contribution record exists — trust DB, sync localStorage
          console.log("[GoalContributions] already applied for", plan.name, month);
          localStorage.setItem(lsKey(plan.id, month), "1");
          continue;
        }

        // ── Step 2: Fetch latest plan state ──────────────────────────────
        const { data: latest, error: fetchErr } = await supabase
          .from("plans")
          .select("current_saved, amount, end_date")
          .eq("id", plan.id)
          .single();

        if (fetchErr || !latest) {
          console.warn("[GoalContributions] plan fetch failed for", plan.id, fetchErr?.message);
          continue;
        }

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

        console.log(
          "[GoalContributions] applying", plan.name,
          "| id:", plan.id,
          "| current_saved before:", latest.current_saved,
          "| contribution:", contribution,
          "| month:", month
        );

        // ── Step 3: Insert contribution record (idempotency lock) ────────
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
            // Race: another device inserted between our SELECT and this INSERT
            console.log("[GoalContributions] race-condition 23505 for", plan.name, "— skipping");
            localStorage.setItem(lsKey(plan.id, month), "1");
          } else {
            console.error("[GoalContributions] INSERT failed for", plan.name, insertErr.code, insertErr.message);
          }
          continue;
        }

        // ── Step 4: Update current_saved ─────────────────────────────────
        const newSaved = (parseFloat(latest.current_saved) || 0) + contribution;
        try {
          await updatePlan(plan.id, { current_saved: newSaved });
          localStorage.setItem(lsKey(plan.id, month), "1");
          console.log("[GoalContributions] success for", plan.name, "| current_saved now:", newSaved);
        } catch (err) {
          // updatePlan threw — DB update did not complete. Roll back the
          // contribution record so the next session retries cleanly.
          console.error("[GoalContributions] updatePlan failed for", plan.name, err?.message || err);
          const { error: rbErr } = await supabase
            .from("goal_contributions")
            .delete()
            .eq("user_id", user.id)
            .eq("goal_id", plan.id)
            .eq("contribution_month", month);
          if (rbErr) {
            console.error("[GoalContributions] rollback also failed for", plan.name, rbErr.message);
          } else {
            console.log("[GoalContributions] rolled back contribution for", plan.name);
          }
          // Do NOT set localStorage — next session must retry
        }
      }
    })();
  }, [user?.id, plans.length]); // eslint-disable-line react-hooks/exhaustive-deps
}
