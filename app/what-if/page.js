"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { Btn, Card } from "@/components/UI";
import { useBudgetData } from "@/lib/useBudgetData";
import { fmt } from "@/lib/constants";

export default function SavingsPage() {
  const { loading, profile } = useBudgetData();
  const [extra, setExtra] = useState(0);

  if (loading) return (
    <AppShell><div className="p-10 text-center text-xl" style={{ color: "var(--text-tertiary)" }}>Loading…</div></AppShell>
  );

  const savingsGoal = parseFloat(profile?.savings_goal) || 0;
  const hasSavingsGoal = savingsGoal > 0;

  // Slider range scales with the user's actual savings goal (or income, falling back to a reasonable default).
  const income = parseFloat(profile?.income) || 0;
  const sliderMax = Math.max(500, Math.round((income > 0 ? income : savingsGoal) * 0.25));

  const newMonthly = savingsGoal + extra;
  const yearlyProjection = newMonthly * 12;
  const baselineYearly = savingsGoal * 12;
  const additionalYearly = extra * 12;

  return (
    <AppShell>
      <div className="px-5 pt-10 sm:pt-12 pb-10 max-w-md mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
          Savings
        </h1>

        {/* ── Empty state: no savings goal set ─────────────────────────────── */}
        {!hasSavingsGoal && (
          <>
            <Card className="text-center">
              <div className="text-5xl mb-4">🐷</div>
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                No savings goal yet
              </h2>
              <p className="text-base mb-6" style={{ color: "var(--text-secondary)" }}>
                Add a savings goal in your Budget to unlock projections and see how small changes can grow your money over time.
              </p>
              <Link href="/budget-edit"><Btn>Set a Savings Goal →</Btn></Link>
            </Card>
            <p className="text-center text-sm mt-6" style={{ color: "var(--text-tertiary)" }}>
              Your savings goal is the amount you put aside each month before deciding what's safe to spend.
            </p>
          </>
        )}

        {/* ── Main savings view ────────────────────────────────────────────── */}
        {hasSavingsGoal && (
          <>
            {/* Current savings goal — the focal "stat" card */}
            <div
              className="rounded-2xl p-7 sm:p-8 text-center mb-5 overflow-hidden"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--accent)",
              }}
            >
              <p
                className="text-xs sm:text-sm font-medium mb-2 uppercase tracking-widest"
                style={{ color: "var(--text-tertiary)" }}
              >
                Monthly Savings Goal
              </p>
              <p
                className="font-bold leading-none break-words text-[2.5rem] sm:text-6xl"
                style={{ color: "var(--accent-text)" }}
              >
                ${fmt(savingsGoal)}
              </p>
              <div
                className="mt-6 pt-4"
                style={{ borderTop: "1px solid var(--border-subtle)" }}
              >
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                  In 12 months, you'll save
                </p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 break-words" style={{ color: "var(--text-primary)" }}>
                  ${fmt(baselineYearly)}
                </p>
              </div>
            </div>

            {/* What If slider */}
            <Card className="mb-5">
              <h3 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                What if you saved more?
              </h3>
              <p className="text-base mb-5" style={{ color: "var(--text-secondary)" }}>
                Move the slider to see how an extra cushion would grow your savings.
              </p>

              <div className="text-center mb-3">
                <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
                  Save an extra
                </span>
                <div className="mt-1">
                  <span className="text-4xl font-bold break-words" style={{ color: "var(--accent-text)" }}>
                    ${fmt(extra)}
                  </span>
                  <span className="text-lg" style={{ color: "var(--text-tertiary)" }}> / month</span>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max={sliderMax}
                step="5"
                value={extra}
                onChange={(e) => setExtra(parseFloat(e.target.value))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "var(--accent)", background: "var(--bg-elevated-2)" }}
              />

              <div className="flex justify-between text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
                <span>$0</span>
                <span>${fmt(sliderMax)}</span>
              </div>
            </Card>

            {/* Result panel */}
            <div
              className="rounded-2xl p-6 mb-5 overflow-hidden"
              style={{
                background: extra > 0 ? "var(--accent-muted)" : "var(--bg-elevated)",
                border: `1px solid ${extra > 0 ? "var(--accent)" : "var(--border-subtle)"}`,
                transition: "background 0.2s, border-color 0.2s",
              }}
            >
              <p className="text-base mb-3" style={{ color: "var(--text-secondary)" }}>
                {extra > 0
                  ? <>Saving an extra <span className="font-bold" style={{ color: "var(--text-primary)" }}>${fmt(extra)}/month</span> would mean…</>
                  : "Move the slider above to project your savings."}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>
                    New monthly
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold break-words" style={{ color: "var(--text-primary)" }}>
                    ${fmt(newMonthly)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>
                    In 12 months
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold break-words" style={{ color: "var(--accent-text)" }}>
                    ${fmt(yearlyProjection)}
                  </p>
                </div>
              </div>

              {extra > 0 && (
                <div
                  className="mt-5 pt-4 text-center"
                  style={{ borderTop: "1px solid var(--border-subtle)" }}
                >
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    That's <span className="font-bold" style={{ color: "var(--accent-text)" }}>${fmt(additionalYearly)}</span> more than your current pace.
                  </p>
                </div>
              )}
            </div>

            {/* Edit budget link */}
            <Link href="/budget-edit" className="block">
              <div
                className="rounded-2xl p-5 flex items-center gap-4 transition-colors hover:brightness-125 active:brightness-90"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
              >
                <span className="text-3xl flex-shrink-0">📊</span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Edit Budget</p>
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Update your savings goal or income</p>
                </div>
                <span className="text-2xl flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>›</span>
              </div>
            </Link>

            <p className="text-center text-sm mt-6" style={{ color: "var(--text-tertiary)" }}>
              Projections assume you save the same amount every month. They don't account for interest or inflation.
            </p>
          </>
        )}
      </div>
    </AppShell>
  );
}