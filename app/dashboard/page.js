"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { Btn, Card, Row, MoneyDisplay, Hero } from "@/components/UI";
import Onboarding from "@/components/Onboarding";
import MonthEndReview from "@/components/MonthEndReview";
import { useBudgetData } from "@/lib/useBudgetData";
import { usePlans } from "@/lib/usePlans";
import { useMonthEnd } from "@/lib/useMonthEnd";
import { useIncomeEntries } from "@/lib/useIncomeEntries";
import { addToLocalMlSavings } from "@/lib/localSavings";
import { fmt, fmtDate, ordinal, MONTHS, SPEND_CATS, SPEND_ICONS } from "@/lib/constants";

export default function DashboardPage() {
  const { loading, error, profile, bills, entries, deleteEntry, updateProfile, addBill, refresh } = useBudgetData();
  const { loading: plansLoading, plans, updatePlan } = usePlans();
  const { loading: incomeLoading, entries: incomeEntries, totalAdditionalIncome, deleteEntry: deleteIncomeEntry } = useIncomeEntries();
  const [checkAmount, setCheckAmount] = useState("");

  const today = new Date();
  const dayOfMonth = today.getDate();
  const dim = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const calcs = useMemo(() => {
    if (!profile) return null;
    const income = parseFloat(profile.income) || 0;
    const savingsGoal = parseFloat(profile.savings_goal) || 0;
    const totalBills = bills.reduce((s,b) => s + (parseFloat(b.amount) || 0), 0);
    const totalSpent = entries.reduce((s,e) => s + (parseFloat(e.amount) || 0), 0);
    const addlIncome = totalAdditionalIncome;

    const todayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    const planSavingsMonthly = plans.reduce((sum, p) => {
      if (p.plan_type !== "saving") return sum;
      if (p.end_date <= todayStr) return sum;
      const remaining = Math.max(0, (parseFloat(p.amount) || 0) - (parseFloat(p.current_saved) || 0));
      if (remaining <= 0) return sum;
      const msLeft = new Date(p.end_date + "T00:00:00") - new Date(todayStr + "T00:00:00");
      const months = Math.max(0, msLeft / 86400000) / 30.4375;
      return sum + (months > 0 ? remaining / months : 0);
    }, 0);

    const moneyLeft = income + addlIncome - savingsGoal - totalBills - totalSpent - planSavingsMonthly;

    const payDate = parseInt(profile.pay_date) || 1;
    let daysLeft = payDate > dayOfMonth ? payDate - dayOfMonth : (dim - dayOfMonth) + payDate;
    if (daysLeft < 1) daysLeft = 1;
    const safePerDay = moneyLeft > 0 ? moneyLeft / daysLeft : 0;

    const spendable = income - savingsGoal - totalBills;
    const periodDays = dim;
    const daysPassed = Math.max(1, dayOfMonth);
    const expectedPerDay = spendable > 0 ? spendable / periodDays : 0;
    const actualPerDay = totalSpent > 0 ? totalSpent / daysPassed : 0;

    let paceLevel = "neutral", paceTitle = "", paceDetail = "";
    if (totalSpent === 0) {
      paceLevel = "neutral";
      paceTitle = "No spending yet";
      paceDetail = "Log your first purchase to track your pace";
    } else if (expectedPerDay <= 0) {
      paceLevel = "neutral";
      paceTitle = "Set a budget to see your pace";
      paceDetail = "Add income and bills in your Budget to compare.";
    } else if (actualPerDay <= expectedPerDay) {
      paceLevel = "good";
      paceTitle = "On track";
      paceDetail = `Spending $${fmt(actualPerDay)}/day vs your $${fmt(expectedPerDay)}/day pace.`;
    } else {
      const overBy = actualPerDay - expectedPerDay;
      const overPct = overBy / expectedPerDay;
      if (overPct <= 0.15) {
        paceLevel = "warn";
        paceTitle = "Slightly ahead of pace";
        paceDetail = `Slow down by about $${fmt(overBy)}/day to stay on track.`;
      } else {
        paceLevel = "bad";
        paceTitle = "Spending too fast";
        paceDetail = `Cut back by $${fmt(overBy)}/day or you may run short.`;
      }
    }

    const upcoming = bills.filter((b) => {
      const d = parseInt(b.due_day) || 1;
      return d >= dayOfMonth && d <= dayOfMonth + 7;
    });
    const upcomingTotal = upcoming.reduce((s,b) => s + (parseFloat(b.amount) || 0), 0);

    const byCategory = SPEND_CATS.reduce((acc, c) => {
      acc[c] = entries.filter((e) => e.category === c).reduce((s,e) => s + (parseFloat(e.amount) || 0), 0);
      return acc;
    }, {});

    return {
      income, addlIncome, savingsGoal, totalBills, totalSpent, planSavingsMonthly, moneyLeft,
      daysLeft, safePerDay,
      paceLevel, paceTitle, paceDetail,
      upcoming, upcomingTotal, byCategory,
    };
  }, [profile, bills, entries, plans, dayOfMonth, dim, totalAdditionalIncome]);

  // Month-end hook must be called before any conditional returns
  const { showReview, prevMonth, rollover, applyChoice } = useMonthEnd(calcs?.moneyLeft ?? null);

  // Onboarding gate — robust check so existing users are never trapped
  const isOnboarded = !!(
    profile?.setup_complete ||
    parseFloat(profile?.income) > 0 ||
    bills.length > 0
  );

  // One-time: silently mark existing users who pass the gate but predate the flag
  useEffect(() => {
    if (profile && !profile.setup_complete && isOnboarded) {
      updateProfile({ setup_complete: true }).catch(() => {});
    }
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || plansLoading || incomeLoading) return (
    <AppShell><div className="p-10 text-center text-xl" style={{ color: "var(--text-tertiary)" }}>Loading your dashboard…</div></AppShell>
  );

  if (!isOnboarded) {
    return <Onboarding updateProfile={updateProfile} addBill={addBill} refresh={refresh} />;
  }

  const c = calcs;
  const effectiveMoneyLeft = c.moneyLeft + rollover;
  const effectiveSafePerDay = effectiveMoneyLeft > 0 ? effectiveMoneyLeft / c.daysLeft : 0;
  const pos = effectiveMoneyLeft >= 0;
  const nearLimit = effectiveMoneyLeft > 0 && effectiveMoneyLeft < c.income * 0.1;

  // Override pace display when effectiveMoneyLeft is negative — pace logic
  // can otherwise show "On track" even when the user has overspent.
  let displayPaceLevel  = c.paceLevel;
  let displayPaceTitle  = c.paceTitle;
  let displayPaceDetail = c.paceDetail;
  if (effectiveMoneyLeft < 0) {
    displayPaceLevel  = "bad";
    displayPaceTitle  = "Over budget";
    displayPaceDetail = `You are $${fmt(Math.abs(effectiveMoneyLeft))} over your budget.`;
  }

  const paceStyles = {
    good:    { color: "var(--accent-text)",    dot: "var(--accent)" },
    warn:    { color: "var(--warn)",           dot: "var(--warn)"   },
    bad:     { color: "var(--danger)",         dot: "var(--danger)" },
    neutral: { color: "var(--text-secondary)", dot: "var(--text-tertiary)" },
  };
  const paceStyle = paceStyles[displayPaceLevel] || paceStyles.neutral;

  const handleMonthEndChoice = (choice, planId = null) => {
    if (choice === "savings" && planId === null) {
      addToLocalMlSavings(prevMonth.amount || 0);
    }
    applyChoice(choice);
  };

  const checkAmt = parseFloat(checkAmount) || 0;
  let checkResult = null;
  if (checkAmt > 0) {
    const newLeft   = effectiveMoneyLeft - checkAmt;
    const newPerDay = newLeft > 0 ? newLeft / c.daysLeft : 0;
    if (newLeft < 0) {
      checkResult = { text: `Not recommended — this would put you $${fmt(Math.abs(newLeft))} over budget.`, color: "var(--danger)", dot: "var(--danger)" };
    } else if (newPerDay < effectiveSafePerDay * 0.5) {
      checkResult = { text: `Careful — this would drop you to $${fmt(newPerDay)}/day.`, color: "var(--warn)", dot: "var(--warn)" };
    } else {
      checkResult = { text: `Yes — you'd still have $${fmt(newPerDay)}/day left.`, color: "var(--accent-text)", dot: "var(--accent)" };
    }
  }

  return (
    <AppShell>
      {/* ── Hero card ── */}
      <div className="px-4 pt-10 sm:pt-12 pb-2">
        <Hero
          label={`${MONTHS[today.getMonth()]} ${today.getFullYear()}`}
          labelStyle={{ textTransform: "none", fontSize: "0.7rem", opacity: 0.55 }}
          accent={pos ? "green" : "danger"}
          style={{
            background: pos
              ? "linear-gradient(170deg, #2a3f32 0%, #1c2c22 100%)"
              : "linear-gradient(170deg, #33201e 0%, #1e1313 100%)",
            boxShadow: pos
              ? "0 6px 36px rgba(31, 111, 74, 0.24)"
              : "0 6px 36px rgba(208, 80, 80, 0.22)",
          }}
          support={
            <span className="inline-flex flex-col items-center gap-1">
              <span className="inline-flex items-center gap-2 text-base sm:text-lg font-medium" style={{ color: paceStyle.color }}>
                {displayPaceLevel !== "neutral" && (
                  <span className="inline-block rounded-full" style={{ width: "0.6rem", height: "0.6rem", background: paceStyle.dot }} />
                )}
                {displayPaceTitle}
              </span>
              <span className="text-sm sm:text-base" style={{ color: "var(--text-tertiary)" }}>
                {displayPaceDetail}
              </span>
            </span>
          }
        >
          <MoneyDisplay
            value={effectiveMoneyLeft}
            negative={!pos}
            color={pos ? "var(--accent-text)" : "var(--danger)"}
            size="hero"
          />
        </Hero>
      </div>

      {/* ── Secondary stats row ── */}
      <div className="mx-4 mt-6 grid grid-cols-3 gap-3">
        <div className="min-w-0 text-center">
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-secondary)" }}>Safe / day</p>
          <p className="text-lg sm:text-xl font-semibold break-words" style={{ color: "var(--text-primary)" }}>${fmt(effectiveSafePerDay)}</p>
        </div>
        <div className="min-w-0 text-center" style={{ borderLeft: "1px solid var(--border-subtle)", borderRight: "1px solid var(--border-subtle)" }}>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-secondary)" }}>Days left</p>
          <p className="text-lg sm:text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{c.daysLeft}</p>
        </div>
        <div className="min-w-0 text-center">
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-secondary)" }}>Bills due</p>
          <p
            className="text-lg sm:text-xl font-semibold break-words"
            style={{ color: c.upcoming.length > 0 ? "var(--warn)" : "var(--text-primary)" }}
          >
            ${fmt(c.upcomingTotal)}
          </p>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-5 rounded-2xl p-4" style={{ background: "var(--danger-bg)", border: "1px solid var(--danger)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      <div className="mt-8">
        {/* Bill warnings */}
        {c.upcoming.map((b) => (
          <div
            key={b.id}
            className="mx-4 mb-4 rounded-2xl px-4 sm:px-5 py-3 flex justify-between items-center gap-3"
            style={{ background: "var(--warn-bg)", border: "1px solid var(--warn)", borderWidth: "0.75px" }}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-2xl flex-shrink-0">⚠️</span>
              <div className="min-w-0 flex-1">
                <p className="text-base sm:text-lg font-medium break-words" style={{ color: "var(--warn)" }}>{b.name} due soon</p>
                <p className="text-sm sm:text-base" style={{ color: "var(--text-secondary)" }}>Due on the {ordinal(b.due_day)}</p>
              </div>
            </div>
            <p className="text-lg sm:text-xl font-semibold break-words flex-shrink-0" style={{ color: "var(--warn)" }}>${fmt(b.amount)}</p>
          </div>
        ))}

        {nearLimit && (
          <div
            className="mx-4 mb-5 rounded-2xl px-4 py-2 text-center"
            style={{ background: "var(--warn-bg)", borderLeft: "2px solid var(--warn)" }}
          >
            <p className="text-base font-medium" style={{ color: "var(--warn)" }}>You're getting close to your limit</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Stay under ${fmt(effectiveSafePerDay)}/day to stay on track</p>
          </div>
        )}

        {/* ── Quick Check (compact) ── */}
        <div className="mx-4 mb-4">
          <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>
            Quick Check
          </p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-semibold" style={{ color: "var(--text-secondary)" }}>$</span>
            <input
              type="tel" inputMode="decimal"
              value={checkAmount}
              onChange={(e) => setCheckAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="Can I spend this?"
              className="ml-quick-check w-full rounded-xl border-2 py-2 text-base font-semibold transition-colors"
              style={{ paddingLeft: "1.6rem", borderColor: "rgba(90,191,138,0.28)", background: "var(--bg-elevated-2)" }}
            />
          </div>
          {checkResult && (
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-block rounded-full flex-shrink-0" style={{ width: "0.45rem", height: "0.45rem", background: checkResult.dot }} />
              <p className="text-sm font-medium" style={{ color: checkResult.color }}>{checkResult.text}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mx-4 mt-1 space-y-3 mb-6">
          <Link href="/spending?from=dashboard" className="block">
            <Btn>➕ Log a Purchase</Btn>
          </Link>
          <Link href="/add-income?from=dashboard" className="block">
            <Btn variant="secondary">💰 Add Income</Btn>
          </Link>
          <Link href="/bills" className="block">
            <Btn variant="secondary">📋 My Bills</Btn>
          </Link>
        </div>

        {/* How It's Calculated */}
        <Card className="mx-4 mb-4">
          <h3 className="text-xl font-medium mb-4" style={{ color: "var(--text-primary)" }}>How It's Calculated</h3>
          <div className="space-y-3">
            <Row label="💵 Monthly Income" val={`$${fmt(c.income)}`} />
            {c.addlIncome > 0 && (
              <Row label="💰 Additional Income" val={`+$${fmt(c.addlIncome)}`} green />
            )}
            <Row label="🏦 Savings Goal" val={`−$${fmt(c.savingsGoal)}`} softRed />
            <Row label="📋 Fixed Bills" val={`−$${fmt(c.totalBills)}`} softRed />
            {c.planSavingsMonthly > 0 && (
              <Row label="🎯 Plan Savings Goals" val={`−$${fmt(c.planSavingsMonthly)}`} softRed />
            )}
            <Row label="🛒 Spent So Far" val={`−$${fmt(c.totalSpent)}`} softRed />
            {rollover > 0 && (
              <Row label="🔄 Last month rollover" val={`+$${fmt(rollover)}`} green />
            )}
            <div className="pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <Row label="Money Left" val={`${pos ? "" : "−"}$${fmt(Math.abs(effectiveMoneyLeft))}`} bold large green={pos} red={!pos} />
            </div>
          </div>
        </Card>

        {c.totalSpent > 0 && (
          <Card className="mx-4 mb-4">
            <h3 className="text-xl font-medium mb-4" style={{ color: "var(--text-primary)" }}>Spending This Month</h3>
            {SPEND_CATS.map((cat) => {
              const amt = c.byCategory[cat];
              if (!amt) return null;
              return (
                <div key={cat} className="flex justify-between items-center mb-3 last:mb-0 gap-3">
                  <span className="text-base sm:text-lg min-w-0 break-words" style={{ color: "var(--text-secondary)" }}>{SPEND_ICONS[cat]} {cat}</span>
                  <span className="text-lg sm:text-xl font-semibold flex-shrink-0 break-words" style={{ color: "var(--text-primary)" }}>${fmt(amt)}</span>
                </div>
              );
            })}
          </Card>
        )}

        {entries.length > 0 && (
          <Card className="mx-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-medium" style={{ color: "var(--text-primary)" }}>Recent Purchases</h3>
              <Link href="/history" className="text-base font-medium" style={{ color: "var(--accent-text)" }}>See all →</Link>
            </div>
            {entries.slice(0,4).map((e) => (
              <div key={e.id} className="flex items-center justify-between py-3 last:border-0 gap-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="min-w-0 flex-1">
                  <p className="text-base sm:text-lg font-medium break-words" style={{ color: "var(--text-primary)" }}>{SPEND_ICONS[e.category]} {e.category}</p>
                  <p className="text-sm sm:text-base break-words" style={{ color: "var(--text-tertiary)" }}>{fmtDate(e.spent_on)}{e.note ? ` · ${e.note}` : ""}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <span className="text-lg sm:text-xl font-semibold break-words" style={{ color: "var(--text-primary)" }}>${fmt(e.amount)}</span>
                  <button onClick={() => deleteEntry(e.id)} className="text-2xl" style={{ color: "var(--text-tertiary)" }}>✕</button>
                </div>
              </div>
            ))}
          </Card>
        )}

        <Link href="/budget-edit?from=dashboard" className="block mx-4 mb-4">
          <div
            className="rounded-2xl p-5 flex items-center gap-4 transition-colors hover:brightness-125 active:brightness-90"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <span className="text-3xl flex-shrink-0">⚙️</span>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>Edit My Budget</p>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Income, savings goal, pay date</p>
            </div>
            <span className="text-2xl flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>›</span>
          </div>
        </Link>

        <p className="text-center text-sm px-4 pb-2" style={{ color: "var(--text-tertiary)", opacity: 0.7 }}>🔒 Your data is private. We never sell it.</p>
      </div>

      {/* ── Month-End Review modal ── */}
      {showReview && (
        <MonthEndReview
          prevMonth={prevMonth}
          plans={plans}
          onChoice={handleMonthEndChoice}
          onUpdatePlan={updatePlan}
        />
      )}
    </AppShell>
  );
}
