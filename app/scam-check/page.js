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
    "likely safe":     { bg: "var(--accent)",  text: "var(--text-on-accent)", icon: "✓" },
    "suspicious":      { bg: "var(--warn)",    text: "#1a1410",               icon: "⚠️" },
    "likely scam":     { bg: "var(--danger)",  text: "var(--text-on-accent)", icon: "🚫" },
  };

  const v = result && (verdictColor[result.verdict?.toLowerCase()] || verdictColor.suspicious);

  return (
    <AppShell subtitle="Scam Checker">
      <div className="px-5 pt-6 pb-10">
        <Card>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Check a Suspicious Message</h2>
          <p className="text-lg mb-5" style={{ color: "var(--text-secondary)" }}>Paste a text, email, or message you received and we'll tell you if it looks like a scam.</p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the suspicious message here…"
            rows={6}
            className="w-full rounded-2xl border-2 px-4 py-3 text-lg resize-none"
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
            <div className="rounded-2xl p-5 text-center mb-4" style={{ background: v.bg }}>
              <div className="text-5xl mb-2">{v.icon}</div>
              <p className="text-lg font-semibold" style={{ color: v.text, opacity: 0.85 }}>This message is</p>
              <p className="text-3xl font-bold capitalize" style={{ color: v.text }}>{result.verdict}</p>
            </div>

            {result.reasons?.length > 0 && (
              <>
                <h3 className="text-xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Why we think so:</h3>
                <ul className="space-y-2 mb-4">
                  {result.reasons.map((r, i) => (
                    <li key={i} className="flex gap-2 text-lg" style={{ color: "var(--text-secondary)" }}>
                      <span>•</span><span>{r}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {result.advice && (
              <div
                className="rounded-2xl p-4 mb-4"
                style={{ background: "var(--bg-elevated-2)", border: "1px solid var(--border-subtle)" }}
              >
                <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>What to do:</p>
                <p className="text-lg" style={{ color: "var(--text-secondary)" }}>{result.advice}</p>
              </div>
            )}

            <div
              className="rounded-2xl p-4 text-base"
              style={{ background: "var(--warn-bg)", border: "1px solid var(--warn)", color: "var(--warn)" }}
            >
              ⚠️ <strong>Important:</strong> This is automated guidance, not a guarantee. When in doubt, ask a trusted family member or call your bank directly using the number on your card — never numbers from suspicious messages.
            </div>

            {result.source === "rules" && (
              <p className="text-sm text-center mt-3" style={{ color: "var(--text-tertiary)" }}>Checked using pattern matching (basic mode)</p>
            )}
          </Card>
        )}

        <Link href="/dashboard" className="block mt-4"><Btn variant="secondary">← Back to Dashboard</Btn></Link>
      </div>
    </AppShell>
  );
}