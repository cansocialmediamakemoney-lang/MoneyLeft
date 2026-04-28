"use client";

import { useState, useMemo } from "react";
import AppShell from "@/components/AppShell";
import { Card, MoneyInput, MoneyDisplay } from "@/components/UI";
import { fmt } from "@/lib/constants";

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

        {calc?.error && (
          <div
            className="rounded-2xl p-4 mb-5 text-center"
            style={{ background: "var(--warn-bg)", border: "1px solid var(--warn)", color: "var(--warn)" }}
          >
            ⚠️ {calc.error}
          </div>
        )}

        {calc && !calc.error && (
          <div
            className="rounded-2xl p-7 sm:p-8 text-center mb-5 overflow-hidden"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--accent)" }}
          >
            <p className="text-xs sm:text-sm font-medium mb-2 uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
              You can spend
            </p>
            <MoneyDisplay value={calc.perDay} color="var(--accent-text)" size="hero" />
            <p className="text-base sm:text-lg mt-2" style={{ color: "var(--text-secondary)" }}>
              per day for {calc.days} {calc.days === 1 ? "day" : "days"}
            </p>

            <div className="mt-6 pt-4 grid grid-cols-2 gap-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>Total</p>
                <MoneyDisplay value={calc.total} size="medium" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>Days</p>
                <p className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{calc.days}</p>
              </div>
            </div>
          </div>
        )}

        {!calc && (
          <p className="text-center text-base" style={{ color: "var(--text-tertiary)" }}>
            Enter an amount and dates to see your daily allowance.
          </p>
        )}

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-tertiary)" }}>
          Plan Mode is for one-time budgets — trips, projects, or any fixed spending window.
        </p>
      </div>
    </AppShell>
  );
}