"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Btn, Card, MoneyInput, PickerInput, TextInput, ErrorMsg } from "@/components/UI";
import { useBudgetData } from "@/lib/useBudgetData";
import { todayStr, SPEND_CATS, SPEND_ICONS } from "@/lib/constants";

export default function SpendingPage() {
  const router = useRouter();
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
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e.message || "Couldn't save your purchase. Please try again.");
      setSaving(false);
    }
  };

  return (
    <AppShell subtitle="Log a Purchase">
      <div className="px-5 pt-6 pb-10">
        <Card>
          <h2 className="text-2xl font-bold text-stone-800 mb-5">What did you spend?</h2>
          <form onSubmit={submit} className="space-y-5">
            <MoneyInput value={amount} onChange={setAmount} label="Amount" large autoFocus />
            <PickerInput value={category} onChange={setCategory} label="Category"
              options={SPEND_CATS.map((c) => ({ value: c, label: `${SPEND_ICONS[c]}  ${c}` }))} />
            <TextInput value={note} onChange={setNote} label="Note (optional)" placeholder="e.g. Walmart, Doctor visit…" />
            <div>
              <p className="text-lg font-semibold text-stone-700 mb-2">Date</p>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border-2 border-stone-200 rounded-2xl px-4 py-3 text-xl text-stone-800 focus:outline-none focus:border-emerald-600" />
            </div>
            <ErrorMsg>{error}</ErrorMsg>
            <div className="flex gap-3 pt-2">
              <Btn variant="secondary" onClick={() => router.push("/dashboard")} className="flex-1">← Cancel</Btn>
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
