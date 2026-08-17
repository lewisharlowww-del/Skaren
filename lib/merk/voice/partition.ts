/**
 * Merk voice engine · the separation contract (briefing §13)
 *
 * Observed in production: the verdict and the buy note converge on the same
 * sentence ("no fibre listed, no eco data — check it yourself"). Three faults in
 * one line: it speaks about absences (banned in §2), it repeats across slots,
 * and "check it yourself" deflects the one job Merk exists to do. The cause is
 * structural, not stylistic — both slots read the SAME brief, so on a thin
 * product they both reach for the same leftovers. Prompt-tuning cannot fix a
 * shared-input problem.
 *
 * The fix is to PARTITION the brief. Each slot sees only its own facts, so the
 * overlap becomes impossible instead of merely discouraged:
 *
 *   Verdict (top card)   — "How good is this, against its shelf?"
 *     gets    rank, percentiles, additive count, strongest/weakest, verdict type
 *     NEVER   portion & occasion fields
 *
 *   Buy note (sheet)     — "When would you actually use it?"
 *     gets    portionRole, typicalPortion, occasion, the one decisive trade-off
 *     NEVER   shelf rank & percentiles
 *
 * Absences (no fibre listed, no eco grade) belong to NEITHER slice. They go to a
 * `coverage` array the UI renders as a small grey line under the score. Stated
 * once, by the interface, never by Merk. The fields are deleted from both slices
 * entirely — a fact that is not in a slice cannot be restated.
 */

import type { ProductBrief, BriefDriver } from "@/lib/merk/voice/brief";
import type { VerdictAngle } from "@/lib/merk/voice/verdictType";

/** What the verdict/headline/additiveNote slots may see. Shelf facts only. */
export type VerdictSlice = {
  name: string;
  brand: string;
  /** The human shelf noun for the "for a X" clause. Never a bucket key. */
  categoryNoun?: { en: string; nb: string };
  categoryN: number;
  score: number;
  shelfMedian: number;
  percentile: number;
  drivers: BriefDriver[];
  additives: ProductBrief["additives"];
  processing: ProductBrief["processing"];
  allergens: string[];
  verdict?: VerdictAngle;
};

/** What the wouldMerkBuy slot may see. Portion and occasion only — never a
 *  shelf rank, never a percentile, never a raw gram value. */
export type BuyNoteSlice = {
  name: string;
  brand: string;
  categoryNoun?: { en: string; nb: string };
  portionRole?: ProductBrief["portionRole"];
  typicalPortion?: string;
  /** The single decisive trade-off, qualitative only: which nutrient pulls the
   *  product which way. No value, no rank, no percentile — those are the
   *  verdict's, and the buy note answers "when", not "how good". */
  decisiveTradeoff?: {
    nutrient: BriefDriver["nutrient"];
    vsCategory: BriefDriver["vsCategory"];
    direction: BriefDriver["direction"];
  };
};

export type BriefPartition = {
  verdict: VerdictSlice;
  buyNote: BuyNoteSlice;
  /** Absences — rendered by the UI under the score, never spoken by Merk. */
  coverage: string[];
};

// Human labels for the coverage line the UI renders. English + Norwegian.
const COVERAGE_LABEL: Record<string, { en: string; nb: string }> = {
  fibre: { en: "fibre", nb: "fiber" },
  fiber: { en: "fibre", nb: "fiber" },
  protein: { en: "protein", nb: "protein" },
  salt: { en: "salt", nb: "salt" },
  sugar: { en: "sugar", nb: "sukker" },
  satFat: { en: "saturated fat", nb: "mettet fett" },
  eco: { en: "eco", nb: "miljø" },
};

/**
 * Split a finished brief into two non-overlapping slices plus a coverage list.
 *
 * The decisive trade-off handed to the buy note is the brief's lead concern
 * (the driver the verdict leads with) expressed qualitatively — the nutrient and
 * its band, but not its value. That lets the buy note say "the salt is what
 * separates it" without ever printing a gram figure the verdict already owns.
 */
export function partitionBrief(brief: ProductBrief): BriefPartition {
  const verdict: VerdictSlice = {
    name: brief.name,
    brand: brief.brand,
    ...(brief.categoryNoun ? { categoryNoun: brief.categoryNoun } : {}),
    categoryN: brief.categoryN,
    score: brief.score,
    shelfMedian: brief.shelfMedian,
    percentile: brief.percentile,
    drivers: brief.drivers,
    additives: brief.additives,
    processing: brief.processing,
    allergens: brief.allergens,
    ...(brief.verdict ? { verdict: brief.verdict } : {}),
  };

  // The one decisive trade-off, qualitative. Prefer the verdict's declared lead
  // (a penalty driver in an OUTLIER/TRADE_OFF); fall back to the top driver.
  const lead = brief.verdict?.lead ?? brief.verdict?.weak ?? brief.drivers[0];
  const buyNote: BuyNoteSlice = {
    name: brief.name,
    brand: brief.brand,
    ...(brief.categoryNoun ? { categoryNoun: brief.categoryNoun } : {}),
    ...(brief.portionRole ? { portionRole: brief.portionRole } : {}),
    ...(brief.typicalPortion ? { typicalPortion: brief.typicalPortion } : {}),
    ...(lead
      ? {
          decisiveTradeoff: {
            nutrient: lead.nutrient,
            vsCategory: lead.vsCategory,
            direction: lead.direction,
          },
        }
      : {}),
  };

  return { verdict, buyNote, coverage: brief.dataGaps ?? [] };
}

/**
 * The coverage line the UI shows under the score, e.g.
 * "Fibre and eco not in the catalogue for this product." Stated by the
 * interface, never by Merk. Returns null when there is nothing missing.
 */
export function coverageLine(coverage: string[], lang: "en" | "nb"): string | null {
  if (!coverage.length) return null;
  const names = coverage.map((c) => COVERAGE_LABEL[c]?.[lang] ?? c);
  const list =
    names.length === 1
      ? names[0]
      : lang === "nb"
        ? names.slice(0, -1).join(", ") + " og " + names[names.length - 1]
        : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
  const cap = list.charAt(0).toUpperCase() + list.slice(1);
  return lang === "nb"
    ? `${cap} står ikke i katalogen for dette produktet.`
    : `${cap} not in the catalogue for this product.`;
}
