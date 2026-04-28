"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { Card, MoneyInput } from "@/components/UI";
import { fmt } from "@/lib/constants";

export default function WhatIfPage() {
  const [savings, setSavings] = useState("");
  const [reduction, setReduction] = useState(0);

  const currentSavings = parseFloat(savings) || 0;
  const newMonthlySavings = currentSavings + reduction;
  const yearlyProjection = newMonthlySavings * 12;

  const sliderMax = Math.max(500, Math.round(currentSavings * 0.5));

  return (
    <AppShell>
      <div className="px-5 pt-10 sm:pt-12 pb-10 max-w-md mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
          What If
        </h1>

        <Card>
          <p className="text-base sm:text-lg mb-6" style={{ color: "var(--text-secondary)" }}>
            See how small changes to your monthly spending could grow your savings.
          </p>

          <div className="space-y-6">
            <MoneyInput
              value={savings}
              onChange={setSavings}
              label="Current monthly savings"
              hint="How much you save each month right now."
            />

            <div>
              <p className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                Reduce spending by:
              </p>
              <p className="text-base mb-4" style={{ color: "var(--text-secondary)" }}>
                Drag the slider to see the impact.
              </p>

              <div className="text-center mb-3">
                <span className="text-4xl font-bold break-words" style={{ color: "var(--accent-text)" }}>
                  ${fmt(reduction)}
                </span>
                <span className="text-lg" style={{ color: "var(--text-tertiary)" }}> / month</span>
              </div>

              <input
                type="range"
                min="0"
                max={sliderMax}
                step="5"
                value={reduction}
                onChange={(e) => setReduction(parseFloat(e.target.value))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "var(--accent)", background: "var(--bg-elevated-2)" }}
              />

              <div className="flex justify-between text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
                <span>$0</span>
                <span>${fmt(sliderMax)}</span>
              </div>
            </div>
          </div>
        </Card>

        <div
          className="mt-5 rounded-2xl p-6 text-center overflow-hidden"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--accent)" }}
        >
          <p className="text-base sm:text-lg mb-3" style={{ color: "var(--text-secondary)" }}>
            If you reduce spending by{" "}
            <span className="font-bold" style={{ color: "var(--text-primary)" }}>${fmt(reduction)}/month</span>…
          </p>
          <p className="text-base sm:text-lg mb-2" style={{ color: "var(--text-secondary)" }}>
            You would save
          </p>
          <p className="font-bold leading-none break-words text-[2.5rem] sm:text-5xl" style={{ color: "var(--accent-text)" }}>
            ${fmt(yearlyProjection)}
          </p>
          <p className="text-base sm:text-lg mt-2" style={{ color: "var(--text-secondary)" }}>in 12 months</p>

          <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              That's <span className="font-bold" style={{ color: "var(--accent-text)" }}>${fmt(newMonthlySavings)}</span> saved each month
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}