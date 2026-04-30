"use client";

// Savings values stored in localStorage — no Supabase schema change required.
// current_savings: what the user says they have saved (entered in Edit My Budget)
// ml_savings:      what they've accumulated through MoneyLeft month-end reviews

const KEY_CURRENT = "ml_current_savings";
const KEY_ML      = "ml_savings_earned";

export const getLocalCurrentSavings = () =>
  parseFloat(localStorage.getItem(KEY_CURRENT)) || 0;

export const setLocalCurrentSavings = (n) =>
  localStorage.setItem(KEY_CURRENT, String(parseFloat(n) || 0));

export const getLocalMlSavings = () =>
  parseFloat(localStorage.getItem(KEY_ML)) || 0;

export const setLocalMlSavings = (n) =>
  localStorage.setItem(KEY_ML, String(parseFloat(n) || 0));

export const addToLocalMlSavings = (n) =>
  setLocalMlSavings(getLocalMlSavings() + (parseFloat(n) || 0));
