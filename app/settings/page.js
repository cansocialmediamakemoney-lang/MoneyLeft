"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Btn, Card, ErrorMsg } from "@/components/UI";
import { createClient } from "@/lib/supabase-browser";
import { useBudgetData } from "@/lib/useBudgetData";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { loading, user, profile, updateProfile } = useBudgetData();

  const [error, setError] = useState("");

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
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
      await supabase.from("bills").delete().eq("user_id", user.id);
      await supabase.from("spending_entries").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("id", user.id);
      await supabase.auth.signOut();
      alert("Your data has been deleted. To fully remove your account login, please contact support.");
      router.push("/");
    } catch (e) {
      setError(e.message || "Couldn't delete your account.");
    }
  };

  if (loading) return <AppShell><div className="p-10 text-center text-xl" style={{ color: "var(--text-tertiary)" }}>Loading…</div></AppShell>;

  return (
    <AppShell subtitle="Settings" showSettings={false}>
      <div className="px-5 pt-6 pb-10">

        {error && <div className="mb-4"><ErrorMsg>{error}</ErrorMsg></div>}

        {/* ── ACCOUNT ───────────────────────────────────────────────────── */}
        <SectionLabel>Account</SectionLabel>
        <Card className="mb-6 p-0 overflow-hidden">
          <Item
            icon="👤"
            label="Signed in as"
            value={user?.email || "—"}
            readonly
          />
          <Divider />
          <Item
            icon="💰"
            label="Currency"
            value={profile?.currency || "USD"}
            readonly
          />
          <Divider />
          <ItemButton icon="↪️" label="Sign Out" onClick={signOut} danger={false} accent />
        </Card>

        {/* ── APP PREFERENCES ───────────────────────────────────────────── */}
        <SectionLabel>App Preferences</SectionLabel>
        <Card className="mb-6 p-0 overflow-hidden">
          <ItemLink href="/dashboard" icon="📊" label="Edit My Budget" hint="Income, bills, savings goal" />
          <Divider />
          <ItemReadonly icon="🌙" label="Theme" value="Dark (default)" />
          <Divider />
          <ItemReadonly icon="📅" label="Monthly Reset Date" value={profile?.pay_date ? `Day ${profile.pay_date}` : "—"} />
        </Card>

        {/* ── PRIVACY & SECURITY ────────────────────────────────────────── */}
        <SectionLabel>Privacy & Security</SectionLabel>
        <Card className="mb-3">
          <h3 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>🔒 How we protect you</h3>
          <ul className="space-y-2 text-base" style={{ color: "var(--text-secondary)" }}>
            <li>✓ We <strong>never</strong> ask for your bank login or account numbers.</li>
            <li>✓ We <strong>do not sell</strong> your financial information.</li>
            <li>✓ Your data is encrypted and stored securely.</li>
            <li>✓ <strong>You control your data</strong> — delete it anytime.</li>
          </ul>
        </Card>

        <Card className="mb-6 p-0 overflow-hidden">
          <ItemButton icon="🗑️" label="Erase My Budget Data" onClick={handleDeleteAllData} danger />
          <Divider />
          <ItemButton icon="❌" label="Delete My Account" onClick={handleDeleteAccount} danger />
        </Card>

        {/* ── SUPPORT ───────────────────────────────────────────────────── */}
        <SectionLabel>Support</SectionLabel>
        <Card className="mb-6 p-0 overflow-hidden">
          <ItemLink href="/scam-check" icon="🛡️" label="Scam Checker" hint="Check suspicious messages" />
          <Divider />
          <ItemExternal href="mailto:[email protected]" icon="✉️" label="Contact Support" hint="[email protected]" />
          <Divider />
          <ItemReadonly icon="ℹ️" label="App Version" value="1.0" />
        </Card>

        <p className="text-center text-sm mt-8" style={{ color: "var(--text-tertiary)" }}>
          MoneyLeft · Made with care
        </p>
      </div>
    </AppShell>
  );
}

// ─── Sub-components for the settings list style ─────────────────────────────

function SectionLabel({ children }) {
  return (
    <p
      className="text-xs font-bold uppercase tracking-widest px-2 mb-2"
      style={{ color: "var(--text-tertiary)" }}
    >
      {children}
    </p>
  );
}

function Divider() {
  return <div style={{ height: "1px", background: "var(--border-subtle)" }} />;
}

function Item({ icon, label, value }) {
  return (
    <div className="px-5 py-4 flex items-center gap-4">
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>{label}</p>
        <p className="text-base font-semibold break-words" style={{ color: "var(--text-primary)" }}>{value}</p>
      </div>
    </div>
  );
}

function ItemReadonly({ icon, label, value }) {
  return (
    <div className="px-5 py-4 flex items-center gap-4">
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <span className="text-base flex-1 min-w-0 break-words" style={{ color: "var(--text-primary)" }}>{label}</span>
      <span className="text-base font-semibold flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>{value}</span>
    </div>
  );
}

function ItemLink({ href, icon, label, hint }) {
  return (
    <Link href={href} className="px-5 py-4 flex items-center gap-4 transition-colors hover:brightness-125 active:brightness-90">
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold break-words" style={{ color: "var(--text-primary)" }}>{label}</p>
        {hint && <p className="text-sm break-words" style={{ color: "var(--text-tertiary)" }}>{hint}</p>}
      </div>
      <span className="text-xl flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>›</span>
    </Link>
  );
}

function ItemExternal({ href, icon, label, hint }) {
  return (
    <a href={href} className="px-5 py-4 flex items-center gap-4 transition-colors hover:brightness-125 active:brightness-90">
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold break-words" style={{ color: "var(--text-primary)" }}>{label}</p>
        {hint && <p className="text-sm break-words" style={{ color: "var(--text-tertiary)" }}>{hint}</p>}
      </div>
      <span className="text-xl flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>›</span>
    </a>
  );
}

function ItemButton({ icon, label, onClick, danger = false, accent = false }) {
  const color = danger ? "var(--danger)" : accent ? "var(--accent-text)" : "var(--text-primary)";
  return (
    <button
      onClick={onClick}
      className="w-full px-5 py-4 flex items-center gap-4 text-left transition-colors hover:brightness-125 active:brightness-90"
    >
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <span className="text-base font-semibold flex-1 min-w-0 break-words" style={{ color }}>{label}</span>
    </button>
  );
}