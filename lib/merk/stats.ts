/**
 * Skaren Score · category statistics (shape + pure builder)
 *
 * One pass over the product cache per bucket produces the percentile bands; a
 * SECOND pass scores every product with those bands and writes back the median
 * score (the "shelf median" chip). Skipping the second pass leaves shelfMedian
 * undefined, so it is built in two passes on purpose.
 *
 * No thresholds are invented anywhere — every boundary comes out of the real
 * distribution. A nutrient reported on fewer than 60% of a bucket's products is
 * set to null and drops out of that bucket's scoring, with its weight
 * redistributed (scoring a nutrient nobody reports is noise, not information).
 */

import type { BucketStat, CategoryStats, ScoreNutrients, ScoreProduct } from "@/lib/merk/score";
import { skarenScore, rawSkarenScore } from "@/lib/merk/score";

export const MIN_BUCKET = 30;
export const REPORT_THRESHOLD = 0.6; // a nutrient must appear on ≥60% of a bucket

export type StatInputProduct = {
  bucket: string;
  nutrients: ScoreNutrients;
  watchAdditives: number;
  nova?: 1 | 2 | 3 | 4 | null;
};

const NUTRIENT_KEYS: Array<keyof ScoreNutrients> = ["salt", "satFat", "sugar", "protein", "fibre"];

// Percentile by nearest-rank, matching the spec's reference implementation.
export function pctl(xs: number[], q: number): number {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
}

function groupByBucket(products: StatInputProduct[]): Map<string, StatInputProduct[]> {
  const out = new Map<string, StatInputProduct[]>();
  for (const p of products) {
    if (!p.bucket || p.bucket === "unbucketed") continue;
    const list = out.get(p.bucket) ?? [];
    list.push(p);
    out.set(p.bucket, list);
  }
  return out;
}

/**
 * Build the full stats table (both passes). Buckets under MIN_BUCKET products
 * are dropped entirely — they cannot earn a confident number.
 */
export function buildStats(products: StatInputProduct[]): CategoryStats {
  return buildStatsWithDiagnostics(products).stats;
}

/** As buildStats, but also returns the RAW (pre-calibration) score distribution
 *  across the whole catalogue, so the calibration curve can be refitted from
 *  real data (spec section 8). */
export function buildStatsWithDiagnostics(products: StatInputProduct[]): {
  stats: CategoryStats;
  rawScores: number[];
} {
  const buckets = groupByBucket(products);
  const stats: CategoryStats = {};

  // ── Pass 1 — percentile bands ────────────────────────────────────────
  buckets.forEach((list, bucket) => {
    if (list.length < MIN_BUCKET) return;
    const stat: BucketStat = {
      n: list.length,
      salt: null,
      satFat: null,
      sugar: null,
      protein: null,
      fibre: null,
    };
    for (const key of NUTRIENT_KEYS) {
      const xs = list
        .map((p) => p.nutrients[key])
        .filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0);
      if (xs.length < list.length * REPORT_THRESHOLD) continue; // too sparse → null
      stat[key] = { p10: pctl(xs, 0.1), p50: pctl(xs, 0.5), p90: pctl(xs, 0.9) };
    }
    stats[bucket] = stat;
  });

  // ── Pass 2 — shelf median (scoreP50) ─────────────────────────────────
  // Only possible once the bands exist. skarenScore must NOT read shelfMedian.
  const rawScores: number[] = [];
  buckets.forEach((list, bucket) => {
    const stat = stats[bucket];
    if (!stat) return;
    const scores: number[] = [];
    for (const p of list) {
      const input = { bucket, nutrients: p.nutrients, watchAdditives: p.watchAdditives, nova: p.nova ?? null };
      const r = skarenScore(input, stats);
      if (r.score !== null) scores.push(r.score);
      const raw = rawSkarenScore(input, stats);
      if (raw !== null) rawScores.push(raw);
    }
    stat.scoreP50 = scores.length ? Math.round(pctl(scores, 0.5)) : null;
  });

  return { stats, rawScores };
}

export type { CategoryStats, BucketStat, ScoreProduct };
