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

export const fmt = (n) =>
  Math.abs(parseFloat(n) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });

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

// Returns YYYY-MM-DD for first/last day of a given year-month string
export const monthRange = (monthKey) => {
  const [y, m] = monthKey.split("-").map(Number);
  const start = `${y}-${String(m).padStart(2,"0")}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2,"0")}-${String(lastDay).padStart(2,"0")}`;
  return { start, end };
};
