"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Btn, Card, MoneyInput, PickerInput, TextInput, ErrorMsg } from "@/components/UI";
import { useBudgetData } from "@/lib/useBudgetData";
import { todayStr, SPEND_CATS, SPEND_ICONS } from "@/lib/constants";

// Allowed return paths. Whitelist so a malicious link can't redirect anywhere.
const RETURN_PATHS = {
  history:   "/history",
  dashboard: "/dashboard",
};

export default function SpendingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const returnTo = RETURN_PATHS[from] || "/dashboard";

  const { addEntry } = useBudgetData();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Groceries");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayStr());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    if (!parseFloat(amount)) return;
    setError(""); setSaving(true);
    try {
      await addEntry({
        spent_on: date,
        category,
        amount: parseFloat(amount),
        note: note.trim() || null,
      });
      // Route back to where they came from, with a flag so that page can show a toast.
      router.push(`${returnTo}?logged=1`);
      router.refresh();
    } catch (e) {
      setError(e.message || "Couldn't save your purchase. Please try again.");
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="px-5 pt-10 sm:pt-12 pb-10">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
          Log a Purchase
        </h1>

        <Card>
          <form onSubmit={submit} className="space-y-5">
            <MoneyInput value={amount} onChange={setAmount} label="Amount" large autoFocus />
            <PickerInput value={category} onChange={setCategory} label="Category"
              options={SPEND_CATS.map((c) => ({ value: c, label: `${SPEND_ICONS[c]}  ${c}` }))} />
            <TextInput value={note} onChange={setNote} label="Note (optional)" placeholder="e.g. Walmart, Doctor visit…" />
            <div>
              <p className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Date</p>
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