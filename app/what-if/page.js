"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { Btn, Card, MoneyDisplay, Hero } from "@/components/UI";
import { useBudgetData } from "@/lib/useBudgetData";
import { usePlans } from "@/lib/usePlans";
import { fmt } from "@/lib/constants";

export default function SavingsPage() {
  const { loading, profile } = useBudgetData();
  const { loading: plansLoading, plans } = usePlans();
  const [extra, setExtra] = useState(0);

  if (loading || plansLoading) return (
    <AppShell><div className="p-10 text-center text-xl" style={{ color: "var(--text-tertiary)" }}>Loading…</div></AppShell>
  );

  const startingSavings  = parseFloat(profile?.starting_savings) || 0;
  const mlSavings        = parseFloat(profile?.ml_savings) || 0;
  const totalSavings     = startingSavings + mlSavings;
  const hasAnySavings    = totalSavings > 0;

  const savingsGoal      = parseFloat(profile?.savings_goal) || 0;
  const hasSavingsGoal   = savingsGoal > 0;
  const income           = parseFloat(profile?.income) || 0;
  const sliderMax        = Math.max(500, Math.round((income > 0 ? income : savingsGoal) * 0.25));

  const newMonthly       = savingsGoal + extra;
  const yearlyProjection = newMonthly * 12;
  const additionalYearly = extra * 12;

  const todayStr = new Date().toISOString().split("T")[0];
  const activeSavingPlans = plans.filter(
    (p) => p.plan_type === "saving" &&
      p.end_date > todayStr &&
      (parseFloat(p.current_saved) || 0) < (parseFloat(p.amount) || 0)
  );

  return (
    <AppShell>
      <div className="px-5 pt-10 sm:pt-12 pb-10 max-w-md mx-auto">
        <h1 className="text-3xl sm:text-4xl font-medium mb-6" style={{ color: "var(--text-primary)" }}>
          Savings
        </h1>

        {/* ── Hero: Total Savings ── */}
        <div className="-mx-1 mb-5">
          <Hero
            label="Total Savings"
            accent={hasAnySavings ? "green" : "muted"}
            support={
              hasAnySavings ? (
                <span>
                  {startingSavings > 0 && (
                    <>Started with <span className="font-medium" style={{ color: "var(--text-primary)" }}>${fmt(startingSavings)}</span></>
                  )}
                  {startingSavings > 0 && mlSavings > 0 && "  ·  "}
                  {mlSavings > 0 && (
                    <>Saved through MoneyLeft <span className="font-medium" style={{ color: "var(--accent-text)" }}>${fmt(mlSavings)}</span></>
                  )}
                </span>
              ) : undefined
            }
          >
            {hasAnySavings ? (
              <MoneyDisplay value={totalSavings} color="var(--accent-text)" size="hero" />
            ) : (
              <p className="text-[3rem] sm:text-6xl font-semibold" style={{ color: "var(--text-tertiary)" }}>—</p>
            )}
          </Hero>
        </div>

        {/* Empty state */}
        {!hasAnySavings && (
          <Card className="text-center mb-5">
            <div className="text-4xl mb-3">🐷</div>
            <h2 className="text-xl font-medium mb-2" style={{ color: "var(--text-primary)" }}>No savings logged yet</h2>
            <p className="text-base mb-5" style={{ color: "var(--text-secondary)" }}>
              Add your current savings in Budget Setup, or apply leftover money at the end of the month to start tracking progress.
            </p>
            <Link href="/budget-edit"><Btn>Edit Budget →</Btn></Link>
          </Card>
        )}

        {/* ── 12-month projection + slider ── */}
        {hasSavingsGoal && (
          <>
            <div className="-mx-1 mb-5">
              <Hero
                label="12-month projection"
                accent="green"
                support={
                  extra > 0
                    ? <>if you save <span className="font-medium" style={{ color: "var(--text-primary)" }}>${fmt(extra)}/month</span> extra</>
                    : "based on your current savings goal"
                }
                footer={
                  <div className="grid grid-cols-2 gap-4">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>Monthly</p>
                      <MoneyDisplay value={newMonthly} size="medium" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>
                        {extra > 0 ? "Extra / year" : "Goal"}
                      </p>
                      {extra > 0
                        ? <MoneyDisplay value={additionalYearly} size="medium" color="var(--accent-text)" />
                        : <MoneyDisplay value={savingsGoal} size="medium" />
                      }
                    </div>
                  </div>
                }
              >
                <MoneyDisplay value={yearlyProjection} color="var(--accent-text)" size="hero" />
              </Hero>
            </div>

            <Card className="mb-5">
              <h3 className="text-xl font-medium mb-1" style={{ color: "var(--text-primary)" }}>What if you saved more?</h3>
              <p className="text-base mb-5" style={{ color: "var(--text-secondary)" }}>Move the slider to see how saving extra each month grows your savings.</p>

              <div className="text-center mb-3">
                <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>Save an extra</span>
                <div className="mt-1">
                  <MoneyDisplay value={extra} color="var(--accent-text)" size="large" />
                  <span className="text-lg ml-2" style={{ color: "var(--text-tertiary)" }}>/ month</span>
                </div>
              </div>

              <input
                type="range" min="0" max={sliderMax} step="5"
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
          </>
        )}

        {/* ── Active Savings Goals ── */}
        {activeSavingPlans.length > 0 && (
          <Card className="mb-5">
            <h3 className="text-xl font-medium mb-4" style={{ color: "var(--text-primary)" }}>Savings Goals</h3>
            <div className="space-y-5">
              {activeSavingPlans.map((p) => {
                const saved  = parseFloat(p.current_saved) || 0;
                const target = parseFloat(p.amount) || 0;
                const pct    = target > 0 ? Math.min(1, saved / target) : 0;
                return (
                  <div key={p.id}>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-base font-medium" style={{ color: "var(--text-primary)" }}>{p.name}</span>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        ${fmt(saved)} <span style={{ color: "var(--text-tertiary)" }}>/ ${fmt(target)}</span>
                      </span>
                    </div>
                    <div className="rounded-full overflow-hidden" style={{ height: "5px", background: "var(--bg-elevated-2)" }}>
                      <div
                        className="rounded-full h-full transition-all"
                        style={{ width: `${Math.round(pct * 100)}%`, background: "var(--accent-text)" }}
                      />
                    </div>
                    <p className="text-xs mt-1.5" style={{ color: "var(--text-tertiary)" }}>
                      {Math.round(pct * 100)}% complete
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ── Edit Budget link ── */}
        <Link href="/budget-edit" className="block mb-5">
          <div
            className="rounded-2xl p-5 flex items-center gap-4 transition-colors hover:brightness-125 active:brightness-90"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <span className="text-3xl flex-shrink-0">📊</span>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>Edit Budget</p>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Update savings goal or starting savings</p>
            </div>
            <span className="text-2xl flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>›</span>
          </div>
        </Link>

        {hasSavingsGoal && (
          <p className="text-center text-sm" style={{ color: "var(--text-tertiary)", opacity: 0.7 }}>
            Projections assume equal monthly savings and don't account for interest or inflation.
          </p>
        )}
      </div>
    </AppShell>
  );
}
