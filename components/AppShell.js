"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import BottomNav from "@/components/BottomNav";

export default function AppShell({
  children,
  showHeader = false,
  showBottomNav = true,
}) {
  const router = useRouter();
  const supabase = createClient();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--bg-base)",
        paddingBottom: showBottomNav ? "calc(5rem + env(safe-area-inset-bottom, 0))" : 0,
      }}
    >
      {showHeader && (
        <div
          style={{
            background: "var(--bg-elevated)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-center justify-between px-5 pt-10 pb-4 gap-2">
            <h1 className="text-2xl sm:text-3xl font-medium truncate" style={{ color: "var(--text-primary)" }}>
              Settings
            </h1>
            <button
              onClick={signOut}
              className="rounded-xl px-4 py-2 text-sm sm:text-base font-medium whitespace-nowrap transition-colors"
              style={{ background: "var(--bg-elevated-2)", color: "var(--text-primary)" }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {children}

      {showBottomNav && <BottomNav />}
    </div>
  );
}