"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { currentMonthKey } from "@/lib/constants";

function todayLocalStr() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
}

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
 * Returns:
 *   appliedGoalIds — Set<string> of plan IDs whose current-month contribution
 *                    is confirmed in goal_contributions. The dashboard excludes
 *                    these from planSavingsMonthly so the deduction disappears
 *                    once the contribution is recorded in the DB.
 *   debugLog       — trace of every step, rendered in the dashboard debug panel.
 */
export function useGoalContributions({ user, plans, updatePlan }) {
  const hasRun  = useRef(false);
  const [debugLog,       setDebugLog]       = useState(null);
  const [appliedGoalIds, setAppliedGoalIds] = useState(new Set());

  // ── Phase 1: load which goals already have contributions this month ──────
  // Runs as soon as user.id is available (independently of plans loading).
  // This populates appliedGoalIds immediately on refresh / second-device load
  // so the dashboard never briefly shows a deduction for an already-applied goal.
  useEffect(() => {
    if (!user?.id) return;
    createClient()
      .from("goal_contributions")
      .select("goal_id")
      .eq("user_id", user.id)
      .eq("contribution_month", currentMonthKey())
      .then(({ data, error }) => {
        if (!error && data?.length) {
          setAppliedGoalIds(new Set(data.map((r) => r.goal_id)));
        }
      });
  }, [user?.id]);

  // ── Phase 2: apply contributions for goals that don't have them yet ──────
  useEffect(() => {
    if (hasRun.current) return;
    if (!user?.id) return;

    const savingPlans = plans.filter((p) => p.plan_type === "saving");

    if (savingPlans.length === 0) {
      setDebugLog([{ type: "info", msg: "No saving goals found in plans list." }]);
      return;
    }

    hasRun.current = true;

    const month      = currentMonthKey();
    const refDateStr = todayLocalStr();

    (async () => {
      const supabase     = createClient();
      const results      = [];
      const newlyApplied = []; // goal IDs confirmed applied this session

      for (const plan of savingPlans) {
        const steps   = [];
        const log     = (s) => { steps.push(s); console.log(`[GC:${plan.name}]`, s); };
        const goalOut = () => ({ goalName: plan.name, goalId: plan.id, steps });

        log(`Starting. month=${month} refDate=${refDateStr}`);

        // ── 1. Check DB for existing contribution row ───────────────────
        const { data: existing, error: checkErr } = await supabase
          .from("goal_contributions")
          .select("*")
          .eq("user_id", user.id)
          .eq("goal_id", plan.id)
          .eq("contribution_month", month)
          .maybeSingle();

        if (checkErr) {
          log(`DB check FAILED: ${checkErr.code} — ${checkErr.message}`);
          results.push({ ...goalOut(), status: "check-error" });
          continue;
        }

        if (existing) {
          log(`Row found: amount=${existing.amount} planned_current_saved=${existing.planned_current_saved ?? "n/a"}`);

          const pcs = existing.planned_current_saved != null
            ? parseFloat(existing.planned_current_saved)
            : null;

          if (pcs !== null) {
            const { data: planNow } = await supabase
              .from("plans").select("current_saved").eq("id", plan.id).single();
            const actualSaved = parseFloat(planNow?.current_saved) || 0;
            log(`plan.current_saved=${actualSaved} planned=${pcs}`);

            if (actualSaved < pcs) {
              log(`STALE ROW (${actualSaved} < ${pcs}). Deleting for retry.`);
              const { error: delErr } = await supabase
                .from("goal_contributions").delete().eq("id", existing.id);
              if (delErr) {
                log(`Delete FAILED: ${delErr.message}`);
                results.push({ ...goalOut(), status: "stale-delete-failed" });
                continue;
              }
              log("Stale row deleted. Proceeding.");
              // fall through to apply
            } else {
              log(`Confirmed applied (${actualSaved} >= ${pcs}). Marking done.`);
              newlyApplied.push(plan.id);
              results.push({ ...goalOut(), status: "already-applied", saved: actualSaved });
              continue;
            }
          } else {
            log("planned_current_saved absent — trusting row. Run schema migration.");
            newlyApplied.push(plan.id);
            results.push({ ...goalOut(), status: "already-applied-unverified" });
            continue;
          }
        } else {
          log("No existing row. Proceeding.");
        }

        // ── 2. Fetch latest plan state ──────────────────────────────────
        const { data: latest, error: fetchErr } = await supabase
          .from("plans")
          .select("current_saved, amount, end_date")
          .eq("id", plan.id)
          .single();

        if (fetchErr || !latest) {
          log(`Plan fetch FAILED: ${fetchErr?.message}`);
          results.push({ ...goalOut(), status: "fetch-failed" });
          continue;
        }

        const currentSavedBefore = parseFloat(latest.current_saved) || 0;
        const remaining = Math.max(0, (parseFloat(latest.amount) || 0) - currentSavedBefore);
        log(`current_saved=${currentSavedBefore} amount=${latest.amount} remaining=${remaining}`);

        if (remaining <= 0) {
          log("Goal complete — skipping.");
          newlyApplied.push(plan.id);
          results.push({ ...goalOut(), status: "complete" });
          continue;
        }

        const monthly      = monthlyForGoal({ ...plan, ...latest }, refDateStr);
        const contribution = Math.min(monthly, remaining);
        log(`monthly=${monthly.toFixed(2)} contribution=${contribution.toFixed(2)}`);

        if (contribution < 0.005) {
          log("Contribution too small — skipping.");
          results.push({ ...goalOut(), status: "too-small" });
          continue;
        }

        const newSaved = currentSavedBefore + contribution;

        // ── 3. Insert contribution record ───────────────────────────────
        let insertErr;
        ({ error: insertErr } = await supabase
          .from("goal_contributions")
          .insert({
            user_id: user.id,
            goal_id: plan.id,
            contribution_month: month,
            amount: contribution,
            planned_current_saved: newSaved,
          }));

        if (insertErr?.message?.includes("planned_current_saved") || insertErr?.code === "PGRST204") {
          log("planned_current_saved column missing — inserting without it.");
          ({ error: insertErr } = await supabase
            .from("goal_contributions")
            .insert({ user_id: user.id, goal_id: plan.id, contribution_month: month, amount: contribution }));
        }

        if (insertErr) {
          if (insertErr.code === "23505") {
            log("23505 race — another device inserted first.");
            newlyApplied.push(plan.id);
          } else {
            log(`INSERT FAILED: ${insertErr.code} — ${insertErr.message}`);
          }
          results.push({ ...goalOut(), status: "insert-failed", code: insertErr.code });
          continue;
        }
        log("INSERT succeeded.");

        // ── 4. Update plan.current_saved ────────────────────────────────
        try {
          await updatePlan(plan.id, { current_saved: newSaved });
          log(`updatePlan succeeded → ${newSaved.toFixed(2)}`);

          const { data: verify } = await supabase
            .from("plans").select("current_saved").eq("id", plan.id).single();
          const dbSaved = parseFloat(verify?.current_saved) || 0;
          const match   = Math.abs(dbSaved - newSaved) < 0.01;
          log(`DB verify: ${dbSaved} expected ${newSaved.toFixed(2)} ${match ? "✓ MATCH" : "✗ MISMATCH"}`);

          if (!match) {
            log("MISMATCH — rolling back contribution row.");
            await supabase.from("goal_contributions").delete()
              .eq("user_id", user.id).eq("goal_id", plan.id).eq("contribution_month", month);
            results.push({ ...goalOut(), status: "verify-mismatch", dbSaved, expected: newSaved });
          } else {
            newlyApplied.push(plan.id);
            results.push({ ...goalOut(), status: "success", before: currentSavedBefore, after: newSaved, dbVerified: dbSaved });
          }
        } catch (err) {
          log(`updatePlan FAILED: ${err?.message || String(err)}`);
          const { error: rbErr } = await supabase.from("goal_contributions").delete()
            .eq("user_id", user.id).eq("goal_id", plan.id).eq("contribution_month", month);
          log(rbErr ? `Rollback FAILED: ${rbErr.message}` : "Rollback succeeded.");
          results.push({ ...goalOut(), status: "update-failed", err: err?.message });
        }
      }

      // Merge newly confirmed IDs into appliedGoalIds
      if (newlyApplied.length > 0) {
        setAppliedGoalIds((prev) => {
          const next = new Set(prev);
          newlyApplied.forEach((id) => next.add(id));
          return next;
        });
      }

      setDebugLog(results);
    })();
  }, [user?.id, plans.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return { debugLog, appliedGoalIds };
}
