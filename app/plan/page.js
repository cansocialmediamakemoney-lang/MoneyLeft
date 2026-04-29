"use client";

import { useState, useMemo } from "react";
import AppShell from "@/components/AppShell";
import { Card, MoneyInput, MoneyDisplay, Hero } from "@/components/UI";
import { fmt, fmtDate } from "@/lib/constants";

function todayLocal() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
}

function daysFromToday(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
}

export default function PlanPage() {
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState(todayLocal());
  const [endDate, setEndDate] = useState(daysFromToday(14));

  const calc = useMemo(() => {
    const total = parseFloat(amount) || 0;
    if (!startDate || !endDate || total <= 0) return null;

    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");

    if (isNaN(start) || isNaN(end)) return null;
    if (end < start) return { error: "End date must be after start date." };

    const ms = end - start;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
    if (days < 1) return { error: "Pick at least one day." };

    const perDay = total / days;
    return { days, perDay, total };
  }, [amount, startDate, endDate]);

  return (
    <AppShell>
      <div className="px-5 pt-10 sm:pt-12 pb-10 max-w-md mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
          Plan
        </h1>

        {/* Hero — daily allowance */}
        <div className="-mx-1 mb-5">
          {calc?.error ? (
            <Hero
              label="Plan your money"
              accent="warn"
              support={calc.error}
            >
              <p className="text-3xl sm:text-4xl font-bold" style={{ color: "var(--warn)" }}>—</p>
            </Hero>
          ) : calc ? (
            <Hero
              label="Plan your money"
              accent="green"
              support={
                <>Based on <span className="font-bold" style={{ color: "var(--text-primary)" }}>${fmt(calc.total)}</span> from {fmtDate(startDate)} to {fmtDate(endDate)}</>
              }
              footer={
                <div className="grid grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>Total</p>
                    <MoneyDisplay value={calc.total} size="medium" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>Days</p>
                    <p className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{calc.days}</p>
                  </div>
                </div>
              }
            >
              <MoneyDisplay value={calc.perDay} color="var(--accent-text)" size="hero" />
              <span className="text-2xl sm:text-3xl font-bold ml-1" style={{ color: "var(--text-secondary)" }}>/day</span>
            </Hero>
          ) : (
            <Hero
              label="Plan your money"
              accent="muted"
              support="Enter an amount and dates below to see your daily allowance"
            >
              <p className="text-[3rem] sm:text-6xl font-bold" style={{ color: "var(--text-tertiary)" }}>—</p>
            </Hero>
          )}
        </div>

        {/* Inputs below */}
        <Card className="mb-5">
          <p className="text-base sm:text-lg mb-5" style={{ color: "var(--text-secondary)" }}>
            Got a fixed amount of money for a trip, project, or stretch of time? Plan Mode tells you exactly what you can spend each day to make it last.
          </p>

          <div className="space-y-5">
            <MoneyInput
              value={amount}
              onChange={setAmount}
              label="Total amount of money"
              hint="The full amount you have to spend during this period."
              large
            />

            <div className="min-w-0">
              <p className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Start date</p>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-2xl border-2 px-4 py-3 text-xl"
              />
            </div>

            <div className="min-w-0">
              <p className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>End date</p>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-2xl border-2 px-4 py-3 text-xl"
              />
            </div>
          </div>
        </Card>

        <p className="text-center text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
          Plan Mode is for one-time budgets — trips, projects, or any fixed spending window.
        </p>
      </div>
    </AppShell>
  );
}