"use client";

import { fmtCompact } from "@/lib/constants";

export function Btn({ children, onClick, variant = "primary", disabled = false, small = false, type = "button", className = "" }) {
  const base = `rounded-2xl font-medium transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none w-full ${small ? "py-3 text-lg" : "py-5 text-xl"}`;
  const styles = {
    primary:   { className: "text-white shadow-md hover:brightness-110", style: { background: "linear-gradient(135deg,#1a6b4a,#2d9e6b)" } },
    secondary: { className: "hover:brightness-125", style: { background: "transparent", color: "var(--text-primary)", border: "2px solid var(--border-strong)" } },
    danger:    { className: "hover:brightness-125", style: { background: "transparent", color: "var(--danger)", border: "2px solid var(--danger)" } },
  };
  const v = styles[variant] || styles.primary;
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${v.className} ${className}`} style={v.style}>
      {children}
    </button>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl p-5 sm:p-6 ${className}`} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
      {children}
    </div>
  );
}

export function MoneyInput({ value, onChange, label, hint, large = false, autoFocus = false }) {
  return (
    <div>
      {label && <p className="text-lg font-medium mb-1" style={{ color: "var(--text-primary)" }}>{label}</p>}
      {hint && <p className="text-base mb-2" style={{ color: "var(--text-secondary)" }}>{hint}</p>}
      <div className="relative">
        <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-semibold ${large ? "text-3xl" : "text-xl"}`} style={{ color: "var(--text-tertiary)" }}>$</span>
        <input
          type="tel" inputMode="decimal" autoFocus={autoFocus}
          value={value || ""}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="0.00"
          className={`w-full rounded-2xl border-2 font-semibold transition-colors ${large ? "py-4 text-3xl" : "py-3 text-xl"}`}
          style={{ paddingLeft: large ? "2.6rem" : "2rem" }}
        />
      </div>
    </div>
  );
}

export function PickerInput({ value, onChange, label, hint, options }) {
  return (
    <div>
      {label && <p className="text-lg font-medium mb-1" style={{ color: "var(--text-primary)" }}>{label}</p>}
      {hint && <p className="text-base mb-2" style={{ color: "var(--text-secondary)" }}>{hint}</p>}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border-2 px-4 py-3 text-xl font-medium appearance-none transition-colors">
        {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  );
}

export function TextInput({ value, onChange, label, placeholder = "", type = "text", autoFocus = false }) {
  return (
    <div>
      {label && <p className="text-lg font-medium mb-2" style={{ color: "var(--text-primary)" }}>{label}</p>}
      <input
        type={type} autoFocus={autoFocus}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border-2 px-4 py-3 text-xl transition-colors"
      />
    </div>
  );
}

export function Row({ label, val, green = false, red = false, bold = false, large = false }) {
  const labelColor = bold ? "var(--text-primary)" : "var(--text-secondary)";
  const valColor = green ? "var(--accent-text)" : red ? "var(--danger)" : "var(--text-primary)";
  return (
    <div className="flex justify-between items-center gap-3">
      <span className={`${large ? "text-lg sm:text-xl" : "text-base sm:text-lg"} ${bold ? "font-medium" : ""} min-w-0`} style={{ color: labelColor }}>{label}</span>
      <span className={`font-semibold break-words flex-shrink-0 ${large ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"}`} style={{ color: valColor }}>{val}</span>
    </div>
  );
}

export function ErrorMsg({ children }) {
  if (!children) return null;
  return (
    <div className="rounded-2xl px-4 py-3 text-base" style={{ background: "var(--danger-bg)", border: "1px solid var(--danger)", color: "var(--danger)" }}>
      ⚠️ {children}
    </div>
  );
}

export function MoneyDisplay({ value, negative = false, color, size = "hero", className = "" }) {
  const { value: num, suffix } = fmtCompact(value);
  const charCount = num.length + (suffix ? 1 : 0) + 1 + (negative ? 1 : 0);

  const sizeMap = {
    hero: charCount > 9 ? "text-[2rem] sm:text-4xl"
        : charCount > 7 ? "text-[2.5rem] sm:text-5xl"
        : charCount > 5 ? "text-[3rem] sm:text-6xl"
        :                 "text-[3.5rem] sm:text-7xl",
    large: charCount > 8 ? "text-2xl sm:text-3xl"
         : charCount > 6 ? "text-3xl sm:text-4xl"
         :                 "text-4xl sm:text-5xl",
    medium: charCount > 8 ? "text-xl sm:text-2xl"
          : charCount > 6 ? "text-2xl sm:text-3xl"
          :                 "text-3xl sm:text-4xl",
  };

  const dollarStyle = { fontSize: "0.6em", verticalAlign: "0.15em", fontWeight: 600, opacity: 0.7 };
  const suffixStyle = { fontSize: "0.55em", fontWeight: 600, opacity: 0.7, marginLeft: "0.05em" };

  return (
    <span
      className={`font-semibold leading-none break-words inline-block ${sizeMap[size]} ${className}`}
      style={{ color: color || "var(--text-primary)" }}
    >
      {negative && "−"}
      <span style={dollarStyle}>$</span>
      {num}
      {suffix && <span style={suffixStyle}>{suffix}</span>}
    </span>
  );
}

/**
 * Hero — the standard hero block used on every main tab.
 *
 * Structure:
 *   [tiny uppercase label]      ← context
 *   [BIG HERO NUMBER/TEXT]      ← the answer
 *   [supporting text below]     ← short explanation
 *   [optional footer slot]      ← extra stats, divider footer, etc.
 *
 * Props:
 *   label       — small uppercase context label (top)
 *   children    — the dominant hero element (use <MoneyDisplay> or plain text/JSX)
 *   support     — short supporting text below the hero
 *   footer      — optional JSX rendered below a divider
 *   accent      — "green" (default) | "danger" | "warn" | "muted" — controls the border + glow
 *   className   — extra classes
 */
export function Hero({ label, children, support, footer, accent = "green", className = "" }) {
  const accentColors = {
    green:  "var(--accent)",
    danger: "var(--danger)",
    warn:   "var(--warn)",
    muted:  "var(--border-subtle)",
  };
  const borderColor = accentColors[accent] || accentColors.green;

  return (
    <div
      className={`rounded-2xl p-7 sm:p-9 text-center overflow-hidden ${className}`}
      style={{
        background: "var(--bg-elevated)",
        border: `1px solid ${borderColor}`,
      }}
    >
      {label && (
        <p className="text-xs sm:text-sm font-medium mb-3 uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
          {label}
        </p>
      )}

      <div className="leading-none">
        {children}
      </div>

      {support && (
        <p className="text-base sm:text-lg mt-3" style={{ color: "var(--text-secondary)" }}>
          {support}
        </p>
      )}

      {footer && (
        <div className="mt-6 pt-5" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          {footer}
        </div>
      )}
    </div>
  );
}