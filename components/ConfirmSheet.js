"use client";

/**
 * Reusable bottom-sheet confirmation dialog.
 * Matches the style used by the History delete confirmation.
 *
 * Props:
 *   title          – heading text
 *   message        – body copy
 *   confirmLabel   – button label (default: "Delete")
 *   onConfirm      – called when the confirm button is tapped
 *   onCancel       – called when Cancel or backdrop is tapped
 *   busy           – disables both buttons, shows "…" in confirm button
 *   danger         – uses danger color for confirm button (default: true)
 *   confirmDisabled – extra guard, e.g. while a required text field is empty
 *   children       – optional content rendered between message and buttons
 */
export default function ConfirmSheet({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  busy = false,
  danger = true,
  confirmDisabled = false,
  children,
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.55)" }}
        onClick={() => !busy && onCancel()}
      />
      <div
        className="relative rounded-t-3xl px-6 pt-6 pb-10 max-w-md mx-auto w-full"
        style={{ background: "var(--bg-elevated)", borderTop: "1px solid var(--border-strong)" }}
      >
        <h3 className="text-xl font-medium mb-2" style={{ color: "var(--text-primary)" }}>
          {title}
        </h3>
        {message && (
          <p className="text-base mb-4" style={{ color: "var(--text-secondary)" }}>
            {message}
          </p>
        )}
        {children}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-2xl py-4 text-lg font-medium transition-colors"
            style={{ background: "var(--bg-elevated-2)", color: "var(--text-primary)" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy || confirmDisabled}
            className="flex-1 rounded-2xl py-4 text-lg font-medium transition-colors"
            style={{
              background: danger ? "var(--danger)" : "var(--accent)",
              color: "#fff",
              opacity: busy || confirmDisabled ? 0.5 : 1,
            }}
          >
            {busy ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
