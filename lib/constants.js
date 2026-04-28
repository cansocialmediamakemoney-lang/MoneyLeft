export const BILL_CATS = [
  "Rent / Mortgage", "Utilities", "Phone", "Insurance",
  "Car Payment", "Subscriptions", "Debt Payment", "Other Bill",
];

export const SPEND_CATS = ["Groceries", "Gas", "Eating Out", "Medical", "Shopping", "Other"];

export const SPEND_ICONS = {
  Groceries: "🛒", Gas: "⛽", "Eating Out": "🍽️",
  Medical: "🩺", Shopping: "🛍️", Other: "💳",
};

export const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ─── Standard formatter — full precision, used for line items / breakdowns ──
export const fmt = (n) =>
  Math.abs(parseFloat(n) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });

// ─── Compact formatter — abbreviates large numbers, hides .00 ───────────────
// Returns an object: { value, suffix } so the UI can style them separately.
//   1,000      →  { value: "1",     suffix: "K" }
//   10,500     →  { value: "10.5",  suffix: "K" }
//   1,200,000  →  { value: "1.2",   suffix: "M" }
//   42.50      →  { value: "42.50", suffix: ""  }
//   42.00      →  { value: "42",    suffix: ""  }
//   1,234.56   →  { value: "1,234.56", suffix: "" }
export function fmtCompact(n) {
  const num = parseFloat(n) || 0;
  const abs = Math.abs(num);

  if (abs >= 1_000_000) {
    return { value: trimTrailingZeros((abs / 1_000_000).toFixed(1)), suffix: "M" };
  }
  if (abs >= 10_000) {
    // 10K+ → no decimals (clean)
    return { value: Math.round(abs / 1_000).toLocaleString("en-US"), suffix: "K" };
  }
  if (abs >= 1_000) {
    // 1K to 10K → one decimal if non-zero
    return { value: trimTrailingZeros((abs / 1_000).toFixed(1)), suffix: "K" };
  }
  // Under $1,000 → show full number, drop .00 if whole
  if (Number.isInteger(abs)) {
    return { value: abs.toLocaleString("en-US"), suffix: "" };
  }
  return {
    value: abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    suffix: "",
  };
}

// Helper: "1.0" → "1",  "1.5" → "1.5",  "10.0" → "10"
function trimTrailingZeros(str) {
  if (!str.includes(".")) return str;
  return str.replace(/\.?0+$/, "");
}

export const fmtDate = (s) => {
  const d = new Date(s + "T12:00:00");
  return `${MONTHS[d.getMonth()].slice(0,3)} ${d.getDate()}`;
};

export const todayStr = () => new Date().toISOString().split("T")[0];

export const ordinal = (n) => {
  const x = parseInt(n);
  return `${x}${["st","nd","rd"][(x % 10) - 1] || "th"}`;
};

export const currentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,"0")}`;
};

export const monthRange = (monthKey) => {
  const [y, m] = monthKey.split("-").map(Number);
  const start = `${y}-${String(m).padStart(2,"0")}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2,"0")}-${String(lastDay).padStart(2,"0")}`;
  return { start, end };
};