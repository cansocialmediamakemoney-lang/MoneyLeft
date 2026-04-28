"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { Btn, Card, MoneyInput } from "@/components/UI";
import { fmt } from "@/lib/constants";

export default function WhatIfPage() {
  const [savings, setSavings] = useState("");
  const [reduction, setReduction] = useState(0);

  const currentSavings = parseFloat(savings) || 0;
  const newMonthlySavings = currentSavings + reduction;
  const yearlyProjection = newMonthlySavings * 12;

  // Slider range adapts to what they entered. Floor of $500 max so the slider
  // is always useful even for someone who entered $0.
  const sliderMax = Math.max(500, Math.round(currentSavings * 0.5));

  return (
    <AppShell subtitle="What If Mode">
      <div className="px-5 pt-6 pb-10 max-w-md mx-auto">
        <Card>
          <h2 className="text-2xl font-bold text-stone-800 mb-2">What If Mode</h2>
          <p className="text-stone-500 text-base sm:text-lg mb-6">
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
              <p className="text-lg font-semibold text-stone-700 mb-1">
                Reduce spending by:
              </p>
              <p className="text-stone-400 text-base mb-4">
                Drag the slider to see the impact.
              </p>

              <div className="text-center mb-3">
                <span className="text-4xl font-bold text-emerald-700 break-words">
                  ${fmt(reduction)}
                </span>
                <span className="text-stone-500 text-lg"> / month</span>
              </div>

              <input
                type="range"
                min="0"
                max={sliderMax}
                step="5"
                value={reduction}
                onChange={(e) => setReduction(parseFloat(e.target.value))}
                className="w-full h-3 bg-stone-200 rounded-full appearance-none cursor-pointer accent-emerald-600"
              />

              <div className="flex justify-between text-stone-400 text-sm mt-2">
                <span>$0</span>
                <span>${fmt(sliderMax)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Result */}
        <div
          className="mt-5 rounded-3xl p-6 text-center shadow-xl text-white overflow-hidden"
          style={{ background: "linear-gradient(135deg,#1a6b4a,#2d9e6b)" }}
        >
          <p className="text-green-100 text-base sm:text-lg mb-3">
            If you reduce spending by{" "}
            <span className="font-bold text-white">${fmt(reduction)}/month</span>…
          </p>
          <p className="text-green-100 text-base sm:text-lg mb-2">
            You would save
          </p>
          <p className="text-white font-bold leading-none break-words text-[2.5rem] sm:text-5xl">
            ${fmt(yearlyProjection)}
          </p>
          <p className="text-green-100 text-base sm:text-lg mt-2">in 12 months</p>

          <div className="mt-4 pt-4 border-t border-white border-opacity-20">
            <p className="text-green-200 text-sm">
              That's <span className="text-white font-bold">${fmt(newMonthlySavings)}</span> saved each month
            </p>
          </div>
        </div>

        <Link href="/dashboard" className="block mt-4">
          <Btn variant="secondary">← Back to Dashboard</Btn>
        </Link>
      </div>
    </AppShell>
  );
}