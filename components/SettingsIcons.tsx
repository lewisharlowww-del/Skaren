"use client";

/**
 * Settings icons — language & appearance (canvas 22A).
 *
 * Same grid as the tab bar: 24×24, 1.7 stroke, round caps and joins, no fills
 * (except where the design says ink). Rules from the canvas:
 *  - Language NEVER uses a flag — Merk's body carries the one letter Å.
 *  - Light is a sun with four ticks (eight smudge at small sizes).
 *  - Dark is a single-stroke moon.
 *  - Auto is a half-inked circle — the literal picture of "both".
 *  - The appearance ROW icon is Merk's silhouette: outlined = paper/light,
 *    filled = ink/dark. Sun/moon live inside the segmented control only.
 *  - Selection is shown by the pill moving, never by recoloring an icon green.
 */

type IconProps = { size?: number; color?: string };

const STROKE = 1.7;

/** Merk's body carrying the letter Å — the language icon. */
export function LanguageIcon({ size = 24, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {/* body with folded corner */}
      <path
        d="M5 5.8C5 4.8 5.8 4 6.8 4H14l5 5v9.2c0 1-.8 1.8-1.8 1.8H6.8c-1 0-1.8-.8-1.8-1.8V5.8Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 4v5h5" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
      {/* Å */}
      <path d="M9.6 16.6 12 10.8l2.4 5.8" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 14.7h3" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <circle cx="12" cy="9" r="0.9" stroke={color} strokeWidth={1.2} />
    </svg>
  );
}

/** Sun with four ticks — light mode. */
export function SunIcon({ size = 24, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4.2" stroke={color} strokeWidth={STROKE} />
      <path d="M12 4.2v2" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <path d="M12 17.8v2" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <path d="M4.2 12h2" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <path d="M17.8 12h2" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </svg>
  );
}

/** Single-stroke moon — dark mode. */
export function MoonIcon({ size = 24, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M19 14.2A7.4 7.4 0 0 1 9.8 5 7.4 7.4 0 1 0 19 14.2Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Half-inked circle — auto. The vertical split is the literal picture of both. */
export function AutoIcon({ size = 24, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="7.2" stroke={color} strokeWidth={STROKE} />
      <path d="M12 4.8a7.2 7.2 0 0 1 0 14.4Z" fill={color} />
    </svg>
  );
}

/**
 * Merk's silhouette for the appearance ROW icon (a caption sits next to it).
 * Outlined = paper label = light; filled = ink label = dark.
 */
export function AppearanceIcon({ size = 24, color = "currentColor", filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 6.8C5 5.8 5.8 5 6.8 5h8.4L19 8.8v8.4c0 1-.8 1.8-1.8 1.8H6.8c-1 0-1.8-.8-1.8-1.8V6.8Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
        fill={filled ? color : "none"}
      />
      {/* eyes + smile; paper-on-ink when filled */}
      <circle cx="9.6" cy="11" r="1" fill={filled ? "var(--sk-surface-white)" : color} stroke="none" />
      <circle cx="14.4" cy="11" r="1" fill={filled ? "var(--sk-surface-white)" : color} stroke="none" />
      <path
        d="M10 14.4c.5.6 1.2.9 2 .9s1.5-.3 2-.9"
        stroke={filled ? "var(--sk-surface-white)" : color}
        strokeWidth={1.4}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
