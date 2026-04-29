"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Btn, Card, PickerInput, MoneyDisplay, Hero } from "@/components/UI";
import { createClient } from "@/lib/supabase-browser";
import { useBudgetData } from "@/lib/useBudgetData";
import { fmt, fmtDate, MONTHS, monthRange, currentMonthKey, SPEND_ICONS } from "@/lib/constants";

export default function HistoryPage() {
  const { user, loading: profileLoading } = useBudgetData();
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const justLogged = searchParams.get("logged") === "1";

  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // When we arrive with ?logged=1, show a toast and clean the URL.
  useEffect(() => {
    if (!justLogged) return;
    setShowToast(true);
    setRefreshKey((k) => k + 1); // force a refetch
    // Strip the query param so toast doesn't reappear on back/forward navigation
    router.replace("/history", { scroll: false });
    const t = setTimeout(() => setShowToast(false), 2500);
    return () => clearTimeout(t);
  }, [justLogged, router]);

  // Fetch entries — re-runs when month changes or refreshKey bumps.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    const { start, end } = monthRange(selectedMonth);
    supabase.from("spending_entries").select("*")
      .eq("user_id", user.id).gte("spent_on", start).lte("spent_on", end)
      .order("spent_on", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setEntries(data || []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user, selectedMonth, supabase, refreshKey]);

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

        <div className="-mx-1 mb-5">
          {loading ? (
            <Hero label="Spending history" accent="muted" support="Loading…">
              <p className="text-[3rem] sm:text-6xl font-bold" style={{ color: "var(--text-tertiary)" }}>—</p>
            </Hero>
          ) : entries.length === 0 ? (
            <Hero
              label="Spending history"
              accent="muted"
              support={isCurrentMonth ? "Start by logging your first purchase" : `No purchases logged in ${selectedLabel}`}
            >
              <p className="text-3xl sm:text-5xl font-bold" style={{ color: "var(--text-primary)" }}>
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

        {!loading && entries.length === 0 && isCurrentMonth && (
          <div className="mb-5">
            <Link href="/spending?from=history"><Btn>+ Log a Purchase</Btn></Link>
          </div>
        )}

        <Card className="mb-5">
          <PickerInput value={selectedMonth} onChange={setSelectedMonth} label="Select Month" options={monthOptions} />
        </Card>

        {!loading && entries.length > 0 && isCurrentMonth && (
          <div className="mb-5">
            <Link href="/spending?from=history"><Btn>+ Log a Purchase</Btn></Link>
          </div>
        )}

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

      {/* Toast */}
      {showToast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-40 rounded-full px-5 py-3 shadow-lg flex items-center gap-2 text-base font-semibold"
          style={{
            bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0))",
            background: "var(--accent)",
            color: "var(--text-on-accent)",
            animation: "ml-toast-in 0.3s ease-out",
          }}
        >
          <span>✓</span>
          <span>Purchase logged</span>
        </div>
      )}

      <style jsx>{`
        @keyframes ml-toast-in {
          from { opacity: 0; transform: translate(-50%, 0.5rem); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </AppShell>
  );
}