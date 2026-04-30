"use client";

import { useState, useEffect, useRef } from "react";
import { MONTHS } from "@/lib/constants";

const LS_LEFTOVER   = "ml_leftover";
const LS_ROLLOVER   = "ml_rollover_";
const LS_REVIEWED   = "ml_reviewed_";

function curKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function useMonthEnd(moneyLeft) {
  const [showReview, setShowReview] = useState(false);
  const [prevMonth, setPrevMonth]   = useState({ label: "", amount: 0 });
  const [rollover, setRollover]     = useState(0);
  const checked = useRef(false);

  // One-time startup check — runs as soon as moneyLeft is available
  useEffect(() => {
    if (checked.current || moneyLeft == null) return;
    checked.current = true;
    const key = curKey();

    // Restore any active rollover for this month
    const stored = localStorage.getItem(LS_ROLLOVER + key);
    if (stored) setRollover(parseFloat(stored) || 0);

    // Check for a month transition that hasn't been reviewed
    try {
      const raw = localStorage.getItem(LS_LEFTOVER);
      if (!raw) return;
      const prev = JSON.parse(raw);
      if (prev.month !== key && prev.amount > 0 && !localStorage.getItem(LS_REVIEWED + key)) {
        setPrevMonth({ label: prev.label, amount: prev.amount });
        setShowReview(true);
      }
    } catch {}
  }, [moneyLeft]);

  // Keep the stored leftover fresh so next month's check has the right number
  useEffect(() => {
    if (moneyLeft == null || moneyLeft <= 0) return;
    const key = curKey();
    const d   = new Date();
    const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    localStorage.setItem(LS_LEFTOVER, JSON.stringify({ month: key, amount: moneyLeft, label }));
  }, [moneyLeft]);

  const applyChoice = (choice) => {
    const key = curKey();
    localStorage.setItem(LS_REVIEWED + key, "1");
    if (choice === "rollover") {
      const amt = prevMonth.amount;
      localStorage.setItem(LS_ROLLOVER + key, String(amt));
      setRollover(amt);
    }
    setShowReview(false);
  };

  return { showReview, prevMonth, rollover, applyChoice };
}
