"use client";

export function Btn({ children, onClick, variant = "primary", disabled = false, small = false, type = "button", className = "" }) {
  const base = `rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none w-full ${small ? "py-3 text-lg" : "py-5 text-xl"}`;
  const styles = {
    primary: {
      className: "shadow-md hover:brightness-110",
      style: {
        background: "var(--accent)",
        color: "var(--text-on-accent)",
      },
    },
    secondary: {
      className: "hover:brightness-125",
      style: {
        background: "transparent",
        color: "var(--text-primary)",
        border: "2px solid var(--border-strong)",
      },
    },
    danger: {
      className: "hover:brightness-125",
      style: {
        background: "transparent",
        color: "var(--danger)",
        border: "2px solid var(--danger)",
      },
    },
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
    <div
      className={`rounded-2xl p-5 sm:p-6 ${className}`}
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {children}
    </div>
  );
}

export function MoneyInput({ value, onChange, label, hint, large = false, autoFocus = false }) {
  return (
    <div>
      {label && <p className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{label}</p>}
      {hint && <p className="text-base mb-2" style={{ color: "var(--text-secondary)" }}>{hint}</p>}
      <div className="relative">
        <span
          className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold ${large ? "text-3xl" : "text-xl"}`}
          style={{ color: "var(--text-tertiary)" }}
        >$</span>
        <input
          type="tel"
          inputMode="decimal"
          autoFocus={autoFocus}
          value={value || ""}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="0.00"
          className={`w-full rounded-2xl border-2 font-bold transition-colors ${large ? "py-4 text-3xl" : "py-3 text-xl"}`}
          style={{ paddingLeft: large ? "2.6rem" : "2rem" }}
        />
      </div>
    </div>
  );
}

export function PickerInput({ value, onChange, label, hint, options }) {
  return (
    <div>
      {label && <p className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{label}</p>}
      {hint && <p className="text-base mb-2" style={{ color: "var(--text-secondary)" }}>{hint}</p>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border-2 px-4 py-3 text-xl font-semibold appearance-none transition-colors"
      >
        {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  );
}

export function TextInput({ value, onChange, label, placeholder = "", type = "text", autoFocus = false }) {
  return (
    <div>
      {label && <p className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{label}</p>}
      <input
        type={type}
        autoFocus={autoFocus}
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
      <span
        className={`${large ? "text-lg sm:text-xl" : "text-base sm:text-lg"} ${bold ? "font-bold" : ""} min-w-0`}
        style={{ color: labelColor }}
      >{label}</span>
      <span
        className={`font-bold break-words flex-shrink-0 ${large ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"}`}
        style={{ color: valColor }}
      >{val}</span>
    </div>
  );
}

export function ErrorMsg({ children }) {
  if (!children) return null;
  return (
    <div
      className="rounded-2xl px-4 py-3 text-base"
      style={{
        background: "var(--danger-bg)",
        border: "1px solid var(--danger)",
        color: "var(--danger)",
      }}
    >
      ⚠️ {children}
    </div>
  );
}