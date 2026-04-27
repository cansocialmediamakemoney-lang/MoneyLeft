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
    <AppShell><div className="p-10 text-center text-stone-400 text-xl">Loading your dashboard…</div></AppShell>
  );

  // No profile setup yet — guide them
  if (!profile || !parseFloat(profile.income)) {
    return (
      <AppShell subtitle="Welcome!">
        <div className="px-5 pt-6">
          <Card className="text-center">
            <div className="text-6xl mb-4">👋</div>
            <h2 className="text-2xl font-bold text-stone-800 mb-3">Let's set up your budget</h2>
            <p className="text-stone-600 text-lg mb-6">Tell MoneyLeft about your income, bills, and savings goal so we can show you exactly how much you can safely spend.</p>
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
      {error && <div className="mx-4 mt-4 bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-red-700">{error}</div>}

      {/* Big answer */}
      <div className="mx-4 -mt-2 rounded-3xl p-5 sm:p-7 text-center shadow-xl mb-5 overflow-hidden"
        style={{ background: pos ? "linear-gradient(135deg,#1a6b4a,#2d9e6b)" : "linear-gradient(135deg,#b91c1c,#ef4444)" }}>
        <p className="text-green-100 text-lg sm:text-xl font-semibold mb-1">Money left this month</p>
        <p className="text-white font-bold leading-none break-words text-[2.5rem] sm:text-5xl md:text-6xl">
          {pos ? "" : "−"}${fmt(c.moneyLeft)}
        </p>
        <div className="mt-5 pt-4 border-t border-white border-opacity-20 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="min-w-0">
            <p className="text-green-200 text-xs sm:text-sm mb-1">Safe to spend</p>
            <p className="text-white font-bold break-words text-lg sm:text-2xl">${fmt(c.safePerDay)}</p>
            <p className="text-green-300 text-xs">per day</p>
          </div>
          <div className="min-w-0">
            <p className="text-green-200 text-xs sm:text-sm mb-1">Days to pay day</p>
            <p className="text-white font-bold text-lg sm:text-2xl">{c.daysLeft}</p>
            <p className="text-green-300 text-xs">days left</p>
          </div>
          <div className="min-w-0">
            <p className="text-green-200 text-xs sm:text-sm mb-1">Bills coming</p>
            <p className={`font-bold break-words text-lg sm:text-2xl ${c.upcoming.length > 0 ? "text-yellow-200" : "text-white"}`}>${fmt(c.upcomingTotal)}</p>
            <p className="text-green-300 text-xs">next 7 days</p>
          </div>
        </div>
      </div>
      {/* Bill warnings */}
      {c.upcoming.map((b) => (
        <div key={b.id} className="mx-4 mb-3 bg-yellow-50 border-2 border-yellow-300 rounded-2xl px-4 sm:px-5 py-4 flex justify-between items-center gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div className="min-w-0 flex-1">
              <p className="text-base sm:text-lg font-bold text-yellow-800 break-words">{b.name} due soon</p>
              <p className="text-yellow-700 text-sm sm:text-base">Due on the {ordinal(b.due_day)}</p>
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-yellow-800 break-words flex-shrink-0">${fmt(b.amount)}</p>
        </div>
      ))}

      {nearLimit && (
        <div className="mx-4 mb-3 bg-orange-50 border-2 border-orange-300 rounded-2xl px-5 py-4 text-center">
          <p className="text-xl font-bold text-orange-700">⚠️ You're close to your limit!</p>
          <p className="text-orange-600 text-lg mt-1">Only ${fmt(c.moneyLeft)} left. Try to keep spending under ${fmt(c.safePerDay)}/day.</p>
        </div>
      )}

      {/* Breakdown */}
      <Card className="mx-4 mb-4">
        <h3 className="text-xl font-bold text-stone-700 mb-4">How It's Calculated</h3>
        <div className="space-y-3">
          <Row label="💵 Monthly Income" val={`$${fmt(c.income)}`} />
          <Row label="🏦 Savings Goal" val={`−$${fmt(c.savingsGoal)}`} red />
          <Row label="📋 Fixed Bills" val={`−$${fmt(c.totalBills)}`} red />
          <Row label="🛒 Spent So Far" val={`−$${fmt(c.totalSpent)}`} red />
          <div className="border-t border-stone-100 pt-3">
            <Row label="Money Left" val={`${pos ? "" : "−"}$${fmt(c.moneyLeft)}`} bold large green={pos} red={!pos} />
          </div>
        </div>
      </Card>

      {c.totalSpent > 0 && (
        <Card className="mx-4 mb-4">
          <h3 className="text-xl font-bold text-stone-700 mb-4">Spending This Month</h3>
          {SPEND_CATS.map((cat) => {
            const amt = c.byCategory[cat];
            if (!amt) return null;
            return (
              <div key={cat} className="flex justify-between items-center mb-3 last:mb-0 gap-3">
                <span className="text-base sm:text-lg text-stone-600 min-w-0 break-words">{SPEND_ICONS[cat]} {cat}</span>
                <span className="text-lg sm:text-xl font-bold text-stone-800 flex-shrink-0 break-words">${fmt(amt)}</span>
              </div>
            );
          })}
        </Card>
      )}

      {entries.length > 0 && (
        <Card className="mx-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-stone-700">Recent Purchases</h3>
            <Link href="/history" className="text-emerald-700 text-base font-semibold">See all →</Link>
          </div>
          {entries.slice(0,4).map((e) => (
            <div key={e.id} className="flex items-center justify-between border-b border-stone-100 py-3 last:border-0 gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-base sm:text-lg font-semibold text-stone-800 break-words">{SPEND_ICONS[e.category]} {e.category}</p>
                <p className="text-stone-400 text-sm sm:text-base break-words">{fmtDate(e.spent_on)}{e.note ? ` · ${e.note}` : ""}</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <span className="text-lg sm:text-xl font-bold text-stone-800 break-words">${fmt(e.amount)}</span>
                <button onClick={() => deleteEntry(e.id)} className="text-stone-300 text-2xl">✕</button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <div className="mx-4 grid grid-cols-2 gap-3 mb-3">
        <Link href="/spending"><Btn>➕ Log a Purchase</Btn></Link>
        <Link href="/bills"><Btn variant="secondary">📋 My Bills</Btn></Link>
      </div>
      <div className="mx-4 grid grid-cols-2 gap-3 mb-5">
        <Link href="/history"><Btn variant="secondary">📅 History</Btn></Link>
        <Link href="/scam-check"><Btn variant="secondary">🛡️ Scam Check</Btn></Link>
      </div>

      <p className="text-center text-stone-400 text-base px-4 pb-2">🔒 Your data is private. We never sell it.</p>
    </AppShell>
  );
}
