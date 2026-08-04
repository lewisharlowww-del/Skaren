"use client";

/**
 * NavIcons — the five hand-drawn tab-bar icons from the D1 "The Shelf" canvas.
 *
 * One 24×24 grid, 1.7px stroke, round caps and joins, no fills, rendered at
 * 18px. Path data is copied verbatim from the design canvas rather than
 * substituted from an icon library — mixing sources loses the single-weight
 * consistency the set depends on.
 *
 * Built from two motifs only: the label silhouette and the barcode bar.
 *   History — a clock in an open loop
 *   Lists   — the label card, ruled
 *   Scan    — viewfinder brackets around bars
 *   Stats   — those same bars, freed from the frame
 *   Account — a figure, drawn on the same grid
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
      strokeWidth={1.7}
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
      <path d="M4 12a8 8 0 1 0 2.5-5.8" />
      <path d="M4 4v3.5H7.5" />
      <path d="M12 8v4.4l2.8 1.7" />
    </Svg>
  );
}

export function IconLists(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 6.5h11M9 12h11M9 17.5h11" />
      <path d="M4.2 6.5h.01M4.2 12h.01M4.2 17.5h.01" />
    </Svg>
  );
}

export function IconScan(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 8.5V6a2 2 0 0 1 2-2h2.5M20 8.5V6a2 2 0 0 0-2-2h-2.5M4 15.5V18a2 2 0 0 0 2 2h2.5M20 15.5V18a2 2 0 0 1-2 2h-2.5" />
      <path d="M8 9v6M11 9v6M14 9v6M17 9v6" />
    </Svg>
  );
}

export function IconStats(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 19V11M12 19V5M19 19v-6" />
    </Svg>
  );
}

export function IconAccount(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M5 19.5c1.3-3.2 4-4.8 7-4.8s5.7 1.6 7 4.8" />
    </Svg>
  );
}
