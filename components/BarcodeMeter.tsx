"use client";

/**
 * BarcodeMeter — the grade shown as barcode density, not a coloured tint.
 *
 * From the locked "Merk gir svar" direction: the A-E letter stays ink, and a
 * little cluster of barcode bars beside it carries the severity. A strong grade
 * is many tall even bars; a weak grade is few short sparse bars. Colour never
 * carries meaning alone (accessibility) — bar COUNT and HEIGHT do.
 */

import type { GradeLetter } from "@/lib/types";

type BarSpec = { w: number; h: number };

// Bar patterns per grade. Good = dense + tall + even; weak = sparse + short.
const PATTERNS: Record<GradeLetter, BarSpec[]> = {
  A: [
    { w: 3, h: 15 }, { w: 2, h: 22 }, { w: 4, h: 18 }, { w: 2, h: 22 },
    { w: 3, h: 13 }, { w: 2, h: 20 }, { w: 3, h: 22 },
  ],
  B: [
    { w: 3, h: 14 }, { w: 2, h: 20 }, { w: 3, h: 17 }, { w: 2, h: 21 }, { w: 3, h: 15 },
  ],
  C: [
    { w: 3, h: 16 }, { w: 2, h: 18 }, { w: 3, h: 13 }, { w: 2, h: 17 },
  ],
  D: [
    { w: 3, h: 14 }, { w: 2, h: 22 }, { w: 3, h: 11 },
  ],
  E: [
    { w: 3, h: 12 }, { w: 2, h: 18 },
  ],
};

// Good grades use ink/forest; weaker grades fade to muted (opacity, not red).
const BAR_COLOUR: Record<GradeLetter, string> = {
  A: "var(--sk-brand-forest)",
  B: "var(--sk-brand-forest)",
  C: "var(--sk-text-muted)",
  D: "var(--sk-text-faint)",
  E: "var(--sk-text-faint)",
};

export function BarcodeMeter({ grade, gap = 2.5 }: { grade: GradeLetter | null; gap?: number }) {
  if (!grade) {
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: 7, height: 22 }} aria-hidden>
        <span style={{ width: 3, height: 12, background: "var(--sk-border-default)" }} />
        <span style={{ width: 2, height: 18, background: "var(--sk-border-default)" }} />
      </div>
    );
  }
  const bars = PATTERNS[grade];
  const colour = BAR_COLOUR[grade];
  // Weaker grades widen the gap so the cluster reads sparse.
  const effGap = grade === "D" || grade === "E" ? 7 : gap;
  return (
    <div
      style={{ display: "flex", alignItems: "flex-end", gap: effGap, height: 22 }}
      role="img"
      aria-label={`Grade ${grade}`}
    >
      {bars.map((b, i) => (
        <span key={i} style={{ width: b.w, height: b.h, background: colour, borderRadius: 0.5 }} />
      ))}
    </div>
  );
}
