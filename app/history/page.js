"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { Card, PickerInput, Row } from "@/components/UI";
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

  if (profileLoading) return <AppShell><div className="p-10 text-center text-xl" style={{ color: "var(--text-tertiary)" }}>Loading…</div></AppShell>;

  return (
    <AppShell>
      <div className="px-5 pt-10 sm:pt-12 pb-10">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
          History
        </h1>

        <Card>
          <PickerInput value={selectedMonth} onChange={setSelectedMonth} label="Select Month" options={monthOptions} />
          <div
            className="mt-5 rounded-2xl p-4 space-y-2"
            style={{ background: "var(--bg-elevated-2)", border: "1px solid var(--border-subtle)" }}
          >
            <Row label="Spent this month" val={`$${fmt(total)}`} />
            <Row label="Money left" val={`${left >= 0 ? "" : "−"}$${fmt(left)}`} bold green={left >= 0} red={left < 0} />
          </div>
          {loading
            ? <p className="text-lg text-center py-6" style={{ color: "var(--text-tertiary)" }}>Loading…</p>
            : entries.length === 0
              ? <p className="text-lg text-center py-6" style={{ color: "var(--text-tertiary)" }}>No spending logged for this month.</p>
              : <div className="mt-5">
                  <p className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>All Purchases</p>
                  {entries.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between py-3 last:border-0 gap-3"
                      style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-base sm:text-lg font-semibold break-words" style={{ color: "var(--text-primary)" }}>{SPEND_ICONS[e.category]} {e.category}</p>
                        <p className="text-sm sm:text-base break-words" style={{ color: "var(--text-tertiary)" }}>{fmtDate(e.spent_on)}{e.note ? ` · ${e.note}` : ""}</p>
                      </div>
                      <span className="text-lg sm:text-xl font-bold break-words flex-shrink-0" style={{ color: "var(--text-primary)" }}>${fmt(e.amount)}</span>
                    </div>
                  ))}
                </div>
          }
        </Card>
      </div>
    </AppShell>
  );
}