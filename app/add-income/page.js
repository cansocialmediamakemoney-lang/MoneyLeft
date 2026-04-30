"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Btn, Card, MoneyInput, TextInput, ErrorMsg } from "@/components/UI";
import { useIncomeEntries } from "@/lib/useIncomeEntries";
import { todayStr } from "@/lib/constants";

const RETURN_PATHS = {
  history:   "/history",
  dashboard: "/dashboard",
};

export default function AddIncomePage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="p-10 text-center text-xl" style={{ color: "var(--text-tertiary)" }}>Loading…</div>
      </AppShell>
    }>
      <AddIncomeContent />
    </Suspense>
  );
}

function AddIncomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const returnTo = RETURN_PATHS[from] || "/dashboard";

  const { addEntry } = useIncomeEntries();
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [date, setDate] = useState(todayStr());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    if (!parseFloat(amount)) return;
    setError(""); setSaving(true);
    try {
      await addEntry({
        received_on: date,
        amount: parseFloat(amount),
        source: source.trim() || null,
      });
      router.push(`${returnTo}?logged_income=1`);
      router.refresh();
    } catch (e) {
      setError(e.message || "Couldn't save your income. Please try again.");
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="px-5 pt-10 sm:pt-12 pb-10">
        <h1 className="text-3xl sm:text-4xl font-medium mb-6" style={{ color: "var(--text-primary)" }}>
          Add Income
        </h1>

        <Card>
          <form onSubmit={submit} className="space-y-5">
            <MoneyInput value={amount} onChange={setAmount} label="Amount" large autoFocus />
            <TextInput
              value={source}
              onChange={setSource}
              label="Source (optional)"
              placeholder="e.g. Side job, Gift, Friend repayment…"
            />
            <div>
              <p className="text-lg font-medium mb-2" style={{ color: "var(--text-primary)" }}>Date</p>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border-2 px-4 py-3 text-xl"
              />
            </div>
            <ErrorMsg>{error}</ErrorMsg>
            <div className="flex gap-3 pt-2">
              <Btn variant="secondary" onClick={() => router.push(returnTo)} className="flex-1">← Cancel</Btn>
              <Btn type="submit" disabled={!parseFloat(amount) || saving} className="flex-1">
                {saving ? "Saving…" : "Save ✓"}
              </Btn>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
