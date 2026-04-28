"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/dashboard",
    label: "Budget",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 4 4 5-5" />
      </svg>
    ),
  },
  {
    href: "/what-if",
    label: "What If",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7" />
        <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: "/scam-check",
    label: "Scam Check",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: "/history",
    label: "History",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 14" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30"
      style={{
        background: "var(--bg-elevated)",
        borderTop: "1px solid var(--border-subtle)",
        // respect iOS home indicator
        paddingBottom: "env(safe-area-inset-bottom, 0)",
      }}
      aria-label="Main navigation"
    >
      <div className="max-w-md mx-auto flex items-stretch justify-around">
        {TABS.map((tab) => {
          // /dashboard matches /dashboard, /dashboard/anything etc.
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center py-2.5 px-1 transition-colors"
              style={{
                color: active ? "var(--accent-text)" : "var(--text-tertiary)",
              }}
              aria-current={active ? "page" : undefined}
            >
              {/* Active indicator pill above icon */}
              <div
                className="rounded-full transition-all"
                style={{
                  width: active ? "1.5rem" : "0",
                  height: "3px",
                  background: active ? "var(--accent)" : "transparent",
                  marginBottom: active ? "0.4rem" : "calc(0.4rem + 3px)",
                }}
              />
              {tab.icon(active)}
              <span className="text-xs font-semibold mt-1 tracking-wide">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}