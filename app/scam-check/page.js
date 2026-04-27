"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { Btn, Card, ErrorMsg } from "@/components/UI";

export default function ScamCheckPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const check = async () => {
    if (!text.trim()) return;
    setError(""); setResult(null); setLoading(true);

    try {
      const res = await fetch("/api/scam-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't check this message right now.");
      setResult(data);
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verdictColor = {
    "likely safe":     { bg: "bg-emerald-600", text: "text-emerald-100", icon: "✓" },
    "suspicious":      { bg: "bg-yellow-500",  text: "text-yellow-50",   icon: "⚠️" },
    "likely scam":     { bg: "bg-red-600",     text: "text-red-100",     icon: "🚫" },
  };

  const v = result && (verdictColor[result.verdict?.toLowerCase()] || verdictColor.suspicious);

  return (
    <AppShell subtitle="Scam Checker">
      <div className="px-5 pt-6 pb-10">
        <Card>
          <h2 className="text-2xl font-bold text-stone-800 mb-2">Check a Suspicious Message</h2>
          <p className="text-stone-600 text-lg mb-5">Paste a text, email, or message you received and we'll tell you if it looks like a scam.</p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the suspicious message here…"
            rows={6}
            className="w-full bg-white border-2 border-stone-200 rounded-2xl px-4 py-3 text-lg text-stone-800 focus:outline-none focus:border-emerald-600 resize-none"
          />

          <div className="mt-4">
            <Btn onClick={check} disabled={loading || !text.trim()}>
              {loading ? "Checking…" : "🛡️ Check This Message"}
            </Btn>
          </div>

          {error && <div className="mt-4"><ErrorMsg>{error}</ErrorMsg></div>}
        </Card>

        {result && (
          <Card className="mt-4">
            <div className={`${v.bg} rounded-2xl p-5 text-center mb-4`}>
              <div className="text-5xl mb-2">{v.icon}</div>
              <p className={`${v.text} text-lg font-semibold`}>This message is</p>
              <p className="text-white text-3xl font-bold capitalize">{result.verdict}</p>
            </div>

            {result.reasons?.length > 0 && (
              <>
                <h3 className="text-xl font-bold text-stone-800 mb-3">Why we think so:</h3>
                <ul className="space-y-2 mb-4">
                  {result.reasons.map((r, i) => (
                    <li key={i} className="flex gap-2 text-stone-700 text-lg">
                      <span>•</span><span>{r}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {result.advice && (
              <div className="bg-stone-50 rounded-2xl p-4 mb-4">
                <p className="text-stone-800 font-semibold mb-1">What to do:</p>
                <p className="text-stone-700 text-lg">{result.advice}</p>
              </div>
            )}

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 text-base text-yellow-800">
              ⚠️ <strong>Important:</strong> This is automated guidance, not a guarantee. When in doubt, ask a trusted family member or call your bank directly using the number on your card — never numbers from suspicious messages.
            </div>
          </Card>
        )}

        <Link href="/dashboard" className="block mt-4"><Btn variant="secondary">← Back to Dashboard</Btn></Link>
      </div>
    </AppShell>
  );
}
