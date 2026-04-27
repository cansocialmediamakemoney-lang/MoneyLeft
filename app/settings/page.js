"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Btn, Card, MoneyInput, PickerInput, Row, ErrorMsg } from "@/components/UI";
import { createClient } from "@/lib/supabase-browser";
import { useBudgetData } from "@/lib/useBudgetData";
import { fmt, ordinal } from "@/lib/constants";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { loading, user, profile, bills, updateProfile } = useBudgetData();

  const [income, setIncome] = useState("");
  const [savings, setSavings] = useState("");
  const [payDate, setPayDate] = useState("1");
  const [currency, setCurrency] = useState("USD");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    if (profile) {
      setIncome(profile.income?.toString() || "");
      setSavings(profile.savings_goal?.toString() || "");
      setPayDate(String(profile.pay_date || 1));
      setCurrency(profile.currency || "USD");
    }
  }, [profile]);

  const totalBills = bills.reduce((s,b) => s + (parseFloat(b.amount) || 0), 0);

  const handleSave = async () => {
    setError(""); setSavedMsg(""); setSaving(true);
    try {
      await updateProfile({
        income: parseFloat(income) || 0,
        savings_goal: parseFloat(savings) || 0,
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

  const handleDeleteAllData = async () => {
    if (!window.confirm("This will erase ALL your bills and spending history but keep your account. Continue?")) return;
    try {
      await supabase.from("bills").delete().eq("user_id", user.id);
      await supabase.from("spending_entries").delete().eq("user_id", user.id);
      await updateProfile({ income: 0, savings_goal: 0, pay_date: 1 });
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e.message || "Couldn't delete your data.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("This will permanently delete your account and ALL your data. This cannot be undone. Are you absolutely sure?")) return;
    if (!window.confirm("Last chance. Type yes to confirm in the next prompt — you'll be signed out and your account will be gone.")) return;
    const conf = window.prompt("Type DELETE to confirm:");
    if (conf !== "DELETE") { alert("Cancelled."); return; }

    try {
      // Delete user data first (the auth.users row deletion will cascade, but we delete profile explicitly so the cascade is clean)
      await supabase.from("bills").delete().eq("user_id", user.id);
      await supabase.from("spending_entries").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("id", user.id);
      // Sign out — the actual auth.users deletion requires server-side admin API,
      // which we'll add later. For now their data is gone.
      await supabase.auth.signOut();
      alert("Your data has been deleted. To fully remove your account login, please contact support.");
      router.push("/");
    } catch (e) {
      setError(e.message || "Couldn't delete your account.");
    }
  };

  if (loading) return <AppShell><div className="p-10 text-center text-stone-400 text-xl">Loading…</div></AppShell>;

  const available = (parseFloat(income) || 0) - (parseFloat(savings) || 0) - totalBills;

  return (
    <AppShell subtitle="Settings" showSettings={false}>
      <div className="px-5 pt-6 pb-10">
        <Card>
          <h2 className="text-2xl font-bold text-stone-800 mb-5">Your Budget</h2>

          {error && <div className="mb-4"><ErrorMsg>{error}</ErrorMsg></div>}
          {savedMsg && <div className="mb-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl px-4 py-3 text-emerald-700 font-bold text-base">{savedMsg}</div>}

          <div className="space-y-5">
            <MoneyInput value={income} onChange={setIncome} label="Monthly Income (after taxes)" />
            <MoneyInput value={savings} onChange={setSavings} label="Monthly Savings Goal" hint="Enter $0 if you're not saving right now." />
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

          <div className="mt-6 bg-stone-50 rounded-2xl p-4 space-y-2">
            <Row label="Income" val={`$${fmt(income)}`} />
            <Row label="− Savings" val={`$${fmt(savings)}`} red />
            <Row label="− Bills" val={`$${fmt(totalBills)}`} red />
            <div className="border-t border-stone-200 pt-2">
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

        <Card className="mt-4">
          <h3 className="text-xl font-bold text-stone-800 mb-3">🔒 Your Privacy</h3>
          <div className="space-y-2 text-stone-600 text-base">
            <p>✓ We <strong>never</strong> ask for your bank login or account numbers.</p>
            <p>✓ We <strong>do not sell</strong> your financial information.</p>
            <p>✓ Your data is encrypted and stored securely.</p>
            <p>✓ <strong>You control your data.</strong> Delete it anytime below.</p>
          </div>
        </Card>

        <Card className="mt-4">
          <h3 className="text-xl font-bold text-red-600 mb-3">Danger Zone</h3>
          <div className="space-y-3">
            <Btn variant="danger" small onClick={handleDeleteAllData}>🗑️ Erase My Budget Data</Btn>
            <Btn variant="danger" small onClick={handleDeleteAccount}>❌ Delete My Account &amp; All Data</Btn>
          </div>
        </Card>

        <Link href="/dashboard" className="block mt-4"><Btn variant="secondary">← Back to Dashboard</Btn></Link>

        {user && <p className="text-stone-400 text-base text-center mt-4">Signed in as {user.email}</p>}
      </div>
    </AppShell>
  );
}
