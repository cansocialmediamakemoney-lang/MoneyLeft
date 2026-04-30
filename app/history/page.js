"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Btn, Card, PickerInput, MoneyDisplay, Hero } from "@/components/UI";
import { createClient } from "@/lib/supabase-browser";
import { useBudgetData } from "@/lib/useBudgetData";
import { fmt, fmtDate, MONTHS, monthRange, currentMonthKey, SPEND_ICONS } from "@/lib/constants";

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="p-10 text-center text-xl" style={{ color: "var(--text-tertiary)" }}>Loading…</div>
      </AppShell>
    }>
      <HistoryContent />
    </Suspense>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function HistoryContent() {
  const { user, loading: profileLoading } = useBudgetData();
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const justLogged = searchParams.get("logged") === "1";
  const justLoggedIncome = searchParams.get("logged_income") === "1";

  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [entries, setEntries] = useState([]);
  const [incomeEntries, setIncomeEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("Purchase logged");
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, type: "spend"|"income" }
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!justLogged && !justLoggedIncome) return;
    setToastMsg(justLoggedIncome ? "Income added" : "Purchase logged");
    setShowToast(true);
    setRefreshKey((k) => k + 1);
    router.replace("/history", { scroll: false });
    const t = setTimeout(() => setShowToast(false), 2500);
    return () => clearTimeout(t);
  }, [justLogged, justLoggedIncome, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    const { start, end } = monthRange(selectedMonth);
    Promise.all([
      supabase.from("spending_entries").select("*")
        .eq("user_id", user.id).gte("spent_on", start).lte("spent_on", end)
        .order("spent_on", { ascending: false }),
      supabase.from("income_entries").select("*")
        .eq("user_id", user.id).gte("received_on", start).lte("received_on", end)
        .order("received_on", { ascending: false }),
    ]).then(([{ data: spend }, { data: income }]) => {
      if (cancelled) return;
      setEntries(spend || []);
      setIncomeEntries(income || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user, selectedMonth, supabase, refreshKey]);

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    const { id, type } = confirmDelete;
    if (type === "spend") {
      await supabase.from("spending_entries").delete().eq("id", id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } else {
      await supabase.from("income_entries").delete().eq("id", id);
      setIncomeEntries((prev) => prev.filter((e) => e.id !== id));
    }
    setDeleting(false);
    setConfirmDelete(null);
  };

  const total = entries.reduce((s,e) => s + (parseFloat(e.amount) || 0), 0);
  const totalIncome = incomeEntries.reduce((s,e) => s + (parseFloat(e.amount) || 0), 0);
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
        <h1 className="text-3xl sm:text-4xl font-medium mb-6" style={{ color: "var(--text-primary)" }}>
          History
        </h1>

        <div className="-mx-1 mb-5">
          {loading ? (
            <Hero label="Spending history" accent="muted" support="Loading…">
              <p className="text-[3rem] sm:text-6xl font-semibold" style={{ color: "var(--text-tertiary)" }}>—</p>
            </Hero>
          ) : entries.length === 0 && incomeEntries.length === 0 ? (
            <Hero
              label="Spending history"
              accent="muted"
              support={isCurrentMonth ? "Start by logging your first purchase" : `No activity in ${selectedLabel}`}
            >
              <p className="text-3xl sm:text-5xl font-medium" style={{ color: "var(--text-primary)" }}>
                No activity yet
              </p>
            </Hero>
          ) : entries.length === 0 ? (
            <Hero
              label={`Activity · ${selectedLabel}`}
              accent="green"
              support="Income has been logged for this month"
            >
              <p className="text-3xl sm:text-5xl font-medium" style={{ color: "var(--text-primary)" }}>
                No spending yet
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
                    <p className="text-2xl sm:text-3xl font-semibold" style={{ color: "var(--text-primary)" }}>{entries.length}</p>
                  </div>
                  <div className="min-w-0">
                    {totalIncome > 0 ? (
                      <>
                        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>Income added</p>
                        <MoneyDisplay value={totalIncome} size="medium" color="var(--accent-text)" />
                      </>
                    ) : (
                      <>
                        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>Avg / purchase</p>
                        <MoneyDisplay value={total / entries.length} size="medium" />
                      </>
                    )}
                  </div>
                </div>
              }
            >
              <MoneyDisplay value={total} color="var(--accent-text)" size="hero" />
            </Hero>
          )}
        </div>

        <Card className="mb-5">
          <PickerInput value={selectedMonth} onChange={setSelectedMonth} label="Select Month" options={monthOptions} />
        </Card>

        {!loading && isCurrentMonth && (
          <div className="mb-5 space-y-3">
            <Link href="/spending?from=history" className="block"><Btn>+ Log a Purchase</Btn></Link>
            <Link href="/add-income?from=history" className="block"><Btn variant="secondary">💰 Add Income</Btn></Link>
          </div>
        )}

        {!loading && (entries.length > 0 || incomeEntries.length > 0) && (() => {
          const combined = [
            ...entries.map((e) => ({ ...e, _type: "spend", _date: e.spent_on })),
            ...incomeEntries.map((e) => ({ ...e, _type: "income", _date: e.received_on })),
          ].sort((a, b) => b._date.localeCompare(a._date));
          return (
            <Card>
              <p className="text-lg font-medium mb-3" style={{ color: "var(--text-primary)" }}>All Activity</p>
              {combined.map((e) => (
                <div
                  key={`${e._type}-${e.id}`}
                  className="flex items-center justify-between py-3 last:border-0 gap-3"
                  style={{ borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <div className="min-w-0 flex-1">
                    {e._type === "income" ? (
                      <>
                        <p className="text-base sm:text-lg font-medium break-words" style={{ color: "var(--accent-text)" }}>
                          💰 {e.source || "Income"}
                        </p>
                        <p className="text-sm sm:text-base break-words" style={{ color: "var(--text-tertiary)" }}>
                          {fmtDate(e.received_on)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-base sm:text-lg font-medium break-words" style={{ color: "var(--text-primary)" }}>
                          {SPEND_ICONS[e.category]} {e.category}
                        </p>
                        <p className="text-sm sm:text-base break-words" style={{ color: "var(--text-tertiary)" }}>
                          {fmtDate(e.spent_on)}{e.note ? ` · ${e.note}` : ""}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className="text-lg sm:text-xl font-semibold break-words"
                      style={{ color: e._type === "income" ? "var(--accent-text)" : "var(--text-primary)" }}
                    >
                      {e._type === "income" ? "+" : ""}${fmt(e.amount)}
                    </span>
                    <button
                      onClick={() => setConfirmDelete({ id: e.id, type: e._type })}
                      className="p-1 flex-shrink-0"
                      style={{ color: "var(--text-tertiary)" }}
                      aria-label="Delete"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </Card>
          );
        })()}
      </div>

      {showToast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-40 rounded-full px-5 py-3 shadow-lg flex items-center gap-2 text-base font-medium"
          style={{
            bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0))",
            background: "var(--accent)",
            color: "var(--text-on-accent)",
            animation: "ml-toast-in 0.3s ease-out",
          }}
        >
          <span>✓</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.55)" }}
            onClick={() => !deleting && setConfirmDelete(null)}
          />
          <div
            className="relative rounded-t-3xl px-6 pt-6 pb-10 max-w-md mx-auto w-full space-y-2"
            style={{ background: "var(--bg-elevated)" }}
          >
            <h3 className="text-xl font-medium" style={{ color: "var(--text-primary)" }}>Delete this entry?</h3>
            <p className="text-base pb-4" style={{ color: "var(--text-secondary)" }}>This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="flex-1 rounded-2xl py-4 text-lg font-medium transition-colors"
                style={{ background: "var(--bg-elevated-2)", color: "var(--text-primary)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 rounded-2xl py-4 text-lg font-medium transition-colors"
                style={{ background: "var(--danger)", color: "#fff" }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
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