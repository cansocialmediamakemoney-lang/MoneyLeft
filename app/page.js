import Link from "next/link";
import { Btn, Card } from "@/components/UI";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(150deg,#f0ede8 0%,#e8f0ec 100%)", fontFamily: "'Georgia',serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1a6b4a,#2d9e6b)" }} className="px-5 pt-16 pb-12 text-center">
        <div className="text-6xl mb-4">💰</div>
        <h1 className="text-5xl font-bold text-white mb-3">MoneyLeft
        </h1>
        <p className="text-green-100 text-xl max-w-md mx-auto leading-relaxed">
          Simple budgeting that answers one question:
        </p>
        <p className="text-white text-2xl font-bold mt-3">"How much can I safely spend?"</p>
      </div>

      <div className="flex-1 px-5 py-8 max-w-md mx-auto w-full">
        <Card className="text-center mb-5">
          <h2 className="text-2xl font-bold text-stone-800 mb-3">Built for clarity</h2>
          <p className="text-stone-600 text-lg mb-4">Big numbers. No clutter. No confusing finance jargon.</p>
          <ul className="text-stone-600 text-lg space-y-2 text-left mt-4">
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

        <p className="text-stone-400 text-base text-center mt-6">🔒 We never ask for bank logins or account numbers.</p>
      </div>
    </div>
  );
}
