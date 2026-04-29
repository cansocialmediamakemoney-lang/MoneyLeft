"use client";

import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Btn, Card, MoneyInput, TextInput, PickerInput, ErrorMsg, MoneyDisplay, Hero } from "@/components/UI";
import { usePlans } from "@/lib/usePlans";
import { useBudgetData } from "@/lib/useBudgetData";
import { fmt, fmtDate } from "@/lib/constants";

const PLAN_TYPES = [
  { value: "trip",    label: "✈️  Trip"        },
  { value: "weekend", label: "🌴  Weekend"     },
  { value: "custom",  label: "📋  Custom"      },
];

function todayLocal() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
}

function daysFromToday(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
}

// Inclusive day count between two YYYY-MM-DD dates
function daysBetween(start, end) {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  if (isNaN(s) || isNaN(e) || e < s) return 0;
  return Math.floor((e - s) / 86400000) + 1;
}

// Exclusive days from today until a future date
function daysUntil(targetDate) {
  const s = new Date(todayLocal() + "T00:00:00");
  const e = new Date(targetDate + "T00:00:00");
  if (isNaN(e) || e <= s) return 0;
  return Math.floor((e - s) / 86400000);
}

function planTypeIcon(type) {
  return ({ trip: "✈️", weekend: "🌴", saving: "🎯", custom: "📋" })[type] || "📋";
}

// ─── Page export with Suspense for useSearchParams ──────────────────────────
export default function PlanPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="p-10 text-center text-xl" style={{ color: "var(--text-tertiary)" }}>Loading…</div>
      </AppShell>
    }>
      <PlanPageContent />
    </Suspense>
  );
}

function PlanPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "list";
  const planId = searchParams.get("id");

  const { loading, plans, addPlan, deletePlan, getPlan, error: loadError } = usePlans();

  // ── Routing helpers ──
  const goList     = () => router.push("/plan");
  const goCreate   = () => router.push("/plan?view=create");
  const goDetail   = (id) => router.push(`/plan?view=detail&id=${id}`);
  const goSaveGoal = () => router.push("/plan?view=save-goal");

  if (loading) {
    return (
      <AppShell>
        <div className="p-10 text-center text-xl" style={{ color: "var(--text-tertiary)" }}>
          Loading your plans…
        </div>
      </AppShell>
    );
  }

  // ─── DETAIL VIEW ────────────────────────────────────────────────────────
  if (view === "detail" && planId) {
    const plan = getPlan(planId);
    if (!plan) {
      return (
        <AppShell>
          <div className="px-5 pt-10 pb-10">
            <Card className="text-center">
              <p className="text-lg mb-4" style={{ color: "var(--text-secondary)" }}>That plan no longer exists.</p>
              <Btn onClick={goList}>Back to Plans</Btn>
            </Card>
          </div>
        </AppShell>
      );
    }
    const handleDelete = async () => {
      if (!window.confirm(`Delete "${plan.name}"? This can't be undone.`)) return;
      await deletePlan(plan.id);
      goList();
    };
    if (plan.plan_type === "saving") {
      return <SavingsGoalDetail plan={plan} onBack={goList} onDelete={handleDelete} />;
    }
    return <PlanDetail plan={plan} onBack={goList} onDelete={handleDelete} />;
  }

  // ─── SAVE GOAL VIEW ─────────────────────────────────────────────────────
  if (view === "save-goal") {
    return <SavingsGoalCreate onCancel={goList} onCreated={(p) => goDetail(p.id)} addPlan={addPlan} />;
  }

  // ─── CREATE VIEW ────────────────────────────────────────────────────────
  if (view === "create") {
    return <PlanCreate onCancel={goList} onCreated={(p) => goDetail(p.id)} addPlan={addPlan} />;
  }

  // ─── LIST VIEW (default) ────────────────────────────────────────────────
  const spendPlans   = plans.filter((p) => p.plan_type !== "saving");
  const savingsGoals = plans.filter((p) => p.plan_type === "saving");

  return (
    <AppShell>
      <div className="px-5 pt-10 sm:pt-12 pb-10">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
          Plan
        </h1>

        {loadError && <div className="mb-5"><ErrorMsg>{loadError}</ErrorMsg></div>}

        {/* Hero */}
        <div className="-mx-1 mb-5">
          <Hero
            label="Your plans"
            accent={plans.length > 0 ? "green" : "muted"}
            support={
              plans.length > 0
                ? "Tap a plan to see its details"
                : "Create a spend plan or set a savings goal"
            }
          >
            <p className="text-3xl sm:text-5xl font-bold" style={{ color: "var(--text-primary)" }}>
              {plans.length === 0 ? "No plans yet" : `${plans.length} ${plans.length === 1 ? "plan" : "plans"}`}
            </p>
          </Hero>
        </div>

        {/* Stacked action buttons */}
        <div className="space-y-3 mb-6">
          <Btn onClick={goCreate}>+ Spend Plan</Btn>
          <Btn variant="secondary" onClick={goSaveGoal}>🎯 Savings Goal</Btn>
        </div>

        {/* Empty state */}
        {plans.length === 0 && (
          <Card className="text-center">
            <div className="text-5xl mb-3">🗺️</div>
            <p className="text-lg mb-2 font-bold" style={{ color: "var(--text-primary)" }}>Plan ahead with confidence</p>
            <p className="text-base" style={{ color: "var(--text-secondary)" }}>
              Spend Plans spread a fixed amount across a trip or stretch of days. Savings Goals help you reach a target amount by a deadline.
            </p>
          </Card>
        )}

        {/* Savings Goals section */}
        {savingsGoals.length > 0 && (
          <div className="mb-5">
            <p className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: "var(--text-tertiary)" }}>
              Savings Goals
            </p>
            <div className="space-y-3">
              {savingsGoals.map((p) => (
                <SavingsGoalCard key={p.id} plan={p} onClick={() => goDetail(p.id)} />
              ))}
            </div>
          </div>
        )}

        {/* Spend Plans section */}
        {spendPlans.length > 0 && (
          <div className="mb-5">
            <p className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: "var(--text-tertiary)" }}>
              Spend Plans
            </p>
            <div className="space-y-3">
              {spendPlans.map((p) => (
                <SpendPlanCard key={p.id} plan={p} onClick={() => goDetail(p.id)} />
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
          Plans are separate from your monthly Money Left.
        </p>
      </div>
    </AppShell>
  );
}

// ─── Spend Plan card (list) ──────────────────────────────────────────────────
function SpendPlanCard({ plan, onClick }) {
  const days = daysBetween(plan.start_date, plan.end_date);
  const total = parseFloat(plan.amount) || 0;
  const reserve = parseFloat(plan.reserve_amount) || 0;
  const spendable = Math.max(0, total - reserve);
  const perDay = days > 0 ? spendable / days : 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl p-5 transition-colors hover:brightness-125 active:brightness-90"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-start gap-3 mb-2">
        <span className="text-3xl flex-shrink-0">{planTypeIcon(plan.plan_type)}</span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold break-words mb-1" style={{ color: "var(--text-primary)" }}>
            {plan.name}
          </p>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "var(--bg-elevated-2)", color: "var(--text-tertiary)" }}
          >
            Spend Plan
          </span>
        </div>
        <span className="text-2xl flex-shrink-0 mt-1" style={{ color: "var(--text-tertiary)" }}>›</span>
      </div>
      <div className="flex items-baseline gap-1 mt-3 mb-1">
        <MoneyDisplay value={perDay} size="medium" color="var(--accent-text)" />
        <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>/day</span>
      </div>
      <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
        {fmtDate(plan.start_date)} – {fmtDate(plan.end_date)} · {days} {days === 1 ? "day" : "days"} · ${fmt(total)} total
      </p>
    </button>
  );
}

// ─── Savings Goal card (list) ────────────────────────────────────────────────
function SavingsGoalCard({ plan, onClick }) {
  const goal = parseFloat(plan.amount) || 0;
  const saved = parseFloat(plan.current_saved) || 0;
  const remaining = Math.max(0, goal - saved);
  const days = daysUntil(plan.end_date);
  const months = days / 30.4375;
  const perMonth = months > 0 && remaining > 0 ? remaining / months : 0;
  const progress = goal > 0 ? Math.min(100, (saved / goal) * 100) : 0;
  const isComplete = saved >= goal;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl p-5 transition-colors hover:brightness-125 active:brightness-90"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="text-3xl flex-shrink-0">🎯</span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold break-words mb-1" style={{ color: "var(--text-primary)" }}>
            {plan.name}
          </p>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "var(--bg-elevated-2)", color: "var(--text-tertiary)" }}
          >
            Savings Goal
          </span>
        </div>
        <span className="text-2xl flex-shrink-0 mt-1" style={{ color: "var(--text-tertiary)" }}>›</span>
      </div>

      {isComplete ? (
        <p className="text-lg font-bold mb-3" style={{ color: "var(--accent-text)" }}>Goal reached!</p>
      ) : perMonth > 0 ? (
        <div className="flex items-baseline gap-1 mb-3">
          <MoneyDisplay value={perMonth} size="medium" color="var(--accent-text)" />
          <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>/month needed</span>
        </div>
      ) : null}

      {/* Progress bar */}
      <div
        className="rounded-full overflow-hidden mb-2"
        style={{ height: 8, background: "var(--bg-elevated-2)" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${progress}%`, background: "linear-gradient(90deg,#1a6b4a,#2d9e6b)" }}
        />
      </div>
      <div className="flex justify-between text-sm">
        <span style={{ color: "var(--accent-text)" }} className="font-semibold">${fmt(saved)} saved</span>
        <span style={{ color: "var(--text-tertiary)" }}>${fmt(goal)} goal · {fmtDate(plan.end_date)}</span>
      </div>
    </button>
  );
}

// ─── Spend Plan create form ──────────────────────────────────────────────────
function PlanCreate({ onCancel, onCreated, addPlan }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState(todayLocal());
  const [endDate, setEndDate] = useState(daysFromToday(6));
  const [planType, setPlanType] = useState("trip");
  const [reserveAmount, setReserveAmount] = useState("");
  const [reserveLabel, setReserveLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const days = useMemo(() => daysBetween(startDate, endDate), [startDate, endDate]);
  const total = parseFloat(amount) || 0;
  const reserve = parseFloat(reserveAmount) || 0;
  const spendable = Math.max(0, total - reserve);
  const perDay = days > 0 && spendable > 0 ? spendable / days : 0;

  const valid = name.trim() && total > 0 && days > 0;

  const submit = async (e) => {
    e?.preventDefault();
    if (!valid) return;
    setSaving(true); setError("");
    try {
      const created = await addPlan({
        name: name.trim(),
        amount: total,
        start_date: startDate,
        end_date: endDate,
        plan_type: planType,
        reserve_amount: reserve > 0 ? reserve : null,
        reserve_label: reserve > 0 && reserveLabel.trim() ? reserveLabel.trim() : null,
      });
      onCreated(created);
    } catch (e) {
      setError(e.message || "Couldn't save your plan.");
      setSaving(false);
    }
  };

  const heroSupport = () => {
    if (perDay <= 0) return "Fill in the form to see your daily allowance";
    if (reserve > 0) {
      const label = reserveLabel.trim() || "later";
      return <>
        <span className="font-bold" style={{ color: "var(--warn)" }}>${fmt(reserve)} set aside for {label}</span>
        {" · "}${fmt(spendable)} to spend over {days} {days === 1 ? "day" : "days"}
      </>;
    }
    return <>Based on <span className="font-bold" style={{ color: "var(--text-primary)" }}>${fmt(total)}</span> over {days} {days === 1 ? "day" : "days"}</>;
  };

  return (
    <AppShell>
      <div className="px-5 pt-10 sm:pt-12 pb-10 max-w-md mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
          New Spend Plan
        </h1>

        {/* Live preview hero */}
        <div className="-mx-1 mb-5">
          <Hero
            label="Daily allowance"
            accent={perDay > 0 ? "green" : "muted"}
            support={heroSupport()}
          >
            {perDay > 0
              ? <MoneyDisplay value={perDay} color="var(--accent-text)" size="hero" />
              : <p className="text-[3rem] sm:text-6xl font-bold" style={{ color: "var(--text-tertiary)" }}>—</p>
            }
          </Hero>
        </div>

        <Card className="mb-5">
          <form onSubmit={submit} className="space-y-5">
            <TextInput
              value={name}
              onChange={setName}
              label="Plan name"
              placeholder="e.g. Spring Break"
              autoFocus
            />

            <PickerInput
              value={planType}
              onChange={setPlanType}
              label="What are you planning for?"
              options={PLAN_TYPES}
            />

            <MoneyInput
              value={amount}
              onChange={setAmount}
              label="Total amount of money"
              hint="The full amount you have for this plan."
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

            {days === 0 && startDate && endDate && (
              <ErrorMsg>End date must be on or after start date.</ErrorMsg>
            )}

            {/* Optional: set aside section */}
            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}>
              <p className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                Set aside for later{" "}
                <span className="text-base font-normal" style={{ color: "var(--text-tertiary)" }}>(optional)</span>
              </p>
              <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                Reserve part of your total — the rest becomes your daily spending budget.
              </p>
              <div className="space-y-4">
                <MoneyInput
                  value={reserveAmount}
                  onChange={setReserveAmount}
                  label="Amount to set aside"
                />
                {reserve > 0 && (
                  <TextInput
                    value={reserveLabel}
                    onChange={setReserveLabel}
                    label="What's it for?"
                    placeholder="e.g. hotel deposit"
                  />
                )}
              </div>
            </div>

            {error && <ErrorMsg>{error}</ErrorMsg>}

            <div className="flex gap-3 pt-2">
              <Btn variant="secondary" onClick={onCancel} className="flex-1">← Cancel</Btn>
              <Btn type="submit" disabled={!valid || saving} className="flex-1">
                {saving ? "Saving…" : "Save Plan ✓"}
              </Btn>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}

// ─── Spend Plan detail view ──────────────────────────────────────────────────
function PlanDetail({ plan, onBack, onDelete }) {
  const days = daysBetween(plan.start_date, plan.end_date);
  const total = parseFloat(plan.amount) || 0;
  const reserve = parseFloat(plan.reserve_amount) || 0;
  const reserveLabel = plan.reserve_label || "later";
  const spendable = Math.max(0, total - reserve);
  const perDay = days > 0 ? spendable / days : 0;

  const today = todayLocal();
  const daysIn = daysBetween(plan.start_date, today);
  const isFuture = today < plan.start_date;
  const isPast = today > plan.end_date;
  const isActive = !isFuture && !isPast;

  let statusLabel = "Upcoming";
  if (isActive) statusLabel = `Day ${Math.min(daysIn, days)} of ${days}`;
  if (isPast) statusLabel = "Completed";

  return (
    <AppShell>
      <div className="px-5 pt-10 sm:pt-12 pb-10 max-w-md mx-auto">
        <button
          onClick={onBack}
          className="text-base font-semibold mb-4 flex items-center gap-1"
          style={{ color: "var(--accent-text)" }}
        >
          ← Back to Plans
        </button>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">{planTypeIcon(plan.plan_type)}</span>
          <h1 className="text-3xl sm:text-4xl font-bold break-words" style={{ color: "var(--text-primary)" }}>
            {plan.name}
          </h1>
        </div>

        <div className="-mx-1 mb-5">
          <Hero
            label={`Daily allowance · ${statusLabel}`}
            accent="green"
            support={
              <>From <span className="font-bold" style={{ color: "var(--text-primary)" }}>{fmtDate(plan.start_date)}</span> to <span className="font-bold" style={{ color: "var(--text-primary)" }}>{fmtDate(plan.end_date)}</span></>
            }
            footer={
              <div className="grid grid-cols-2 gap-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>
                    {reserve > 0 ? "Spendable" : "Total"}
                  </p>
                  <MoneyDisplay value={reserve > 0 ? spendable : total} size="medium" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>Days</p>
                  <p className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{days}</p>
                </div>
              </div>
            }
          >
            <MoneyDisplay value={perDay} color="var(--accent-text)" size="hero" />
            <span className="text-2xl sm:text-3xl font-bold ml-1" style={{ color: "var(--text-secondary)" }}>/day</span>
          </Hero>
        </div>

        <Card className="mb-5">
          <p className="text-base sm:text-lg mb-3" style={{ color: "var(--text-secondary)" }}>
            Spend up to <span className="font-bold" style={{ color: "var(--accent-text)" }}>${fmt(perDay)}/day</span> to make ${fmt(reserve > 0 ? spendable : total)} last from {fmtDate(plan.start_date)} through {fmtDate(plan.end_date)}.
          </p>
          {reserve > 0 && (
            <p className="text-base sm:text-lg mb-3" style={{ color: "var(--warn)" }}>
              🔒 <span className="font-bold">${fmt(reserve)}</span> is set aside for {reserveLabel}.
            </p>
          )}
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Plans are calculated locally and don't subtract from your monthly Money Left.
          </p>
        </Card>

        <Btn variant="danger" small onClick={onDelete}>🗑️ Delete Plan</Btn>
      </div>
    </AppShell>
  );
}

// ─── Shared budget comparison block ─────────────────────────────────────────
function BudgetComparison({ perMonth }) {
  const { profile, bills, loading } = useBudgetData();
  if (loading || perMonth <= 0) return null;

  const income      = parseFloat(profile?.income)       || 0;
  const savingsGoal = parseFloat(profile?.savings_goal) || 0;
  const totalBills  = (bills || []).reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);
  const hasBudget   = income > 0;
  const monthlyFree = hasBudget ? Math.max(0, income - savingsGoal - totalBills) : 0;
  const shortfall   = hasBudget ? perMonth - monthlyFree : 0;
  const onTrack     = shortfall <= 0;

  return (
    <Card className="mb-5">
      {hasBudget ? (
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-base" style={{ color: "var(--text-secondary)" }}>You need</span>
            <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>${fmt(perMonth)}/mo</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-base" style={{ color: "var(--text-secondary)" }}>Monthly available</span>
            <span className="text-lg font-bold" style={{ color: onTrack ? "var(--accent-text)" : "var(--warn)" }}>
              ${fmt(monthlyFree)}/mo
            </span>
          </div>
          <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "0.75rem" }}>
            {onTrack ? (
              <p className="text-base font-semibold" style={{ color: "var(--accent-text)" }}>
                ✓ You have enough room in your budget.
              </p>
            ) : (
              <p className="text-base font-semibold" style={{ color: "var(--warn)" }}>
                Reduce spending by <span className="font-bold">${fmt(shortfall)}/month</span> to reach your goal.
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-base" style={{ color: "var(--text-secondary)" }}>
          Add your income and bills in Budget to see how this fits your monthly money.
        </p>
      )}
    </Card>
  );
}

// ─── Savings Goal create form ────────────────────────────────────────────────
function SavingsGoalCreate({ onCancel, onCreated, addPlan }) {
  const [name, setName] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [targetDate, setTargetDate] = useState(daysFromToday(90));
  const [currentSaved, setCurrentSaved] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const days = daysUntil(targetDate);
  const months = days / 30.4375;
  const goal = parseFloat(goalAmount) || 0;
  const saved = parseFloat(currentSaved) || 0;
  const remaining = Math.max(0, goal - saved);
  const perMonth = months > 0 && remaining > 0 ? remaining / months : 0;
  const perDay   = days   > 0 && remaining > 0 ? remaining / days   : 0;

  const valid = name.trim() && goal > 0 && days > 0;

  const submit = async (e) => {
    e?.preventDefault();
    if (!valid) return;
    setSaving(true); setError("");
    try {
      const created = await addPlan({
        name: name.trim(),
        amount: goal,
        start_date: todayLocal(),
        end_date: targetDate,
        plan_type: "saving",
        current_saved: saved > 0 ? saved : null,
      });
      onCreated(created);
    } catch (err) {
      setError(err.message || "Couldn't save your goal.");
      setSaving(false);
    }
  };

  const heroSupport = perMonth > 0
    ? <>To reach <span className="font-bold" style={{ color: "var(--text-primary)" }}>${fmt(goal)}</span> by {fmtDate(targetDate)}</>
    : "Fill in your goal and target date";

  return (
    <AppShell>
      <div className="px-5 pt-10 sm:pt-12 pb-10 max-w-md mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
          New Savings Goal
        </h1>

        {/* Live preview hero */}
        <div className="-mx-1 mb-5">
          <Hero
            label="You need to save"
            accent={perMonth > 0 ? "green" : "muted"}
            support={heroSupport}
            footer={perMonth > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>Per day</p>
                  <MoneyDisplay value={perDay} size="medium" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>Months left</p>
                  <p className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                    {months >= 1 ? months.toFixed(1) : `${days}d`}
                  </p>
                </div>
              </div>
            ) : null}
          >
            {perMonth > 0
              ? <>
                  <MoneyDisplay value={perMonth} color="var(--accent-text)" size="hero" />
                  <span className="text-2xl sm:text-3xl font-bold ml-1" style={{ color: "var(--text-secondary)" }}>/mo</span>
                </>
              : <p className="text-[3rem] sm:text-6xl font-bold" style={{ color: "var(--text-tertiary)" }}>—</p>
            }
          </Hero>
        </div>

        <Card className="mb-5">
          <form onSubmit={submit} className="space-y-5">
            <TextInput
              value={name}
              onChange={setName}
              label="Goal name"
              placeholder="e.g. Emergency Fund"
              autoFocus
            />
            <MoneyInput
              value={goalAmount}
              onChange={setGoalAmount}
              label="Target amount"
              hint="How much do you want to save in total?"
              large
            />
            <div className="min-w-0">
              <p className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Target date</p>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-2xl border-2 px-4 py-3 text-xl"
              />
            </div>
            {targetDate && days === 0 && (
              <p className="text-sm" style={{ color: "var(--danger)" }}>Target date must be in the future.</p>
            )}
            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}>
              <p className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                Already saved{" "}
                <span className="text-base font-normal" style={{ color: "var(--text-tertiary)" }}>(optional)</span>
              </p>
              <MoneyInput
                value={currentSaved}
                onChange={setCurrentSaved}
                label="Amount already saved"
              />
            </div>
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <div className="flex gap-3 pt-2">
              <Btn variant="secondary" onClick={onCancel} className="flex-1">← Cancel</Btn>
              <Btn type="submit" disabled={!valid || saving} className="flex-1">
                {saving ? "Saving…" : "Save Goal ✓"}
              </Btn>
            </div>
          </form>
        </Card>

        <BudgetComparison perMonth={perMonth} />

        <p className="text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
          Estimates based on equal monthly contributions.
        </p>
      </div>
    </AppShell>
  );
}

// ─── Savings Goal detail view ────────────────────────────────────────────────
function SavingsGoalDetail({ plan, onBack, onDelete }) {
  const goal      = parseFloat(plan.amount)        || 0;
  const saved     = parseFloat(plan.current_saved) || 0;
  const remaining = Math.max(0, goal - saved);
  const days      = daysUntil(plan.end_date);
  const months    = days / 30.4375;
  const perMonth  = months > 0 && remaining > 0 ? remaining / months : 0;
  const perDay    = days   > 0 && remaining > 0 ? remaining / days   : 0;
  const progress  = goal > 0 ? Math.min(100, (saved / goal) * 100) : 0;
  const isComplete = saved >= goal;

  return (
    <AppShell>
      <div className="px-5 pt-10 sm:pt-12 pb-10 max-w-md mx-auto">
        <button
          onClick={onBack}
          className="text-base font-semibold mb-4 flex items-center gap-1"
          style={{ color: "var(--accent-text)" }}
        >
          ← Back to Plans
        </button>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">🎯</span>
          <h1 className="text-3xl sm:text-4xl font-bold break-words" style={{ color: "var(--text-primary)" }}>
            {plan.name}
          </h1>
        </div>

        {/* Hero */}
        <div className="-mx-1 mb-5">
          <Hero
            label={isComplete ? "Goal reached!" : "You need to save"}
            accent={isComplete ? "green" : (perMonth > 0 ? "green" : "muted")}
            support={
              isComplete
                ? `You've saved $${fmt(goal)} — congratulations!`
                : perMonth > 0
                  ? <>To reach <span className="font-bold" style={{ color: "var(--text-primary)" }}>${fmt(goal)}</span> by {fmtDate(plan.end_date)}</>
                  : fmtDate(plan.end_date)
            }
            footer={!isComplete && perMonth > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>Per day</p>
                  <MoneyDisplay value={perDay} size="medium" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>Months left</p>
                  <p className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                    {months >= 1 ? months.toFixed(1) : `${days}d`}
                  </p>
                </div>
              </div>
            ) : null}
          >
            {isComplete
              ? <p className="text-[3rem] sm:text-6xl font-bold" style={{ color: "var(--accent-text)" }}>Done!</p>
              : <>
                  <MoneyDisplay value={perMonth} color="var(--accent-text)" size="hero" />
                  <span className="text-2xl sm:text-3xl font-bold ml-1" style={{ color: "var(--text-secondary)" }}>/mo</span>
                </>
            }
          </Hero>
        </div>

        {/* Progress card */}
        <Card className="mb-5">
          <div className="flex justify-between items-baseline mb-3">
            <span className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Progress</span>
            <span className="text-lg font-bold" style={{ color: "var(--accent-text)" }}>{Math.round(progress)}%</span>
          </div>
          <div
            className="rounded-full overflow-hidden mb-3"
            style={{ height: 12, background: "var(--bg-elevated-2)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg,#1a6b4a,#2d9e6b)" }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>Saved</p>
              <MoneyDisplay value={saved} size="medium" color="var(--accent-text)" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>Goal</p>
              <MoneyDisplay value={goal} size="medium" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>Remaining</p>
              <MoneyDisplay value={remaining} size="medium" />
            </div>
          </div>
        </Card>

        {!isComplete && <BudgetComparison perMonth={perMonth} />}

        <Btn variant="danger" small onClick={onDelete}>🗑️ Delete Goal</Btn>
      </div>
    </AppShell>
  );
}
