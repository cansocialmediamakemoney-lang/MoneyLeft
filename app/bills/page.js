"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { Btn, Card, MoneyInput, PickerInput, TextInput, ErrorMsg } from "@/components/UI";
import { useBudgetData } from "@/lib/useBudgetData";
import { fmt, ordinal, BILL_CATS } from "@/lib/constants";

export default function BillsPage() {
  const { loading, bills, addBill, updateBill, deleteBill } = useBudgetData();
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const handleSave = async (bill) => {
    setError("");
    try {
      if (bill.id) {
        const { id, user_id, created_at, ...patch } = bill;
        await updateBill(bill.id, patch);
      } else {
        const { id, ...newBill } = bill;
        await addBill(newBill);
      }
      setEditing(null);
    } catch (e) {
      setError(e.message || "Couldn't save the bill. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this bill?")) return;
    try { await deleteBill(id); }
    catch (e) { setError(e.message || "Couldn't delete the bill."); }
  };

  const totalBills = bills.reduce((s,b) => s + (parseFloat(b.amount) || 0), 0);

  if (loading) return <AppShell><div className="p-10 text-center text-stone-400 text-xl">Loading…</div></AppShell>;

  return (
    <AppShell subtitle="My Monthly Bills">
      <div className="px-5 pt-6 pb-10">
        <Card>
          <h2 className="text-2xl font-bold text-stone-800 mb-2">Monthly Bills</h2>
          <p className="text-stone-500 text-lg mb-5">MoneyLeft warns you 7 days before each bill is due.</p>

          {error && <div className="mb-4"><ErrorMsg>{error}</ErrorMsg></div>}

          {bills.length === 0 ? (
            <div className="text-center py-6"><p className="text-stone-400 text-xl">No bills added yet.</p></div>
          ) : (
            bills.map((b) => (
              <div key={b.id} className="bg-stone-50 rounded-2xl px-4 sm:px-5 py-4 mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-lg sm:text-xl font-bold text-stone-800 break-words">{b.name}</p>
                  <p className="text-stone-500 text-sm sm:text-base break-words">Due {ordinal(b.due_day)} of each month</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <p className="text-lg sm:text-xl font-bold text-stone-800 break-words">${fmt(b.amount)}</p>
                  <button onClick={() => setEditing(b)} className="border-2 border-stone-200 bg-white rounded-xl px-2 sm:px-3 py-2 text-sm sm:text-base font-semibold text-stone-600">Edit</button>
                  <button onClick={() => handleDelete(b.id)} className="text-stone-300 text-2xl">✕</button>
                </div>
              </div>
            ))
          )}

          {bills.length > 0 && (
            <div className="bg-emerald-50 rounded-2xl px-4 sm:px-5 py-3 flex justify-between items-center mb-4 gap-3">
              <span className="text-base sm:text-lg font-semibold text-emerald-800">Total each month</span>
              <span className="text-lg sm:text-xl font-bold text-emerald-700 break-words flex-shrink-0">${fmt(totalBills)}</span>
            </div>
          )}

          <Btn variant="secondary" small onClick={() => setEditing({ name: "", amount: "", due_day: 1, category: "Rent / Mortgage" })}>
            ＋ Add a Bill
          </Btn>
        </Card>

        <Link href="/dashboard" className="block mt-4"><Btn variant="secondary">← Back to Dashboard</Btn></Link>
      </div>

      {editing && <BillEditor bill={editing} onSave={handleSave} onCancel={() => setEditing(null)} />}
    </AppShell>
  );
}

function BillEditor({ bill, onSave, onCancel }) {
  const [name, setName] = useState(bill.name || "");
  const [amount, setAmount] = useState(bill.amount?.toString() || "");
  const [dueDay, setDueDay] = useState(String(bill.due_day || 1));
  const [category, setCategory] = useState(bill.category || "Rent / Mortgage");
  const [saving, setSaving] = useState(false);

  const valid = name.trim() && parseFloat(amount);

  const submit = async () => {
    setSaving(true);
    await onSave({ ...bill, name: name.trim(), amount: parseFloat(amount), due_day: parseInt(dueDay), category });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end z-50" onClick={onCancel}>
      <div className="bg-white w-full rounded-t-3xl p-6 pb-10 max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-2xl font-bold text-stone-800 mb-5">{bill.id ? "Edit Bill" : "Add a Bill"}</h3>
        <div className="space-y-5">
          <PickerInput value={category} onChange={setCategory} label="Bill Type"
            options={BILL_CATS.map((c) => ({ value: c, label: c }))} />
          <TextInput value={name} onChange={setName} label="Bill Name (e.g. AT&T Phone)" placeholder="Bill name…" autoFocus />
          <MoneyInput value={amount} onChange={setAmount} label="Monthly Amount" />
          <PickerInput value={dueDay} onChange={setDueDay} label="Due Date (day of month)"
            options={Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: `${ordinal(i + 1)} of each month` }))} />
        </div>
        <div className="flex gap-3 mt-6">
          <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
          <Btn disabled={!valid || saving} onClick={submit}>{saving ? "Saving…" : "Save Bill ✓"}</Btn>
        </div>
      </div>
    </div>
  );
}
