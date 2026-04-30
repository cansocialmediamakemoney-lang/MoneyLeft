"use client";

import { useState } from "react";
import { fmt } from "@/lib/constants";
import { Btn } from "@/components/UI";

export default function MonthEndReview({ prevMonth, plans, onChoice, onUpdatePlan }) {
  const [screen, setScreen]   = useState("main"); // "main" | "savings" | "done"
  const [applying, setApplying] = useState(false);
  const [doneMsg, setDoneMsg] = useState("");

  const savingPlans = plans.filter(
    (p) => p.plan_type === "saving" &&
      (parseFloat(p.current_saved) || 0) < (parseFloat(p.amount) || 0)
  );

  const handleSavingsBtn = () => {
    if (savingPlans.length === 0) {
      setDoneMsg("Leftover added to your MoneyLeft savings. Set up a goal in the Plan tab to track it further.");
      setScreen("done");
      onChoice("savings", null); // null = no specific goal → general ml_savings
    } else {
      setScreen("savings");
    }
  };

  const applyToPlan = async (plan) => {
    setApplying(true);
    try {
      const room   = (parseFloat(plan.amount) || 0) - (parseFloat(plan.current_saved) || 0);
      const added  = Math.min(prevMonth.amount, room);
      const newVal = (parseFloat(plan.current_saved) || 0) + added;
      await onUpdatePlan(plan.id, { current_saved: newVal });
      setDoneMsg(`$${fmt(added)} added to "${plan.name}".`);
      setScreen("done");
      onChoice("savings", plan.id); // pass planId so caller knows it went to a goal
    } catch {
      setApplying(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.55)" }}
        onClick={() => onChoice("fresh")}
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl px-5 pt-6 pb-10 max-w-md mx-auto"
        style={{ background: "var(--bg-elevated)", borderTop: "1px solid var(--border-strong)" }}
      >
        {screen === "main" && (
          <>
            <p className="text-xs font-medium uppercase tracking-widest mb-2 text-center" style={{ color: "var(--text-tertiary)" }}>
              Month-End Review
            </p>
            <h2 className="text-2xl font-medium text-center mb-1" style={{ color: "var(--text-primary)" }}>
              You had{" "}
              <span style={{ color: "var(--accent-text)" }}>${fmt(prevMonth.amount)}</span>{" "}
              left
            </h2>
            <p className="text-base text-center mb-7" style={{ color: "var(--text-secondary)" }}>
              from {prevMonth.label}. What would you like to do with it?
            </p>

            <div className="space-y-3">
              <button
                onClick={handleSavingsBtn}
                className="w-full rounded-2xl px-4 py-4 text-left transition-colors hover:brightness-125 active:brightness-90"
                style={{ background: "var(--bg-elevated-2)", border: "1px solid var(--border-subtle)" }}
              >
                <p className="text-lg font-medium" style={{ color: "var(--accent-text)" }}>🏦 Add to Savings</p>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  Apply toward a savings goal
                </p>
              </button>

              <button
                onClick={() => onChoice("rollover")}
                className="w-full rounded-2xl px-4 py-4 text-left transition-colors hover:brightness-125 active:brightness-90"
                style={{ background: "var(--bg-elevated-2)", border: "1px solid var(--border-subtle)" }}
              >
                <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>➕ Roll Into This Month</p>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  Add the leftover to your available spending
                </p>
              </button>

              <button
                onClick={() => onChoice("fresh")}
                className="w-full rounded-2xl px-4 py-4 text-left transition-colors hover:brightness-125 active:brightness-90"
                style={{ background: "var(--bg-elevated-2)", border: "1px solid var(--border-subtle)" }}
              >
                <p className="text-lg font-medium" style={{ color: "var(--text-secondary)" }}>🔄 Start Fresh</p>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  Don't carry the leftover forward
                </p>
              </button>
            </div>
          </>
        )}

        {screen === "savings" && (
          <>
            <p className="text-xs font-medium uppercase tracking-widest mb-2 text-center" style={{ color: "var(--text-tertiary)" }}>
              Choose a Goal
            </p>
            <h2 className="text-xl font-medium text-center mb-5" style={{ color: "var(--text-primary)" }}>
              Apply{" "}
              <span style={{ color: "var(--accent-text)" }}>${fmt(prevMonth.amount)}</span>{" "}
              toward…
            </h2>

            <div className="space-y-3">
              {savingPlans.map((p) => {
                const room    = (parseFloat(p.amount) || 0) - (parseFloat(p.current_saved) || 0);
                const applies = Math.min(prevMonth.amount, room);
                return (
                  <button
                    key={p.id}
                    onClick={() => applyToPlan(p)}
                    disabled={applying}
                    className="w-full rounded-2xl px-4 py-4 text-left transition-colors hover:brightness-125 active:brightness-90 disabled:opacity-50"
                    style={{ background: "var(--bg-elevated-2)", border: "1px solid var(--border-subtle)" }}
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                      <p className="text-base font-semibold" style={{ color: "var(--accent-text)" }}>
                        +${fmt(applies)}
                      </p>
                    </div>
                    <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      ${fmt(parseFloat(p.current_saved) || 0)} → ${fmt((parseFloat(p.current_saved) || 0) + applies)} of ${fmt(p.amount)}
                    </p>
                  </button>
                );
              })}

              <button
                onClick={() => setScreen("main")}
                className="w-full text-center py-3 text-base"
                style={{ color: "var(--text-tertiary)" }}
              >
                ← Back
              </button>
            </div>
          </>
        )}

        {screen === "done" && (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-xl font-medium mb-6" style={{ color: "var(--text-primary)" }}>
              {doneMsg}
            </p>
            <Btn onClick={() => onChoice("savings")}>Done</Btn>
          </div>
        )}
      </div>
    </>
  );
}
