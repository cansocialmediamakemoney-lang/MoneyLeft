"use client";

import { useMemo } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { Btn, Card, Row, MoneyDisplay, Hero } from "@/components/UI";
import { useBudgetData } from "@/lib/useBudgetData";
import { fmt, fmtDate, ordinal, MONTHS, SPEND_CATS, SPEND_ICONS } from "@/lib/constants";

export default function DashboardPage() {
  const { loading, error, profile, bills, entries, deleteEntry } = useBudgetData();

  const today = new Date();
  const dayOfMonth = today.getDate();
  const dim = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const calcs = useMemo(() => {
    if (!profile) return null;
    const income = parseFloat(profile.income) || 0;
    const savingsGoal = parseFloat(profile.savings_goal) || 0;
    const totalBills = bills.reduce((s,b) => s + (parseFloat(b.amount) || 0), 0);
    const totalSpent = entries.reduce((s,e) => s + (parseFloat(e.amount) || 0), 0);
    const moneyLeft = income - savingsGoal - totalBills - totalSpent;

    const payDate = parseInt(profile.pay_date) || 1;
    let daysLeft = payDate > dayOfMonth ? payDate - dayOfMonth : (dim - dayOfMonth) + payDate;
    if (daysLeft < 1) daysLeft = 1;
    const safePerDay = moneyLeft > 0 ? moneyLeft / daysLeft : 0;

    const upcoming = bills.filter((b) => {
      const d = parseInt(b.due_day) || 1;
      return d >= dayOfMonth && d <= dayOfMonth + 7;
    });
    const upcomingTotal = upcoming.reduce((s,b) => s + (parseFloat(b.amount) || 0), 0);

    const byCategory = SPEND_CATS.reduce((acc, c) => {
      acc[c] = entries.filter((e) => e.category === c).reduce((s,e) => s + (parseFloat(e.amount) || 0), 0);
      return acc;
    }, {});

    return { income, savingsGoal, totalBills, totalSpent, moneyLeft, daysLeft, safePerDay, upcoming, upcomingTotal, byCategory };
  }, [profile, bills, entries, dayOfMonth, dim]);

  if (loading) return (
    <AppShell><div className="p-10 text-center text-xl" style={{ color: "var(--text-tertiary)" }}>Loading your dashboard…</div></AppShell>
  );

  if (!profile || !parseFloat(profile.income)) {
    return (
      <AppShell>
        <div className="px-5 pt-12">
          <Card className="text-center">
            <div className="text-6xl mb-4">👋</div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Let's set up your budget</h2>
            <p className="text-lg mb-6" style={{ color: "var(--text-secondary)" }}>Tell MoneyLeft about your income, bills, and savings goal so we can show you exactly how much you can safely spend.</p>
            <Link href="/budget-edit"><Btn>Set Up My Budget →</Btn></Link>
          </Card>
        </div>
      </AppShell>
    );
  }

  const c = calcs;
  const pos = c.moneyLeft >= 0;
  const nearLimit = c.moneyLeft > 0 && c.moneyLeft < c.income * 0.1;

  return (
    <AppShell>
      {/* Hero — Money Left */}
      <div className="px-4 pt-10 sm:pt-12 pb-2">
        <Hero
          label={`${MONTHS[today.getMonth()]} ${today.getFullYear()} · Money Left`}
          accent={pos ? "green" : "danger"}
          support={
            pos
              ? <>You can spend <span className="font-bold" style={{ color: "var(--text-primary)" }}>${fmt(c.safePerDay)}/day</span> for the rest of the month</>
              : "You're over budget this month"
          }
          footer={
            <div className="grid grid-cols-3 gap-3">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm mb-1" style={{ color: "var(--text-tertiary)" }}>Safe / day</p>
                <MoneyDisplay value={c.safePerDay} size="medium" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm mb-1" style={{ color: "var(--text-tertiary)" }}>Days left</p>
                <p className="font-bold text-lg sm:text-2xl" style={{ color: "var(--text-primary)" }}>{c.daysLeft}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm mb-1" style={{ color: "var(--text-tertiary)" }}>Bills due</p>
                <MoneyDisplay
                  value={c.upcomingTotal}
                  size="medium"
                  color={c.upcoming.length > 0 ? "var(--warn)" : "var(--text-primary)"}
                />
              </div>
            </div>
          }
        >
          <MoneyDisplay
            value={c.moneyLeft}
            negative={!pos}
            color={pos ? "var(--accent-text)" : "var(--danger)"}
            size="hero"
          />
        </Hero>
      </div>

      {error && (
        <div className="mx-4 mt-3 rounded-2xl p-4" style={{ background: "var(--danger-bg)", border: "1px solid var(--danger)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      <div className="mt-5">
        {/* Bill warnings */}
        {c.upcoming.map((b) => (
          <div
            key={b.id}
            className="mx-4 mb-3 rounded-2xl px-4 sm:px-5 py-4 flex justify-between items-center gap-3"
            style={{ background: "var(--warn-bg)", border: "1px solid var(--warn)" }}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-2xl flex-shrink-0">⚠️</span>
              <div className="min-w-0 flex-1">
                <p className="text-base sm:text-lg font-bold break-words" style={{ color: "var(--warn)" }}>{b.name} due soon</p>
                <p className="text-sm sm:text-base" style={{ color: "var(--text-secondary)" }}>Due on the {ordinal(b.due_day)}</p>
              </div>
            </div>
            <p className="text-lg sm:text-xl font-bold break-words flex-shrink-0" style={{ color: "var(--warn)" }}>${fmt(b.amount)}</p>
          </div>
        ))}

        {nearLimit && (
          <div
            className="mx-4 mb-3 rounded-2xl px-5 py-4 text-center"
            style={{ background: "var(--warn-bg)", border: "1px solid var(--warn)" }}
          >
            <p className="text-xl font-bold" style={{ color: "var(--warn)" }}>⚠️ You're close to your limit!</p>
            <p className="text-lg mt-1" style={{ color: "var(--text-secondary)" }}>Only ${fmt(c.moneyLeft)} left. Try to keep spending under ${fmt(c.safePerDay)}/day.</p>
          </div>
        )}

        {/* Primary action */}
        <div className="mx-4 space-y-3 mb-5">
          <Link href="/spending" className="block"><Btn>➕ Log a Purchase</Btn></Link>
          <Link href="/bills" className="block"><Btn variant="secondary">📋 My Bills</Btn></Link>
        </div>

        {/* Secondary content */}
        <Card className="mx-4 mb-4">
          <h3 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>How It's Calculated</h3>
          <div className="space-y-3">
            <Row label="💵 Monthly Income" val={`$${fmt(c.income)}`} />
            <Row label="🏦 Savings Goal" val={`−$${fmt(c.savingsGoal)}`} red />
            <Row label="📋 Fixed Bills" val={`−$${fmt(c.totalBills)}`} red />
            <Row label="🛒 Spent So Far" val={`−$${fmt(c.totalSpent)}`} red />
            <div className="pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <Row label="Money Left" val={`${pos ? "" : "−"}$${fmt(c.moneyLeft)}`} bold large green={pos} red={!pos} />
            </div>
          </div>
        </Card>

        {c.totalSpent > 0 && (
          <Card className="mx-4 mb-4">
            <h3 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Spending This Month</h3>
            {SPEND_CATS.map((cat) => {
              const amt = c.byCategory[cat];
              if (!amt) return null;
              return (
                <div key={cat} className="flex justify-between items-center mb-3 last:mb-0 gap-3">
                  <span className="text-base sm:text-lg min-w-0 break-words" style={{ color: "var(--text-secondary)" }}>{SPEND_ICONS[cat]} {cat}</span>
                  <span className="text-lg sm:text-xl font-bold flex-shrink-0 break-words" style={{ color: "var(--text-primary)" }}>${fmt(amt)}</span>
                </div>
              );
            })}
          </Card>
        )}

        {entries.length > 0 && (
          <Card className="mx-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Recent Purchases</h3>
              <Link href="/history" className="text-base font-semibold" style={{ color: "var(--accent-text)" }}>See all →</Link>
            </div>
            {entries.slice(0,4).map((e) => (
              <div key={e.id} className="flex items-center justify-between py