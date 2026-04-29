"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { Btn, Card, PickerInput, MoneyDisplay, Hero } from "@/components/UI";
import { createClient } from "@/lib/supabase-browser";
import { useBudgetData } from "@/lib/useBudgetData";
import { fmt, fmtDate, MONTHS, monthRange, currentMonthKey, SPEND_ICONS } from "@/lib/constants";

export default function HistoryPage() {
  const { user, loading: profileLoading } = useBudgetData();
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
  const isCurrentMonth = selectedMonth === currentMonthKey();

  const today = new Date();
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,"0")}`;
    return { value: key, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` };
  });

  if (profileLoading) return (
    <AppShell><div className="p-10 text-center text-xl" style={{ color: "var(--text-tertiary)" }}>Loading…</div></AppShell>
  );

  const selectedLabel = monthOptions.find(m => m.value === selectedMonth)?.label || "";

  return (
    <AppShell>
      <div className="px-5 pt-10 sm:pt-12 pb-10">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
          History
        </h1>

        {/* Hero — total spent */}
        <div className="-mx-1 mb-5">
          {loading ? (
            <Hero
              label="Spending history"
              accent="muted"
              support="Loading…"
            >
              <p className="text-[3rem] sm:text-6xl font-bold" style={{ color: "var(--text-tertiary)" }}>—</p>
            </Hero>
          ) : entries.length === 0 ? (
            <Hero
              label="Spending history"
              accent="muted"
              support={
                isCurrentMonth
                  ? "Start by logging your first purchase"
                  : `No purchases logged in ${selectedLabel}`
              }
            >
              <p
                className="text-3xl sm:text-5xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                No activity yet
              </p>
            </Hero>
          ) : (
            <Hero
              label={`Spending history · ${selectedLabel}`}
              accent="green"
              support="Based on your logged purchases"
              footer={
                <div className="grid grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>Purchases</p>
                    <p className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{entries.length}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>Avg / purchase</p>
                    <MoneyDisplay value={total / entries.length} size="medium" />
                  </div>
                </div>
              }
            >
              <MoneyDisplay value={total} color="var(--accent-text)" size="hero" />
            </Hero>
          )}
        </div>

        {/* Empty state action */}
        {!loading && entries.length === 0 && isCurrentMonth && (
          <div className="mb-5">
            <Link href="/spending"><Btn>+ Log a Purchase</Btn></Link>
          </div>
        )}

        {/* Month picker */}
        <Card className="mb-5">
          <PickerInput value={selectedMonth} onChange={setSelectedMonth} label="Select Month" options={monthOptions} />
        </Card>

        {/* Action button when there's data + current month */}
        {!loading && entries.length > 0 && isCurrentMonth && (
          <div className="mb-5">
            <Link href="/spending"><Btn>+ Log a Purchase</Btn></Link>
          </div>
        )}

        {/* Transaction list */}
        {!loading && entries.length > 0 && (
          <Card>
            <p className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>All Purchases</p>
            {entries.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between py-3 last:border-0 gap-3"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-base sm:text-lg font-semibold break-words" style={{ color: "var(--text-primary)" }}>
                    {SPEND_ICONS[e.category]} {e.category}
                  </p>
                  <p className="text-sm sm:text-base break-words" style={{ color: "var(--text-tertiary)" }}>
                    {fmtDate(e.spent_on)}{e.note ? ` · ${e.note}` : ""}
                  </p>
                </div>
                <span className="text-lg sm:text-xl font-bold break-words flex-shrink-0" style={{ color: "var(--text-primary)" }}>
                  ${fmt(e.amount)}
                </span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </AppShell>
  );
}