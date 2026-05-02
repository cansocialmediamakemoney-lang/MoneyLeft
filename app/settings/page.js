"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Card, ErrorMsg } from "@/components/UI";
import ConfirmSheet from "@/components/ConfirmSheet";
import { createClient } from "@/lib/supabase-browser";
import { useBudgetData } from "@/lib/useBudgetData";

export default function SettingsPage() {
  const router = useRouter();
  const { loading, user, profile, updateProfile } = useBudgetData();

  const [error, setError] = useState("");
  // "erase-data" | "delete-account" | null
  const [sheet, setSheet] = useState(null);
  const [deleteTyped, setDeleteTyped] = useState("");
  const [acting, setActing] = useState(false);

  // ── Erase all data (keep account) ─────────────────────────────────────────
  const handleEraseData = async () => {
    setActing(true);
    setError("");
    try {
      const supabase = createClient();
      const uid = user.id;
      await supabase.from("goal_contributions").delete().eq("user_id", uid);
      await supabase.from("income_entries").delete().eq("user_id", uid);
      await supabase.from("spending_entries").delete().eq("user_id", uid);
      await supabase.from("bills").delete().eq("user_id", uid);
      await supabase.from("plans").delete().eq("user_id", uid);
      await updateProfile({ income: 0, savings_goal: 0, pay_date: 1 });
      Object.keys(localStorage)
        .filter((k) => k.startsWith("ml_"))
        .forEach((k) => localStorage.removeItem(k));
      setSheet(null);
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e.message || "Couldn't erase your data. Please try again.");
      setActing(false);
    }
  };

  // ── Delete account + all data ──────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    setActing(true);
    setError("");
    try {
      const res = await fetch("/api/delete-account", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Deletion failed");
      Object.keys(localStorage)
        .filter((k) => k.startsWith("ml_"))
        .forEach((k) => localStorage.removeItem(k));
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
    } catch (e) {
      setError(e.message || "Couldn't delete your account. Please try again.");
      setActing(false);
    }
  };

  const closeSheet = () => {
    if (acting) return;
    setSheet(null);
    setDeleteTyped("");
  };

  if (loading) return <AppShell showHeader><div className="p-10 text-center text-xl" style={{ color: "var(--text-tertiary)" }}>Loading…</div></AppShell>;

  return (
    <AppShell showHeader>
      <div className="px-5 pt-6 pb-10">

        {error && <div className="mb-4"><ErrorMsg>{error}</ErrorMsg></div>}

        <SectionLabel>Account</SectionLabel>
        <Card className="mb-6 p-0 overflow-hidden">
          <Item icon="👤" label="Signed in as" value={user?.email || "—"} />
          <Divider />
          <Item icon="💰" label="Currency" value={profile?.currency || "USD"} />
        </Card>

        <SectionLabel>App Preferences</SectionLabel>
        <Card className="mb-6 p-0 overflow-hidden">
          <ItemLink href="/budget-edit" icon="📊" label="Edit My Budget" hint="Income, bills, savings goal" />
          <Divider />
          <ItemReadonly icon="🌙" label="Theme" value="Dark (default)" />
          <Divider />
          <ItemReadonly icon="📅" label="Monthly Reset Date" value={profile?.pay_date ? `Day ${profile.pay_date}` : "—"} />
        </Card>

        <SectionLabel>Privacy & Security</SectionLabel>
        <Card className="mb-3">
          <h3 className="text-lg font-medium mb-3" style={{ color: "var(--text-primary)" }}>🔒 How we protect you</h3>
          <ul className="space-y-2 text-base" style={{ color: "var(--text-secondary)" }}>
            <li>✓ We <strong>never</strong> ask for your bank login or account numbers.</li>
            <li>✓ We <strong>do not sell</strong> your financial information.</li>
            <li>✓ Your data is encrypted and stored securely.</li>
            <li>✓ <strong>You control your data</strong> — delete it anytime.</li>
          </ul>
        </Card>

        <Card className="mb-6 p-0 overflow-hidden">
          <ItemButton icon="🗑️" label="Erase My Budget Data" onClick={() => setSheet("erase-data")} danger />
          <Divider />
          <ItemButton icon="❌" label="Delete My Account" onClick={() => setSheet("delete-account")} danger />
        </Card>

        <SectionLabel>Tools</SectionLabel>
        <Card className="mb-6 p-0 overflow-hidden">
          <ItemLink href="/scam-check" icon="🛡️" label="Scam Check" hint="Check if a message, call, or offer looks suspicious" />
        </Card>

        <SectionLabel>Support</SectionLabel>
        <Card className="mb-6 p-0 overflow-hidden">
          <ItemLink href="/privacy" icon="🔏" label="Privacy Policy" hint="How we protect your data" />
          <Divider />
          <ItemExternal
            href="mailto:moneyleft.support@gmail.com?subject=MoneyLeft%20Support%20Request"
            icon="✉️"
            label="Email Support"
            hint="moneyleft.support@gmail.com"
          />
          <Divider />
          <ItemReadonly icon="ℹ️" label="App Version" value="1.0" />
        </Card>

        <p className="text-center text-sm mt-8" style={{ color: "var(--text-tertiary)" }}>
          MoneyLeft · Made with care
        </p>
      </div>

      {/* ── Erase Data confirmation ── */}
      {sheet === "erase-data" && (
        <ConfirmSheet
          title="Erase all your data?"
          message="This deletes your bills, spending history, plans, and savings goals. Your account stays. This cannot be undone."
          confirmLabel="Erase Everything"
          onConfirm={handleEraseData}
          onCancel={closeSheet}
          busy={acting}
        />
      )}

      {/* ── Delete Account confirmation ── */}
      {sheet === "delete-account" && (
        <ConfirmSheet
          title="Delete your account?"
          message="This permanently deletes your account and all your data. Type DELETE below to confirm."
          confirmLabel="Delete My Account"
          onConfirm={handleDeleteAccount}
          onCancel={closeSheet}
          busy={acting}
          confirmDisabled={deleteTyped !== "DELETE"}
        >
          <input
            type="text"
            value={deleteTyped}
            onChange={(e) => setDeleteTyped(e.target.value)}
            placeholder="Type DELETE to confirm"
            autoCapitalize="characters"
            className="w-full rounded-2xl border-2 px-4 py-3 text-lg mb-2"
            style={{ background: "var(--bg-input)", color: "var(--text-primary)", borderColor: "var(--border-strong)" }}
          />
        </ConfirmSheet>
      )}
    </AppShell>
  );
}

function SectionLabel({ children }) {
  return (
    <p
      className="text-xs font-medium uppercase tracking-widest px-2 mb-2"
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
        <p className="text-base font-medium break-words" style={{ color: "var(--text-primary)" }}>{value}</p>
      </div>
    </div>
  );
}

function ItemReadonly({ icon, label, value }) {
  return (
    <div className="px-5 py-4 flex items-center gap-4">
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <span className="text-base flex-1 min-w-0 break-words" style={{ color: "var(--text-primary)" }}>{label}</span>
      <span className="text-base font-medium flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>{value}</span>
    </div>
  );
}

function ItemLink({ href, icon, label, hint }) {
  return (
    <Link href={href} className="px-5 py-4 flex items-center gap-4 transition-colors hover:brightness-125 active:brightness-90">
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium break-words" style={{ color: "var(--text-primary)" }}>{label}</p>
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
        <p className="text-base font-medium break-words" style={{ color: "var(--text-primary)" }}>{label}</p>
        {hint && <p className="text-sm break-words" style={{ color: "var(--text-tertiary)" }}>{hint}</p>}
      </div>
      <span className="text-xl flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>›</span>
    </a>
  );
}

function ItemButton({ icon, label, onClick, danger = false }) {
  const color = danger ? "var(--danger)" : "var(--text-primary)";
  return (
    <button
      onClick={onClick}
      className="w-full px-5 py-4 flex items-center gap-4 text-left transition-colors hover:brightness-125 active:brightness-90"
    >
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <span className="text-base font-medium flex-1 min-w-0 break-words" style={{ color }}>{label}</span>
    </button>
  );
}
