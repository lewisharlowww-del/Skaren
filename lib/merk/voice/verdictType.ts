/**
 * Merk voice engine · verdict types (briefing v2, §2)
 *
 * The failure to design against is RESTATEMENT: a verdict that just reads the
 * table below it aloud. "2,1 g salt, four additives" is not a verdict — it is a
 * row of the nutrition panel, read out.
 *
 * A table can only report. Three things it structurally cannot do, and a
 * verdict must do at least one:
 *   - COMPARE   where this sits among its neighbours ("second-saltiest here")
 *   - CONNECT   two facts that mean something together (two preservatives, one job)
 *   - RANK      which of seven numbers to care about, retiring the other six
 *
 * Skaren picks the verdict TYPE from the brief before the model is called. This
 * is a computed decision, not a creative one — the model only phrases the type
 * it is handed. Priority is top to bottom: the first type whose condition is met
 * wins.
 */

import type { ProductBrief, BriefDriver } from "@/lib/merk/voice/brief";

export type VerdictType =
  | "LIMITED_DATA"
  | "OUTLIER"
  | "REDUNDANCY"
  | "TRADE_OFF"
  | "SHELF_POSITION"
  | "CLEAN";

/** The metric ranking that only a comparison can produce. */
export type VerdictRank = {
  metric: BriefDriver["nutrient"];
  position: number; // 1 = most extreme
  of: number; // bucket size
  direction: "highest" | "lowest";
};

/** The redeeming fact — the strongest metric for its shelf. */
export type VerdictStrongest = { metric: BriefDriver["nutrient"]; percentile: number };

/** Two or more additives sharing a function class. */
export type RedundantGroup = { fn: string; codes: string[] };

export type VerdictAngle = {
  type: VerdictType;
  rank?: VerdictRank;
  strongest?: VerdictStrongest;
  redundantGroups?: RedundantGroup[];
  /** The single driver the verdict should lead with, when one dominates. */
  lead?: BriefDriver;
  /** The one weak driver in a TRADE_OFF, paired with `strongest`. */
  weak?: BriefDriver;
};

const MIN_BUCKET = 30;

// A driver's band mapped to an approximate within-bucket percentile, so
// OUTLIER / strongest can reason without the raw distribution. `highest` sits
// beyond the 90th; `lowest` below the 10th.
const BAND_PERCENTILE: Record<BriefDriver["vsCategory"], number> = {
  highest: 95,
  high: 78,
  typical: 50,
  low: 22,
  lowest: 5,
};

// For a penalty driver (salt/satFat/sugar) a HIGH value is the extreme; for a
// credit driver (protein/fibre) a HIGH value is the strength. This turns a band
// into "how good is this metric for its shelf", 0..100.
function metricGoodness(d: BriefDriver): number {
  const raw = BAND_PERCENTILE[d.vsCategory];
  return d.direction === "penalty" ? 100 - raw : raw;
}

function isExtreme(d: BriefDriver): boolean {
  return d.vsCategory === "highest" || d.vsCategory === "lowest";
}

/**
 * Pick the verdict angle for a brief. Deterministic: the same brief always
 * yields the same type, so the same product always makes the same argument.
 */
export function decideVerdict(brief: ProductBrief): VerdictAngle {
  // 1 · LIMITED_DATA — a thin shelf or missing nutrition. Read the score loosely.
  const thinShelf = brief.categoryN > 0 && brief.categoryN < MIN_BUCKET;
  if (thinShelf || brief.drivers.length === 0) {
    return { type: "LIMITED_DATA" };
  }

  const drivers = brief.drivers;
  const penalties = drivers.filter((d) => d.direction === "penalty");
  const credits = drivers.filter((d) => d.direction === "credit");

  // The redeeming fact, if the brief carries a genuinely strong metric.
  const strongestDriver = [...credits].sort((a, b) => metricGoodness(b) - metricGoodness(a))[0];
  const strongest: VerdictStrongest | undefined = strongestDriver
    ? { metric: strongestDriver.nutrient, percentile: BAND_PERCENTILE[strongestDriver.vsCategory] }
    : undefined;

  // 2 · OUTLIER — one metric beyond the 90th percentile of its bucket. The lead
  // is that extreme metric; the rank (if the brief computed one) is the payload.
  const extreme = penalties.find((d) => d.vsCategory === "highest") ?? penalties.find(isExtreme);
  if (extreme) {
    const rank = parseRank(extreme, brief.categoryN);
    return { type: "OUTLIER", lead: extreme, rank, strongest };
  }

  // 3 · REDUNDANCY — two or more additives share a function class.
  const groups = redundantGroups(brief);
  if (groups.length) {
    return { type: "REDUNDANCY", redundantGroups: groups, strongest };
  }

  // 4 · TRADE_OFF — one metric strong, one weak. The common case.
  const weak = penalties.find((d) => d.vsCategory === "high") ?? penalties[0];
  if (weak && strongestDriver) {
    return { type: "TRADE_OFF", lead: weak, weak, strongest };
  }

  // 5 · SHELF_POSITION — nothing extreme, but the score differs from the shelf
  // median by more than 12 points. "A fair bit better than most here."
  if (Math.abs(brief.score - brief.shelfMedian) > 12) {
    return { type: "SHELF_POSITION", strongest };
  }

  // 6 · CLEAN — no watch additives and nothing above the 75th percentile.
  return { type: "CLEAN", strongest };
}

/** Turn a driver's `rank` string ("2nd of 214") into a structured rank. */
function parseRank(d: BriefDriver, categoryN: number): VerdictRank | undefined {
  const direction: "highest" | "lowest" =
    d.vsCategory === "lowest" || d.vsCategory === "low" ? "lowest" : "highest";
  if (d.rank) {
    const m = d.rank.match(/(\d+)\D+(\d+)/);
    if (m) return { metric: d.nutrient, position: Number(m[1]), of: Number(m[2]), direction };
  }
  // No precomputed rank: still expose the metric + bucket size so the model can
  // say "one of the saltiest here" without inventing a position number.
  if (categoryN >= MIN_BUCKET) return { metric: d.nutrient, position: 0, of: categoryN, direction };
  return undefined;
}

/** Additives sharing a job (the brief's duplicateJobs), grouped with codes. */
function redundantGroups(brief: ProductBrief): RedundantGroup[] {
  const jobs = brief.additives.duplicateJobs ?? [];
  if (!jobs.length) return [];
  const out: RedundantGroup[] = [];
  for (const fn of jobs) {
    const codes = brief.additives.watch.filter((w) => w.job === fn).map((w) => w.code);
    if (codes.length >= 2) out.push({ fn, codes });
  }
  return out;
}
