"use client";

import { useMemo } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { Btn, Card, Row } from "@/components/UI";
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
      <AppShell subtitle="Welcome!">
        <div className="px-5 pt-6">
          <Card className="text-center">
            <div className="text-6xl mb-4">👋</div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Let's set up your budget</h2>
            <p className="text-lg mb-6" style={{ color: "var(--text-secondary)" }}>Tell MoneyLeft about your income, bills, and savings goal so we can show you exactly how much you can safely spend.</p>
            <Link href="/settings"><Btn>Set Up My Budget →</Btn></Link>
          </Card>
        </div>
      </AppShell>
    );
  }

  const c = calcs;
  const pos = c.moneyLeft >= 0;
  const nearLimit = c.moneyLeft > 0 && c.moneyLeft < c.income * 0.1;

  return (
    <AppShell subtitle={`${MONTHS[today.getMonth()]} ${today.getFullYear()}`}>
      {error && (
        <div className="mx-4 mt-4 rounded-2xl p-4" style={{ background: "var(--danger-bg)", border: "1px solid var(--danger)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {/* Big answer */}
      <div
        className="mx-4 mt-4 rounded-2xl p-6 sm:p-8 text-center mb-5 overflow-hidden"
        style={{
          background: "var(--bg-elevated)",
          border: `1px solid ${pos ? "var(--accent)" : "var(--danger)"}`,
        }}
      >
        <p className="text-base sm:text-lg font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
          Money left this month
        </p>
        <p
          className="font-bold leading-none break-words text-[2.75rem] sm:text-6xl"
          style={{ color: pos ? "var(--accent-text)" : "var(--danger)" }}
        >
          {pos ? "" : "−"}${fmt(c.moneyLeft)}
        </p>
        <div
          className="mt-6 pt-5 grid grid-cols-3 gap-3"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <div className="min-w-0">
            <p className="text-xs sm:text-sm mb-1" style={{ color: "var(--text-tertiary)" }}>Safe to spend</p>
            <p className="font-bold break-words text-lg sm:text-2xl" style={{ color: "var(--text-primary)" }}>${fmt(c.safePerDay)}</p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>per day</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm mb-1" style={{ color: "var(--text-tertiary)" }}>Days to pay day</p>
            <p className="font-bold text-lg sm:text-2xl" style={{ color: "var(--text-primary)" }}>{c.daysLeft}</p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>days left</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm mb-1" style={{ color: "var(--text-tertiary)" }}>Bills coming</p>
            <p
              className="font-bold break-words text-lg sm:text-2xl"
              style={{ color: c.upcoming.length > 0 ? "var(--warn)" : "var(--text-primary)" }}
            >${fmt(c.upcomingTotal)}</p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>next 7 days</p>
          </div>
        </div>
      </div>

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

      {/* Action buttons — Log Purchase and My Bills live under the Budget tab */}
      <div className="mx-4 grid grid-cols-2 gap-3 mb-5">
        <Link href="/spending"><Btn>➕ Log a Purchase</Btn></Link>
        <Link href="/bills"><Btn variant="secondary">📋 My Bills</Btn></Link>
      </div>

      {/* Breakdown */}
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
            <div key={e.id} className="flex items-center justify-between py-3 last:border-0 gap-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div className="min-w-0 flex-1">
                <p className="text-base sm:text-lg font-semibold break-words" style={{ color: "var(--text-primary)" }}>{SPEND_ICONS[e.category]} {e.category}</p>
                <p className="text-sm sm:text-base break-words" style={{ color: "var(--text-tertiary)" }}>{fmtDate(e.spent_on)}{e.note ? ` · ${e.note}` : ""}</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <span className="text-lg sm:text-xl font-bold break-words" style={{ color: "var(--text-primary)" }}>${fmt(e.amount)}</span>
                <button onClick={() => deleteEntry(e.id)} className="text-2xl" style={{ color: "var(--text-tertiary)" }}>✕</button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <p className="text-center text-base px-4 pb-2" style={{ color: "var(--text-tertiary)" }}>🔒 Your data is private. We never sell it.</p>
    </AppShell>
  );
}