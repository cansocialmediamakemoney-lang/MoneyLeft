"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { Btn, MoneyInput, MoneyDisplay, Hero, TextInput, PickerInput } from "@/components/UI";
import { setLocalCurrentSavings } from "@/lib/localSavings";
import { fmt, ordinal } from "@/lib/constants";

const DUE_DAY_OPTIONS = Array.from({ length: 28 }, (_, i) => ({
  value: String(i + 1),
  label: `${ordinal(i + 1)} of each month`,
}));

function Dots({ step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="rounded-full transition-all"
          style={{
            width: i === step ? "1.5rem" : "0.5rem",
            height: "0.5rem",
            background: i === step ? "var(--accent-text)" : "var(--border-strong)",
          }}
        />
      ))}
    </div>
  );
}

function IntroStep({ onNext }) {
  return (
    <div className="flex flex-col flex-1">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-7xl mb-6">💸</div>
        <h1 className="text-3xl sm:text-4xl font-medium mb-4" style={{ color: "var(--text-primary)" }}>
          Know what you can spend
        </h1>
        <p className="text-lg sm:text-xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          MoneyLeft gives you one clear number — how much you can safely spend today without running short before payday.
        </p>
      </div>
      <Btn onClick={onNext}>Get Started →</Btn>
    </div>
  );
}

function SetupStep({ income, setIncome, savings, setSavings, startingSavings, setStartingSavings, onNext }) {
  const incomeNum = parseFloat(income) || 0;
  const canContinue = incomeNum > 0;

  return (
    <div className="flex flex-col flex-1">
      <div className="flex-1">
        <h2 className="text-2xl sm:text-3xl font-medium mb-2" style={{ color: "var(--text-primary)" }}>
          Tell us about your money
        </h2>
        <p className="text-base sm:text-lg mb-8" style={{ color: "var(--text-secondary)" }}>
          We only need a few numbers to get started.
        </p>

        <div className="space-y-6">
          <MoneyInput
            label="Monthly income (after tax)"
            hint="Your take-home pay each month"
            value={income}
            onChange={setIncome}
            large
            autoFocus
          />
          <MoneyInput
            label="Monthly savings goal"
            hint="Optional — amount you want to set aside before spending"
            value={savings}
            onChange={setSavings}
          />
          <MoneyInput
            label="Current savings"
            hint="Optional — money you already have saved"
            value={startingSavings}
            onChange={setStartingSavings}
          />
        </div>
      </div>

      <div className="mt-8">
        <Btn onClick={onNext} disabled={!canContinue}>Next: Add Bills →</Btn>
        {!canContinue && (
          <p className="text-center text-sm mt-3" style={{ color: "var(--text-tertiary)" }}>Enter your monthly income to continue</p>
        )}
      </div>
    </div>
  );
}

function BillsStep({ billsList, setBillsList, onNext }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("1");
  const [showForm, setShowForm] = useState(false);

  const canAdd = name.trim().length > 0 && (parseFloat(amount) || 0) > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    setBillsList((prev) => [
      ...prev,
      { name: name.trim(), amount: parseFloat(amount), due_day: parseInt(dueDay) || 1 },
    ]);
    setName("");
    setAmount("");
    setDueDay("1");
    setShowForm(false);
  };

  const handleRemove = (i) => setBillsList((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div className="flex flex-col flex-1">
      <div className="flex-1">
        <h2 className="text-2xl sm:text-3xl font-medium mb-2" style={{ color: "var(--text-primary)" }}>
          Monthly bills
        </h2>
        <p className="text-base sm:text-lg mb-6" style={{ color: "var(--text-secondary)" }}>
          Add rent, phone, subscriptions — anything you pay every month. You can skip this and add bills later.
        </p>

        {billsList.length > 0 && (
          <div className="space-y-2 mb-5">
            {billsList.map((b, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-base font-medium" style={{ color: "var(--text-primary)" }}>{b.name}</p>
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Due {ordinal(b.due_day)}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>${fmt(b.amount)}</span>
                  <button onClick={() => handleRemove(i)} className="text-xl leading-none" style={{ color: "var(--text-tertiary)" }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm ? (
          <div
            className="rounded-2xl p-4 mb-4 space-y-4"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <TextInput
              label="Bill name"
              placeholder="e.g. Rent, Phone, Netflix"
              value={name}
              onChange={setName}
              autoFocus
            />
            <MoneyInput label="Monthly amount" value={amount} onChange={setAmount} />
            <PickerInput
              label="Due date (optional)"
              value={dueDay}
              onChange={setDueDay}
              options={DUE_DAY_OPTIONS}
            />
            <div className="flex gap-3 pt-1">
              <button
                className="flex-1 rounded-xl py-3 text-base font-medium"
                style={{ background: "var(--bg-elevated-2)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
                onClick={() => { setShowForm(false); setName(""); setAmount(""); setDueDay("1"); }}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-xl py-3 text-base font-semibold transition-opacity"
                style={{
                  background: canAdd ? "var(--accent)" : "var(--border-subtle)",
                  color: canAdd ? "#fff" : "var(--text-tertiary)",
                  opacity: canAdd ? 1 : 0.6,
                }}
                onClick={handleAdd}
                disabled={!canAdd}
              >
                Add Bill
              </button>
            </div>
          </div>
        ) : (
          <button
            className="w-full rounded-xl py-3 text-base font-medium mb-2"
            style={{ border: "1.5px dashed var(--border-strong)", color: "var(--accent-text)" }}
            onClick={() => setShowForm(true)}
          >
            + Add a Bill
          </button>
        )}
      </div>

      <div className="mt-6">
        <Btn onClick={onNext}>
          {billsList.length > 0 ? "See My Number →" : "Skip for Now →"}
        </Btn>
      </div>
    </div>
  );
}

function ResultStep({ perDay, moneyLeft, onComplete, saving, error }) {
  const pos = moneyLeft >= 0;
  return (
    <div className="flex flex-col flex-1">
      <div className="flex-1">
        <h2 className="text-2xl sm:text-3xl font-medium mb-2 text-center" style={{ color: "var(--text-primary)" }}>
          You can safely spend
        </h2>
        <p className="text-base text-center mb-8" style={{ color: "var(--text-secondary)" }}>
          per day, after bills and savings
        </p>

        <Hero
          label="Safe to spend per day"
          accent={pos ? "green" : "danger"}
          style={{
            background: pos
              ? "linear-gradient(170deg, #2a3f32 0%, #1c2c22 100%)"
              : "linear-gradient(170deg, #33201e 0%, #1e1313 100%)",
            boxShadow: pos
              ? "0 6px 36px rgba(31, 111, 74, 0.24)"
              : "0 6px 36px rgba(208, 80, 80, 0.22)",
          }}
          support="Based on what you told us — we'll refine this as you track spending"
        >
          <MoneyDisplay
            value={perDay}
            negative={!pos}
            color={pos ? "var(--accent-text)" : "var(--danger)"}
            size="hero"
          />
        </Hero>

        {!pos && (
          <div
            className="mt-4 rounded-2xl px-4 py-3 text-center"
            style={{ background: "var(--warn-bg)", border: "1px solid var(--warn)" }}
          >
            <p className="text-base font-medium" style={{ color: "var(--warn)" }}>Your bills may exceed your income</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>You can update these numbers any time in your budget settings.</p>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl px-4 py-3" style={{ background: "var(--danger-bg)", border: "1px solid var(--danger)", color: "var(--danger)" }}>
            {error}
          </div>
        )}
      </div>

      <div className="mt-8">
        <Btn onClick={onComplete} disabled={saving}>
          {saving ? "Setting up…" : "Go to My Dashboard →"}
        </Btn>
        <p className="text-center text-sm mt-4" style={{ color: "var(--text-tertiary)" }}>
          🔒 Your data stays on your device and is never sold.
        </p>
      </div>
    </div>
  );
}

export default function Onboarding({ updateProfile, addBill, refresh }) {
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState("");
  const [savings, setSavings] = useState("");
  const [startingSavings, setStartingSavings] = useState("");
  const [billsList, setBillsList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const incomeNum = parseFloat(income) || 0;
  const savingsNum = parseFloat(savings) || 0;
  const startingSavingsNum = parseFloat(startingSavings) || 0;
  const totalBillsNum = billsList.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);
  const moneyLeft = incomeNum - totalBillsNum - savingsNum;
  const perDay = Math.max(0, moneyLeft) / 30;

  const complete = async () => {
    setSaving(true);
    setError("");
    try {
      setLocalCurrentSavings(startingSavingsNum);
      await updateProfile({
        income: incomeNum,
        savings_goal: savingsNum,
        pay_date: 1,
        currency: "USD",
        current_savings: startingSavingsNum,
      });
      for (const bill of billsList) {
        try {
          await addBill({ name: bill.name, amount: bill.amount, due_day: bill.due_day || 1, category: "Other Bill" });
        } catch (billErr) {
          console.error("[Onboarding] addBill failed (non-fatal):", billErr);
        }
      }
      await refresh();
    } catch (err) {
      console.error("[Onboarding] setup failed:", err);
      setError(err?.message || "Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  return (
    <AppShell showBottomNav={false}>
      <div className="min-h-screen flex flex-col px-6 pt-12 pb-10 max-w-md mx-auto">
        <Dots step={step} />
        <div key={step} className="ml-step-in flex flex-col flex-1">
          {step === 0 && <IntroStep onNext={() => setStep(1)} />}
          {step === 1 && (
            <SetupStep
              income={income} setIncome={setIncome}
              savings={savings} setSavings={setSavings}
              startingSavings={startingSavings} setStartingSavings={setStartingSavings}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <BillsStep
              billsList={billsList}
              setBillsList={setBillsList}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <ResultStep
              perDay={perDay}
              moneyLeft={moneyLeft}
              onComplete={complete}
              saving={saving}
              error={error}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
