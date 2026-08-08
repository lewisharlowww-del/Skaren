/**
 * Skaren Score · the formula
 *
 * Answers one question: "is this a good ONE OF THESE?" — never "is this a good
 * food?". A product is scored against its own bucket (section 2), so olive oil
 * is judged among oils and cheese among cheeses.
 *
 * Three parts, nothing else:
 *   1. a nutrition percentile within the bucket,
 *   2. an additive penalty (watch-listed only, saturating),
 *   3. a processing penalty (small on purpose — NOVA is method, not nutrition).
 *
 * Pure: no I/O, no clock, no network. The stats table is passed in.
 */

import { calibrate } from "@/lib/merk/calibration";

export type Band = { p10: number; p50: number; p90: number };

export type BucketStat = {
  n: number;
  salt: Band | null;
  satFat: Band | null;
  sugar: Band | null;
  protein: Band | null;
  fibre: Band | null;
  /** Median displayed score in the bucket — the "shelf median" chip. Filled in
   *  the stats builder's SECOND pass, so it is absent during the first. */
  scoreP50?: number | null;
};

export type CategoryStats = Record<string, BucketStat>;

export type ScoreNutrients = {
  salt?: number | null;
  satFat?: number | null;
  sugar?: number | null;
  protein?: number | null;
  fibre?: number | null;
};

export type ScoreProduct = {
  bucket: string;
  nutrients: ScoreNutrients;
  /** Watch-listed additive count (see watchlist.ts). */
  watchAdditives: number;
  nova?: 1 | 2 | 3 | 4 | null;
};

export type ScoreBreakdown = {
  /** 0-100 nutrition position within the bucket, before penalties. */
  nutrition: number;
  additivePenalty: number;
  processingPenalty: number;
  /** Sum of the nutrient weights actually used (nutrients present + reported). */
  used: number;
  /** Per-nutrient percentile, for the "how this scored" bars. */
  percentiles: Partial<Record<keyof ScoreNutrients, number>>;
};

export type ScoreResult =
  | {
      score: number;
      bucket: string;
      n: number;
      shelfMedian: number | null;
      confidence: "full";
      breakdown: ScoreBreakdown;
    }
  | {
      score: null;
      bucket: string;
      confidence: "limited";
      reason: "no-category" | "thin-category";
    };

const MIN_BUCKET = 30;

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

// Position within the bucket, 100 = best in category. `lowerIsBetter` flips the
// direction for salt / satFat / sugar.
export function pct(v: number, s: Band, lowerIsBetter: boolean): number {
  const raw = (100 * (v - s.p10)) / (s.p90 - s.p10 || 1);
  return clamp(lowerIsBetter ? 100 - raw : raw);
}

export const WEIGHTS: Record<keyof ScoreNutrients, number> = {
  salt: 0.3,
  satFat: 0.25,
  sugar: 0.2,
  protein: 0.15,
  fibre: 0.1,
};

export const LOWER_IS_BETTER = new Set<keyof ScoreNutrients>(["salt", "satFat", "sugar"]);

// The additive penalty saturates: five watch-listed additives is not five times
// worse than one. 0 → 0, 1 → 8, 2 → 14, 3 → 20, capped at 25.
export function additivePenalty(watchCount: number): number {
  return watchCount === 0 ? 0 : Math.min(25, 8 + 6 * (watchCount - 1));
}

// Small on purpose. NOVA describes the method, not the nutrition, and cheese is
// NOVA 3 by definition. NOVA 4 (ultra-processing) is a formulation choice, so it
// earns the larger nudge.
const PROCESSING_PENALTY: Record<1 | 2 | 3 | 4, number> = { 1: 0, 2: 0, 3: 4, 4: 12 };
export function processingPenalty(nova: 1 | 2 | 3 | 4 | null | undefined): number {
  return nova ? PROCESSING_PENALTY[nova] ?? 0 : 0;
}

function limitedData(p: ScoreProduct): ScoreResult {
  return {
    score: null,
    bucket: p.bucket,
    confidence: "limited",
    reason: p.bucket === "unbucketed" ? "no-category" : "thin-category",
  };
}

/**
 * The RAW (pre-calibration) 0-100 score for a product, or null in limited-data
 * mode. Exposed so the stats builder can refit the calibration curve from the
 * real catalogue-wide distribution (spec section 8). Same math as skarenScore,
 * minus the calibration step.
 */
export function rawSkarenScore(p: ScoreProduct, stats: CategoryStats): number | null {
  const s = stats[p.bucket];
  if (!s || s.n < MIN_BUCKET) return null;
  let sum = 0;
  let used = 0;
  for (const key of Object.keys(WEIGHTS) as Array<keyof ScoreNutrients>) {
    const band = s[key];
    const v = p.nutrients[key];
    if (!band || typeof v !== "number") continue;
    sum += WEIGHTS[key] * pct(v, band, LOWER_IS_BETTER.has(key));
    used += WEIGHTS[key];
  }
  if (used < 0.5) return null;
  const nutrition = sum / used;
  return clamp(nutrition - additivePenalty(p.watchAdditives) - processingPenalty(p.nova ?? null));
}

/**
 * Score one product against its bucket. Returns a full result with a breakdown,
 * or the limited-data shape (score: null) when the bucket is too thin or too
 * little nutrition is reported to judge on.
 */
export function skarenScore(p: ScoreProduct, stats: CategoryStats): ScoreResult {
  const s = stats[p.bucket];
  if (!s || s.n < MIN_BUCKET) return limitedData(p);

  // 1 — nutrition, renormalised over whatever this bucket reports.
  let sum = 0;
  let used = 0;
  const percentiles: Partial<Record<keyof ScoreNutrients, number>> = {};
  for (const key of Object.keys(WEIGHTS) as Array<keyof ScoreNutrients>) {
    const band = s[key];
    const v = p.nutrients[key];
    if (!band || typeof v !== "number") continue;
    const p100 = pct(v, band, LOWER_IS_BETTER.has(key));
    percentiles[key] = Math.round(p100);
    sum += WEIGHTS[key] * p100;
    used += WEIGHTS[key];
  }
  if (used < 0.5) return limitedData(p); // too little to judge on

  const nutrition = sum / used; // 0-100

  // 2 — additives (watch-listed only, saturating).
  const addPen = additivePenalty(p.watchAdditives);

  // 3 — processing (small).
  const procPen = processingPenalty(p.nova ?? null);

  const raw = clamp(nutrition - addPen - procPen);
  const score = Math.round(calibrate(raw));

  return {
    score,
    bucket: p.bucket,
    n: s.n,
    shelfMedian: s.scoreP50 ?? null,
    confidence: "full",
    breakdown: {
      nutrition: Math.round(nutrition),
      additivePenalty: addPen,
      processingPenalty: procPen,
      used: Math.round(used * 100) / 100,
      percentiles,
    },
  };
}
