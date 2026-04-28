import Link from "next/link";
import { Btn, Card } from "@/components/UI";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)", fontFamily: "'Georgia',serif" }}>
      <div style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-subtle)" }} className="px-5 pt-16 pb-12 text-center">
        <img src="/icons/icon-192.png" alt="MoneyLeft logo" className="w-24 h-24 rounded-2xl mx-auto mb-4 shadow-lg" />
        <h1 className="text-5xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>MoneyLeft</h1>
        <p className="text-xl max-w-md mx-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Simple budgeting that answers one question:
        </p>
        <p className="text-2xl font-bold mt-3" style={{ color: "var(--accent-text)" }}>"How much can I safely spend?"</p>
      </div>

      <div className="flex-1 px-5 py-8 max-w-md mx-auto w-full">
        <Card className="text-center mb-5">
          <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Built for clarity</h2>
          <p className="text-lg mb-4" style={{ color: "var(--text-secondary)" }}>Big numbers. No clutter. No confusing finance jargon.</p>
          <ul className="text-lg space-y-2 text-left mt-4" style={{ color: "var(--text-secondary)" }}>
            <li>✓ Big "money left" number on every screen</li>
            <li>✓ Bills with due-date warnings</li>
            <li>✓ Daily safe-to-spend amount</li>
            <li>✓ Print or save your monthly summary</li>
            <li>✓ Your data is yours — never sold</li>
          </ul>
        </Card>

        <div className="space-y-3">
          <Link href="/signup" className="block">
            <Btn>Create a Free Account</Btn>
          </Link>
          <Link href="/login" className="block">
            <Btn variant="secondary">I Already Have an Account</Btn>
          </Link>
        </div>

        <p className="text-base text-center mt-6" style={{ color: "var(--text-tertiary)" }}>🔒 We never ask for bank logins or account numbers.</p>
      </div>
    </div>
  );
}