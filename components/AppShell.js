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
    <div className="min-h-screen pb-16" style={{ background: "linear-gradient(150deg,#f0ede8 0%,#e8f0ec 100%)", fontFamily: "'Georgia','Times New Roman',serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1a6b4a,#2d9e6b)" }}>
        <div className="flex items-center justify-between px-5 pt-8 pb-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-3xl">💰</span>
            <span className="text-3xl font-bold text-white">MoneyLeft</span>
          </Link>
          {showSettings && (
            <div className="flex gap-2">
              <Link href="/settings" className="bg-white bg-opacity-20 text-white rounded-xl px-3 py-2 text-base font-semibold">⚙️</Link>
              <button onClick={signOut} className="bg-white bg-opacity-20 text-white rounded-xl px-3 py-2 text-base font-semibold">Sign Out</button>
            </div>
          )}
        </div>
        {subtitle && <p className="text-green-100 text-lg px-5 pb-3">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
