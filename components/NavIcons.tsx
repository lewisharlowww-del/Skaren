"use client";

/**
 * NavIcons — the five tab-bar icons from canvas 9A, "Five icons, one grid,
 * one weight".
 *
 * 24 px box · 1,75 px stroke · round caps and joins · 18 px in the bar, 26 px
 * anywhere else. Path data is copied verbatim from the canvas rather than
 * substituted from an icon library — mixing sources loses the single-weight
 * consistency the set depends on.
 *
 * Built from two motifs only: the label silhouette and the barcode bar.
 *   History — clock inside an open loop
 *   Lists   — a label card with three rules
 *   Scan    — viewfinder brackets + three bars (the only icon with two ideas)
 *   Stats   — those same bars, no axis, freed from the frame
 *   Account — a folded-corner label, landscape: Merk without a face
 */

type IconProps = {
  size?: number;
  className?: string;
};

function Svg({ size = 18, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function IconHistory(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.2 12a7.8 7.8 0 1 0 2.4-5.65" />
      <path d="M4.2 4.6v3.9h3.9" />
      <path d="M12 7.6V12l2.9 1.9" />
    </Svg>
  );
}

export function IconLists(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5.2 6.6a3 3 0 0 1 3-3h7.6a3 3 0 0 1 3 3v10.8a3 3 0 0 1-3 3H8.2a3 3 0 0 1-3-3z" />
      <path d="M8.8 9.2h6.4" />
      <path d="M8.8 12.6h6.4" />
      <path d="M8.8 16h4" />
    </Svg>
  );
}

export function IconScan(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.6 8.4V6.2a2.6 2.6 0 0 1 2.6-2.6h2.2" />
      <path d="M20.4 8.4V6.2a2.6 2.6 0 0 0-2.6-2.6h-2.2" />
      <path d="M3.6 15.6v2.2a2.6 2.6 0 0 0 2.6 2.6h2.2" />
      <path d="M20.4 15.6v2.2a2.6 2.6 0 0 1-2.6 2.6h-2.2" />
      <path d="M8.6 8.6v6.8" />
      <path d="M12 8.6v6.8" />
      <path d="M15.4 8.6v6.8" />
    </Svg>
  );
}

export function IconStats(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5.4 19.4v-5.2" />
      <path d="M12 19.4V4.6" />
      <path d="M18.6 19.4v-8.6" />
    </Svg>
  );
}

export function IconAccount(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.8 9.2a3 3 0 0 1 3-3h8.1l5.3 5.4v5.2a3 3 0 0 1-3 3H6.8a3 3 0 0 1-3-3z" />
      <path d="M14.9 6.2v5.4h5.3" />
      <path d="M8 11.9v3.8" />
      <path d="M11.2 11.9v3.8" />
    </Svg>
  );
}
