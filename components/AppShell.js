"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function AppShell({ children, subtitle, showSettings = true }) {
  const router = useRouter();
  const supabase = createClient();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div
      className="min-h-screen pb-16"
      style={{
        background: "var(--bg-base)",
        fontFamily: "'Georgia','Times New Roman',serif",
      }}
    >
      <div
        style={{
          background: "var(--bg-elevated)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center justify-between px-4 sm:px-5 pt-8 pb-3 gap-2">
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0 flex-shrink">
            <img src="/icons/icon-192.png" alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex-shrink-0" />
            <span className="text-2xl sm:text-3xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
              MoneyLeft
            </span>
          </Link>
          {showSettings && (
            <div className="flex gap-2 flex-shrink-0">
              <Link
                href="/settings"
                className="rounded-xl px-3 py-2 text-base font-semibold transition-colors"
                style={{ background: "var(--bg-elevated-2)", color: "var(--text-primary)" }}
              >⚙️</Link>
              <button
                onClick={signOut}
                className="rounded-xl px-3 py-2 text-sm sm:text-base font-semibold whitespace-nowrap transition-colors"
                style={{ background: "var(--bg-elevated-2)", color: "var(--text-primary)" }}
              >Sign Out</button>
            </div>
          )}
        </div>
        {subtitle && (
          <p
            className="text-base sm:text-lg px-4 sm:px-5 pb-3 break-words"
            style={{ color: "var(--text-secondary)" }}
          >{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}