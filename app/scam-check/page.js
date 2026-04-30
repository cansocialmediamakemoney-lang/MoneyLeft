"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { Btn, Card, ErrorMsg, Hero } from "@/components/UI";

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

  // Verdict → hero accent + display label
  const verdictMap = {
    "likely safe":     { accent: "green",  color: "var(--accent-text)", icon: "✓",  label: "Likely Safe" },
    "suspicious":      { accent: "warn",   color: "var(--warn)",        icon: "⚠️", label: "Suspicious" },
    "likely scam":     { accent: "danger", color: "var(--danger)",      icon: "🚫", label: "Likely Scam" },
  };
  const v = result && (verdictMap[result.verdict?.toLowerCase()] || verdictMap.suspicious);

  return (
    <AppShell>
      <div className="px-5 pt-10 sm:pt-12 pb-10">
        <h1 className="text-3xl sm:text-4xl font-medium mb-6" style={{ color: "var(--text-primary)" }}>
          Scam Check
        </h1>

        {/* Hero — verdict or prompt */}
        <div className="-mx-1 mb-5">
          {result ? (
            <Hero
              label="Verdict"
              accent={v.accent}
              support={result.reasons?.[0] || "We've analyzed the message."}
            >
              <div className="flex flex-col items-center gap-2">
                <span className="text-5xl sm:text-6xl">{v.icon}</span>
                <span
                  className="text-3xl sm:text-5xl font-medium"
                  style={{ color: v.color }}
                >
                  {v.label}
                </span>
              </div>
            </Hero>
          ) : (
            <Hero
              label="Scam Detection"
              accent="muted"
              support="We'll analyze the message and tell you if it looks suspicious"
            >
              <p
                className="text-3xl sm:text-5xl font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                Paste a message
              </p>
            </Hero>
          )}
        </div>

        {/* Input card */}
        <Card className="mb-5">
          <p className="text-base sm:text-lg mb-4" style={{ color: "var(--text-secondary)" }}>
            Paste a text, email, or message you received and we'll tell you if it looks like a scam.
          </p>

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

        {/* Detailed results */}
        {result && (
          <Card>
            {result.reasons?.length > 0 && (
              <>
                <h3 className="text-xl font-medium mb-3" style={{ color: "var(--text-primary)" }}>Why we think so:</h3>
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
                <p className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>What to do:</p>
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
      </div>
    </AppShell>
  );
}