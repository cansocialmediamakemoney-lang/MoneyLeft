"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { Btn, Card, PickerInput, Row } from "@/components/UI";
import { createClient } from "@/lib/supabase-browser";
import { useBudgetData } from "@/lib/useBudgetData";
import { fmt, fmtDate, MONTHS, monthRange, currentMonthKey, SPEND_ICONS } from "@/lib/constants";

export default function HistoryPage() {
  const { user, profile, bills, loading: profileLoading } = useBudgetData();
  const supabase = createClient();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const { start, end } = monthRange(selectedMonth);
    supabase.from("spending_entries").select("*")
      .eq("user_id", user.id).gte("spent_on", start).lte("spent_on", end)
      .order("spent_on", { ascending: false })
      .then(({ data }) => { setEntries(data || []); setLoading(false); });
  }, [user, selectedMonth, supabase]);

  const total = entries.reduce((s,e) => s + (parseFloat(e.amount) || 0), 0);
  const income = parseFloat(profile?.income) || 0;
  const savings = parseFloat(profile?.savings_goal) || 0;
  const totalBills = bills.reduce((s,b) => s + (parseFloat(b.amount) || 0), 0);
  const left = income - savings - totalBills - total;

  const today = new Date();
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,"0")}`;
    return { value: key, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` };
  });

  if (profileLoading) return <AppShell><div className="p-10 text-center text-stone-400 text-xl">Loading…</div></AppShell>;

  return (
    <AppShell subtitle="Spending History">
      <div className="px-5 pt-6 pb-10">
        <Card>
          <PickerInput value={selectedMonth} onChange={setSelectedMonth} label="Select Month" options={monthOptions} />
          <div className="mt-5 bg-stone-50 rounded-2xl p-4 space-y-2">
            <Row label="Spent this month" val={`$${fmt(total)}`} />
            <Row label="Money left" val={`${left >= 0 ? "" : "−"}$${fmt(left)}`} bold green={left >= 0} red={left < 0} />
          </div>
          {loading
            ? <p className="text-stone-400 text-lg text-center py-6">Loading…</p>
            : entries.length === 0
              ? <p className="text-stone-400 text-lg text-center py-6">No spending logged for this month.</p>
              : <div className="mt-5">
                  <p className="text-lg font-bold text-stone-700 mb-3">All Purchases</p>
                  {entries.map((e) => (
                    <div key={e.id} className="flex items-center justify-between border-b border-stone-100 py-3 last:border-0">
                      <div>
                        <p className="text-lg font-semibold text-stone-800">{SPEND_ICONS[e.category]} {e.category}</p>
                        <p className="text-stone-400 text-base">{fmtDate(e.spent_on)}{e.note ? ` · ${e.note}` : ""}</p>
                      </div>
                      <span className="text-xl font-bold text-stone-800">${fmt(e.amount)}</span>
                    </div>
                  ))}
                </div>
          }
        </Card>
        <Link href="/dashboard" className="block mt-4"><Btn variant="secondary">← Back to Dashboard</Btn></Link>
      </div>
    </AppShell>
  );
}
