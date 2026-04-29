"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { Btn, Card, MoneyDisplay, Hero } from "@/components/UI";
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
  const income = parseFloat(profile?.income) || 0;
  const sliderMax = Math.max(500, Math.round((income > 0 ? income : savingsGoal) * 0.25));

  const newMonthly = savingsGoal + extra;
  const yearlyProjection = newMonthly * 12;
  const additionalYearly = extra * 12;

  return (
    <AppShell>
      <div className="px-5 pt-10 sm:pt-12 pb-10 max-w-md mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
          Savings
        </h1>

        {/* Empty state */}
        {!hasSavingsGoal && (
          <>
            <div className="-mx-1 mb-5">
              <Hero
                label="Savings projection"
                accent="muted"
                support="Add a savings goal in your Budget tab to unlock projections"
              >
                <p className="text-[3rem] sm:text-6xl font-bold" style={{ color: "var(--text-tertiary)" }}>—</p>
              </Hero>
            </div>
            <Card className="text-center">
              <div className="text-5xl mb-4">🐷</div>
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>No savings goal yet</h2>
              <p className="text-base mb-6" style={{ color: "var(--text-secondary)" }}>
                Your savings goal is the amount you set aside each month before deciding what's safe to spend.
              </p>
              <Link href="/budget-edit"><Btn>Set a Savings Goal →</Btn></Link>
            </Card>
          </>
        )}

        {/* Hero + interactive view */}
        {hasSavingsGoal && (
          <>
            <div className="-mx-1 mb-5">
              <Hero
                label="Savings projection"
                accent="green"
                support={
                  extra > 0
                    ? <>in 12 months if you save <span className="font-bold" style={{ color: "var(--text-primary)" }}>${fmt(extra)}/month</span> extra</>
                    : "in 12 months based on your current savings goal"
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

            {/* Slider card below */}
            <Card className="mb-5">
              <h3 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>What if you saved more?</h3>
              <p className="text-base mb-5" style={{ color: "var(--text-secondary)" }}>Move the slider to see how an extra cushion would grow your savings.</p>

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