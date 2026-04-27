"use client";

export function Btn({ children, onClick, variant = "primary", disabled = false, small = false, type = "button", className = "" }) {
  const base = `rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none w-full ${small ? "py-3 text-lg" : "py-5 text-xl"}`;
  const styles = {
    primary:   { className: "text-white shadow-md", style: { background: "linear-gradient(135deg,#1a6b4a,#2d9e6b)" } },
    secondary: { className: "border-2 border-stone-300 text-stone-700 bg-white", style: {} },
    danger:    { className: "border-2 border-red-200 text-red-500 bg-white", style: {} },
  };
  const v = styles[variant] || styles.primary;
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${v.className} ${className}`} style={v.style}>
      {children}
    </button>
  );
}

export function Card({ children, className = "" }) {
  return <div className={`bg-white rounded-3xl shadow-sm border border-stone-100 p-6 ${className}`}>{children}</div>;
}

export function MoneyInput({ value, onChange, label, hint, large = false, autoFocus = false }) {
  return (
    <div>
      {label && <p className="text-lg font-semibold text-stone-700 mb-1">{label}</p>}
      {hint && <p className="text-stone-400 text-base mb-2">{hint}</p>}
      <div className="relative">
        <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold ${large ? "text-3xl" : "text-xl"}`}>$</span>
        <input
          type="tel"
          inputMode="decimal"
          autoFocus={autoFocus}
          value={value || ""}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="0.00"
          className={`w-full bg-white border-2 border-stone-200 rounded-2xl font-bold text-stone-800 focus:outline-none focus:border-emerald-600 transition-colors ${large ? "py-4 text-3xl" : "py-3 text-xl"}`}
          style={{ paddingLeft: large ? "2.6rem" : "2rem" }}
        />
      </div>
    </div>
  );
}

export function PickerInput({ value, onChange, label, hint, options }) {
  return (
    <div>
      {label && <p className="text-lg font-semibold text-stone-700 mb-1">{label}</p>}
      {hint && <p className="text-stone-400 text-base mb-2">{hint}</p>}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border-2 border-stone-200 rounded-2xl px-4 py-3 text-xl font-semibold text-stone-800 focus:outline-none focus:border-emerald-600 appearance-none">
        {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  );
}

export function TextInput({ value, onChange, label, placeholder = "", type = "text", autoFocus = false }) {
  return (
    <div>
      {label && <p className="text-lg font-semibold text-stone-700 mb-2">{label}</p>}
      <input
        type={type}
        autoFocus={autoFocus}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border-2 border-stone-200 rounded-2xl px-4 py-3 text-xl text-stone-800 focus:outline-none focus:border-emerald-600 transition-colors"
      />
    </div>
  );
}

export function Row({ label, val, green = false, red = false, bold = false, large = false }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`${large ? "text-xl" : "text-lg"} ${bold ? "font-bold text-stone-800" : "text-stone-600"}`}>{label}</span>
      <span className={`font-bold ${large ? "text-2xl" : "text-xl"} ${green ? "text-emerald-600" : red ? "text-red-500" : "text-stone-800"}`}>{val}</span>
    </div>
  );
}

export function ErrorMsg({ children }) {
  if (!children) return null;
  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-2xl px-4 py-3 text-red-700 text-base">
      ⚠️ {children}
    </div>
  );
}
