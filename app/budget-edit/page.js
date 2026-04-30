"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Btn, Card, MoneyInput, PickerInput, Row, ErrorMsg } from "@/components/UI";
import { useBudgetData } from "@/lib/useBudgetData";
import { fmt, ordinal } from "@/lib/constants";

export default function EditBudgetPage() {
  const router = useRouter();
  const { loading, profile, bills, updateProfile } = useBudgetData();

  const [income, setIncome] = useState("");
  const [savings, setSavings] = useState("");
  const [currentSavings, setCurrentSavings] = useState("");
  const [payDate, setPayDate] = useState("1");
  const [currency, setCurrency] = useState("USD");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    if (profile) {
      setIncome(profile.income?.toString() || "");
      setSavings(profile.savings_goal?.toString() || "");
      setCurrentSavings(profile.starting_savings?.toString() || "");
      setPayDate(String(profile.pay_date || 1));
      setCurrency(profile.currency || "USD");
    }
  }, [profile]);

  const totalBills = bills.reduce((s,b) => s + (parseFloat(b.amount) || 0), 0);
  const available = (parseFloat(income) || 0) - (parseFloat(savings) || 0) - totalBills;

  const handleSave = async () => {
    setError(""); setSavedMsg(""); setSaving(true);
    try {
      await updateProfile({
        income: parseFloat(income) || 0,
        savings_goal: parseFloat(savings) || 0,
        starting_savings: parseFloat(currentSavings) || 0,
        pay_date: parseInt(payDate),
        currency,
      });
      setSavedMsg("✓ Saved!");
      setTimeout(() => setSavedMsg(""), 2500);
    } catch (e) {
      setError(e.message || "Couldn't save your changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AppShell><div className="p-10 text-center text-xl" style={{ color: "var(--text-tertiary)" }}>Loading…</div></AppShell>;

  return (
    <AppShell subtitle="Edit My Budget">
      <div className="px-5 pt-6 pb-10">
        <Card>
          <h2 className="text-2xl font-medium mb-5" style={{ color: "var(--text-primary)" }}>Your Budget</h2>

          {error && <div className="mb-4"><ErrorMsg>{error}</ErrorMsg></div>}
          {savedMsg && (
            <div
              className="mb-4 rounded-2xl px-4 py-3 font-medium text-base"
              style={{ background: "var(--accent-muted)", border: "1px solid var(--accent)", color: "var(--accent-text)" }}
            >{savedMsg}</div>
          )}

          <div className="space-y-5">
            <MoneyInput value={income} onChange={setIncome} label="Monthly Income (after taxes)" />
            <MoneyInput value={savings} onChange={setSavings} label="Monthly Savings Goal" hint="Enter $0 if you're not saving right now." />
            <MoneyInput value={currentSavings} onChange={setCurrentSavings} label="Current Savings" hint="How much you already have saved — shown on your Savings tab, not subtracted from your budget." />
            <PickerInput value={payDate} onChange={setPayDate}
              label="Monthly Reset Date"
              hint="The day of the month your budget restarts (usually the day you get paid or receive Social Security)."
              options={Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: `The ${ordinal(i + 1)} of each month` }))} />
            <PickerInput value={currency} onChange={setCurrency} label="Currency"
              options={[
                { value: "USD", label: "$ US Dollar (USD)" },
                { value: "CAD", label: "$ Canadian Dollar (CAD)" },
                { value: "GBP", label: "£ British Pound (GBP)" },
                { value: "EUR", label: "€ Euro (EUR)" },
              ]} />
          </div>

          <div
            className="mt-6 rounded-2xl p-4 space-y-2"
            style={{ background: "var(--bg-elevated-2)", border: "1px solid var(--border-subtle)" }}
          >
            <Row label="Income" val={`$${fmt(income)}`} />
            <Row label="− Savings" val={`$${fmt(savings)}`} red />
            <Row label="− Bills" val={`$${fmt(totalBills)}`} red />
            <div className="pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <Row label="Available to Spend" val={`$${fmt(available)}`} bold green={available >= 0} red={available < 0} large />
            </div>
          </div>

          <div className="mt-6">
            <Btn onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes ✓"}</Btn>
          </div>

          <div className="mt-3">
            <Link href="/bills"><Btn variant="secondary" small>✏️ Edit My Bills</Btn></Link>
          </div>
        </Card>

        <Link href="/dashboard" className="block mt-4"><Btn variant="secondary">← Back to Budget</Btn></Link>
      </div>
    </AppShell>
  );
}