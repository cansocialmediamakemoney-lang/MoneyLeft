"use client";

/**
 * MoneyLeft logo system.
 *
 * <LogoMark>      — just the ML monogram. Use in navbar / icon spots.
 * <LogoFull>      — ML monogram + "MONEYLEFT" wordmark. Use on landing/hero.
 *
 * Both are pure SVG so they're crisp at any size and don't need image files.
 */

const GREEN     = "#2ECC71";
const DARK      = "#0F1412";
const DARK_EDGE = "#1a201d"; // subtle highlight on dark element

/**
 * The ML monogram.
 * Built as SVG paths for a custom serif M (green) sitting on a dark slab L (the base).
 *
 * Props:
 *   size      — pixel size for height (width auto-calculated). Default 48.
 *   className — pass through for layout / responsive sizing.
 */
export function LogoMark({ size = 48, className = "" }) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="MoneyLeft"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Subtle drop shadow for depth — very gentle, not glowy */}
      <defs>
        <filter id="ml-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.2" />
          <feOffset dx="0" dy="1.5" result="offset" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.35" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── The L: a dark horizontal base/slab the M sits on ── */}
      {/* Vertical stem of L (left side) */}
      <rect x="14" y="16" width="14" height="88" fill={DARK} />
      {/* Horizontal foot — extends right under the M */}
      <rect x="14" y="90" width="92" height="14" fill={DARK} />
      {/* Tiny edge highlight on top of the L's foot for a touch of depth */}
      <rect x="14" y="90" width="92" height="1" fill={DARK_EDGE} opacity="0.6" />

      {/* ── The M: green serif-style M sitting on the L's base ── */}
      <g filter="url(#ml-shadow)">
        {/* Built from polygons for a custom geometric serif M */}
        {/* Left vertical stroke */}
        <polygon points="30,22 42,22 42,90 30,90" fill={GREEN} />
        {/* Right vertical stroke */}
        <polygon points="78,22 90,22 90,90 78,90" fill={GREEN} />
        {/* Left diagonal (top-left of M down to center) */}
        <polygon points="30,22 42,22 64,72 60,82" fill={GREEN} />
        {/* Right diagonal (top-right of M down to center) */}
        <polygon points="78,22 90,22 60,82 56,72" fill={GREEN} />
        {/* Connecting V-point to clean up the center seam */}
        <polygon points="56,72 64,72 60,82" fill={GREEN} />
      </g>
    </svg>
  );
}

/**
 * Full lockup: ML monogram + "MONEYLEFT" wordmark.
 *
 * Props:
 *   size      — pixel size for the monogram height. Wordmark scales with it. Default 48.
 *   className — pass through.
 *   stacked   — if true, places wordmark BELOW the monogram (centered hero use).
 *               If false (default), places it to the right (navbar / inline use).
 */
export function LogoFull({ size = 48, className = "", stacked = false }) {
  if (stacked) {
    return (
      <div className={`inline-flex flex-col items-center ${className}`}>
        <LogoMark size={size} />
        <Wordmark size={size * 0.42} className="mt-3" />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark size={size} />
      <Wordmark size={size * 0.42} />
    </div>
  );
}

/**
 * "MONEYLEFT" wordmark. "MONEY" in light text, "LEFT" in green.
 * Built as SVG so it scales pixel-perfect with the mark.
 */
function Wordmark({ size = 20, className = "" }) {
  // viewBox sized so 1 unit ≈ 1px height of caps
  return (
    <svg
      viewBox="0 0 200 32"
      height={size}
      width={size * (200 / 32)}
      className={className}
      role="img"
      aria-label="MoneyLeft"
      style={{
        // Use the system font stack for the wordmark — clean, modern, no extra font load
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <text
        x="0"
        y="24"
        fontSize="26"
        fontWeight="700"
        letterSpacing="1"
        fill="currentColor"
      >MONEY</text>
      <text
        x="92"
        y="24"
        fontSize="26"
        fontWeight="700"
        letterSpacing="1"
        fill={GREEN}
      >LEFT</text>
    </svg>
  );
}