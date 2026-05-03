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

export function useGoalContributions({ user, plans, updatePlan }) {
  const hasRun = useRef(false);
  const [debugLog, setDebugLog] = useState(null);

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
      const supabase = createClient();
      const results  = [];

      for (const plan of savingPlans) {
        const steps   = [];
        const log     = (s) => { steps.push(s); console.log(`[GC:${plan.name}]`, s); };
        const goalOut = () => ({ goalName: plan.name, goalId: plan.id, steps });

        log(`Starting. month=${month} refDate=${refDateStr}`);

        // ── 1. Check DB for existing contribution (DB is source of truth) ──
        const { data: existing, error: checkErr } = await supabase
          .from("goal_contributions")
          .select("*")           // select("*") is safe even if planned_current_saved column is absent
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
          log(`Contribution row found: amount=${existing.amount} planned_current_saved=${existing.planned_current_saved ?? "n/a"}`);

          // Stale-row recovery: if we stored planned_current_saved and the plan
          // hasn't reached it yet, the plans UPDATE never completed last time.
          const pcs = existing.planned_current_saved != null
            ? parseFloat(existing.planned_current_saved)
            : null;

          if (pcs !== null) {
            const { data: planNow } = await supabase
              .from("plans")
              .select("current_saved")
              .eq("id", plan.id)
              .single();
            const actualSaved = parseFloat(planNow?.current_saved) || 0;
            log(`plan.current_saved in DB = ${actualSaved}, planned = ${pcs}`);

            if (actualSaved < pcs) {
              log(`STALE ROW DETECTED (${actualSaved} < ${pcs}). Deleting so it can be retried.`);
              const { error: delErr } = await supabase
                .from("goal_contributions")
                .delete()
                .eq("id", existing.id);
              if (delErr) {
                log(`Delete stale row FAILED: ${delErr.message}. Cannot retry.`);
                results.push({ ...goalOut(), status: "stale-delete-failed" });
                continue;
              }
              log("Stale row deleted. Proceeding with fresh contribution.");
              // Fall through to apply
            } else {
              log(`Contribution confirmed applied (${actualSaved} >= ${pcs}). Skipping.`);
              results.push({ ...goalOut(), status: "already-applied", saved: actualSaved });
              continue;
            }
          } else {
            // planned_current_saved column not in DB yet — can't verify.
            // Trust the existing row to avoid infinite retries.
            log("planned_current_saved column absent — trusting existing row. Run schema migration.");
            results.push({ ...goalOut(), status: "already-applied-unverified" });
            continue;
          }
        } else {
          log("No existing contribution row. Proceeding.");
        }

        // ── 2. Fetch latest plan state from DB ───────────────────────────
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
        const goalAmount         = parseFloat(latest.amount)        || 0;
        const remaining          = Math.max(0, goalAmount - currentSavedBefore);

        log(`current_saved=${currentSavedBefore} goal=${goalAmount} remaining=${remaining}`);

        if (remaining <= 0) {
          log("Goal complete — skipping.");
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

        // ── 3. Insert contribution record ────────────────────────────────
        // Try with planned_current_saved first; fall back if column missing.
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

        if (insertErr && (insertErr.message?.includes("planned_current_saved") || insertErr.code === "PGRST204")) {
          log("planned_current_saved column missing — inserting without it (run schema migration).");
          ({ error: insertErr } = await supabase
            .from("goal_contributions")
            .insert({
              user_id: user.id,
              goal_id: plan.id,
              contribution_month: month,
              amount: contribution,
            }));
        }

        if (insertErr) {
          if (insertErr.code === "23505") {
            log("23505: race condition — another device already inserted. Skipping.");
          } else {
            log(`INSERT FAILED: ${insertErr.code} — ${insertErr.message}`);
          }
          results.push({ ...goalOut(), status: "insert-failed", code: insertErr.code });
          continue;
        }

        log(`INSERT succeeded. Calling updatePlan(current_saved → ${newSaved.toFixed(2)})...`);

        // ── 4. Update plan.current_saved ─────────────────────────────────
        try {
          await updatePlan(plan.id, { current_saved: newSaved });
          log(`updatePlan succeeded.`);

          // Verify the DB actually reflects the change
          const { data: verify, error: vErr } = await supabase
            .from("plans")
            .select("current_saved")
            .eq("id", plan.id)
            .single();

          const dbSaved = parseFloat(verify?.current_saved) || 0;
          const match   = Math.abs(dbSaved - newSaved) < 0.01;
          log(`DB verify: current_saved=${dbSaved} expected=${newSaved.toFixed(2)} ${match ? "✓ MATCH" : "✗ MISMATCH"}`);

          if (!match) {
            log(`MISMATCH: DB has ${dbSaved} but expected ${newSaved}. Rolling back contribution row.`);
            await supabase
              .from("goal_contributions")
              .delete()
              .eq("user_id", user.id)
              .eq("goal_id", plan.id)
              .eq("contribution_month", month);
            results.push({ ...goalOut(), status: "verify-mismatch", dbSaved, expected: newSaved });
          } else {
            results.push({ ...goalOut(), status: "success", before: currentSavedBefore, after: newSaved, dbVerified: dbSaved });
          }
        } catch (err) {
          log(`updatePlan FAILED: ${err?.message || String(err)}`);
          // Roll back contribution row so next session can retry
          const { error: rbErr } = await supabase
            .from("goal_contributions")
            .delete()
            .eq("user_id", user.id)
            .eq("goal_id", plan.id)
            .eq("contribution_month", month);
          log(rbErr ? `Rollback FAILED: ${rbErr.message}` : "Rollback succeeded.");
          results.push({ ...goalOut(), status: "update-failed", err: err?.message });
        }
      }

      setDebugLog(results);
    })();
  }, [user?.id, plans.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return { debugLog };
}
