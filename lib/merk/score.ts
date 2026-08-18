/**
 * Skaren Score · the formula (v2 — five layers)
 *
 * Answers one question: "is this a good ONE OF THESE?" — never "is this a good
 * food?". A product is scored against its own bucket, so olive oil is judged
 * among oils and cheese among cheeses. v2 adds four things v1 lacked and bounds
 * the relative engine so the least-bad crisp cannot read as good food:
 *
 *   0 · bucket + profile   which nutrient profile this bucket is judged by
 *   1 · nutrition base     weighted percentiles inside the bucket        0..100
 *   2 · ingredient signals discrete facts read off the ingredient list   −12..+12
 *   3 · additive load      tiered watch list + same-job redundancy        −28..0
 *   4 · processing         NOVA 4 only, small                              −4..0
 *   5 · ceiling + band     clamp to the category's honest maximum, band   final
 *
 * Pure: no I/O, no clock, no network. The stats table is passed in.
 *
 * Backward compatibility: every v1 export keeps its name and shape. v2 fields
 * are additive. A caller that passes no `profile`, `ingredients` or `additives`
 * gets the v1 behaviour (global WEIGHTS, flat additive penalty from a count),
 * so the existing fixtures and stats builder keep working unchanged.
 */

import { calibrate } from "@/lib/merk/calibration";
import { PROFILES, DIR, type ProfileName, type Nutrient } from "@/lib/merk/profiles";
import { CEILING, FLOOR, MODE_OF, PROFILE_OF, type ScoreMode } from "@/lib/merk/buckets";
import { ingredientSignals, type IngredientSignal } from "@/lib/merk/ingredients";
import { additiveLoad, resolveAdditives, type AdditiveLoad } from "@/lib/merk/additiveLoad";

export type Band = { p10: number; p50: number; p90: number };

export type BucketStat = {
  n: number;
  salt: Band | null;
  satFat: Band | null;
  sugar: Band | null;
  protein: Band | null;
  fibre: Band | null;
  /** Energy (kcal/100 g) spread, for the drinkSweet profile. Optional. */
  energy?: Band | null;
  /** Median displayed score in the bucket — the "shelf median" chip. Filled in
   *  the stats builder's SECOND pass, so it is absent during the first. */
  scoreP50?: number | null;
  /** All displayed scores in the bucket, sorted — for percentileRank ("better
   *  than 71%"). Filled in the second pass; optional so pass 1 stays valid. */
  scores?: number[];
};

export type CategoryStats = Record<string, BucketStat>;

export type ScoreNutrients = {
  salt?: number | null;
  satFat?: number | null;
  sugar?: number | null;
  protein?: number | null;
  fibre?: number | null;
  energy?: number | null;
};

export type ScoreProduct = {
  bucket: string;
  nutrients: ScoreNutrients;
  /** Watch-listed additive count (v1 path, still honoured when no codes given). */
  watchAdditives: number;
  nova?: 1 | 2 | 3 | 4 | null;
  /** v2 — the raw ingredient string, for the ingredient-signal layer. */
  ingredients?: string | null;
  /** v2 — the product's additive E-codes, for the tiered additive layer. When
   *  present this REPLACES the flat watchAdditives penalty. */
  additiveCodes?: string[] | null;
};

export type ScoreBreakdownRow = {
  label: string;
  value: number;
  kind: "base" | "signal" | "additives" | "processing" | "ceiling";
  /** The fact behind the row, for the "how this scored" sheet. */
  detail?: string;
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
  /** v2 — the ingredient-signal total (−12..+12). */
  ingredientTotal: number;
  /** v2 — each ingredient signal, cited. */
  ingredientSignals: IngredientSignal[];
  /** v2 — the waterfall rows (base, signals, additives, processing, ceiling). */
  rows: ScoreBreakdownRow[];
};

export type Band5 = "poor" | "weak" | "middling" | "good" | "excellent";

export type ScoreResult =
  | {
      score: number;
      bucket: string;
      n: number;
      shelfMedian: number | null;
      confidence: "full";
      breakdown: ScoreBreakdown;
      /** v2 — the coarse band; the UI leads with this where space allows. */
      band: Band5;
      /** v2 — true when the category ceiling clamped the number. */
      ceilingApplied: boolean;
      /** v2 — the ceiling value that applied, for the sheet's ceiling row. */
      ceiling: number;
      /** v2 — "better than N% of the shelf", or null when scores are absent.
       *  v2.1 (audit D4) — also null when the rank disagrees with the band or the
       *  shelf is too tight to rank; `rankSuppressed` then says why. */
      rank: number | null;
      /** audit D4 — why rank was withheld, so the card shows the explaining fact
       *  instead of a number that contradicts the band. */
      rankSuppressed: "tight-shelf" | "disagrees" | null;
      /** v2 — the scoring mode used (scored | plain). */
      mode: ScoreMode;
      version: string;
    }
  | {
      score: null;
      bucket: string;
      confidence: "limited";
      reason: "no-category" | "thin-category" | "no-ingredients" | "no-nutrition";
      /** v2 — set when the bucket is intentionally excluded (spice, water…). */
      excluded?: boolean;
      mode?: ScoreMode;
      version: string;
    };

export const SCORE_VERSION = "2.0.0";

const MIN_BUCKET = 30;

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

// Position within the bucket, 100 = best in category. `lowerIsBetter` flips the
// direction for salt / satFat / sugar / energy.
export function pct(v: number, s: Band, lowerIsBetter: boolean): number {
  const raw = (100 * (v - s.p10)) / (s.p90 - s.p10 || 1);
  return clamp(lowerIsBetter ? 100 - raw : raw);
}

// v1 global weights — the fallback when a bucket has no profile (keeps the old
// fixtures and any caller that does not pass a profile working unchanged).
export const WEIGHTS: Record<keyof ScoreNutrients, number> = {
  salt: 0.3,
  satFat: 0.25,
  sugar: 0.2,
  protein: 0.15,
  fibre: 0.1,
  energy: 0,
};

export const LOWER_IS_BETTER = new Set<keyof ScoreNutrients>(["salt", "satFat", "sugar", "energy"]);

// The v1 additive penalty saturates: five watch-listed additives is not five
// times worse than one. 0 → 0, 1 → 8, 2 → 14, 3 → 20, capped at 25. Used only
// when the caller passes a COUNT rather than the additive codes.
export function additivePenalty(watchCount: number): number {
  return watchCount === 0 ? 0 : Math.min(25, 8 + 6 * (watchCount - 1));
}

// Small on purpose. NOVA describes the method, not the nutrition, and cheese is
// NOVA 3 by definition. v2 §4: only NOVA 4 is penalised, and only by 4 points.
export function processingPenalty(nova: 1 | 2 | 3 | 4 | null | undefined): number {
  return nova === 4 ? 4 : 0;
}

/** Which profile weights to use: the bucket's profile when one is given, else
 *  the v1 global WEIGHTS. Returns [nutrient, weight] pairs oriented by DIR. */
function weightsFor(profile: ProfileName | null): Array<[keyof ScoreNutrients, number, boolean]> {
  if (profile) {
    return (Object.entries(PROFILES[profile]) as Array<[Nutrient, number]>).map(
      ([nutrient, w]) => [nutrient, w, DIR[nutrient] === "down"]
    );
  }
  return (Object.keys(WEIGHTS) as Array<keyof ScoreNutrients>)
    .filter((k) => WEIGHTS[k] > 0)
    .map((k) => [k, WEIGHTS[k], LOWER_IS_BETTER.has(k)]);
}

/** The nutrition base (0..100) plus the weight actually covered. Renormalised
 *  over whatever the bucket reports, so a missing figure drops its weight rather
 *  than punishing the product. Returns null when under half the weight is present. */
function nutritionBase(
  p: ScoreProduct,
  s: BucketStat,
  profile: ProfileName | null
): { value: number; coverage: number; percentiles: Partial<Record<keyof ScoreNutrients, number>> } | null {
  let sum = 0;
  let used = 0;
  const percentiles: Partial<Record<keyof ScoreNutrients, number>> = {};
  for (const [key, w, lowerIsBetter] of weightsFor(profile)) {
    const band = (s as unknown as Record<string, Band | null | undefined>)[key];
    const v = p.nutrients[key];
    if (!band || typeof v !== "number") continue;
    const p100 = pct(v, band, lowerIsBetter);
    percentiles[key] = Math.round(p100);
    sum += w * p100;
    used += w;
  }
  if (used < 0.5) return null;
  return { value: sum / used, coverage: used, percentiles };
}

/** Plain buckets (chicken, salmon, eggs) are nutritionally near-identical, so
 *  raw percentiles there are mostly noise. Flatten into 70..100 so real
 *  differences still separate but measurement noise does not (spec §13). */
function flattenPlain(base: number): number {
  return 70 + 0.3 * base;
}

function bandOf(value: number): Band5 {
  if (value < 25) return "poor";
  if (value < 45) return "weak";
  if (value < 60) return "middling";
  if (value < 75) return "good";
  return "excellent";
}

/** "better than N%" — the share of the bucket's displayed scores below `value`.
 *  Uses the sorted `scores` written by the stats builder's second pass. */
function percentileRank(value: number, scores: number[] | undefined): number | null {
  if (!scores || scores.length === 0) return null;
  let below = 0;
  for (const s of scores) if (s < value) below++;
  return Math.round((100 * below) / scores.length);
}

/**
 * Rank, honesty-gated (audit D4). The band is an ABSOLUTE judgement; the rank is
 * a RELATIVE one. On a shelf where everything is good (cod, prawns) or everything
 * is poor (bread) the two genuinely disagree — a 95 that "beats 54%", an 86
 * "excellent" that trails its own median. Both are correct; printing them side by
 * side is the trust defect. So we only surface the rank when it agrees in
 * direction with the score, and never on a tight shelf where a percentile is
 * describing noise.
 *
 * Returns { rank, suppressed } — rank is null when suppressed, with a reason the
 * brief/UI can turn into the fact that explains it ("this shelf is tightly
 * packed") instead of a contradictory number.
 */
function gatedRank(
  value: number,
  displayScores: number[] | undefined
): { rank: number | null; suppressed: "tight-shelf" | "disagrees" | null } {
  const raw = percentileRank(value, displayScores);
  if (raw == null) return { rank: null, suppressed: null };

  // Tight shelf: if the displayed scores span under 15 points p10..p90, a
  // percentile is measurement noise, not quality. Suppress rank language.
  if (displayScores && displayScores.length >= 8) {
    const sorted = displayScores; // already sorted by the builder
    const p10 = sorted[Math.floor(0.1 * sorted.length)];
    const p90 = sorted[Math.min(sorted.length - 1, Math.floor(0.9 * sorted.length))];
    if (p90 - p10 < 15) return { rank: null, suppressed: "tight-shelf" };
  }

  // Direction check: the score and the rank must both sit above the midpoint or
  // both below it. When they disagree the shelf is lopsided, and the rank would
  // contradict the band on the card.
  const scoreAbove = value >= 50;
  const rankAbove = raw >= 50;
  if (scoreAbove !== rankAbove) return { rank: null, suppressed: "disagrees" };

  return { rank: raw, suppressed: null };
}

function limitedData(p: ScoreProduct, reason?: "no-category" | "thin-category" | "no-ingredients" | "no-nutrition"): ScoreResult {
  const r =
    reason ?? (p.bucket === "unbucketed" || p.bucket === "uncategorised" ? "no-category" : "thin-category");
  return { score: null, bucket: p.bucket, confidence: "limited", reason: r, version: SCORE_VERSION };
}

function excluded(p: ScoreProduct): ScoreResult {
  return {
    score: null,
    bucket: p.bucket,
    confidence: "limited",
    reason: "no-category",
    excluded: true,
    mode: "excluded",
    version: SCORE_VERSION,
  };
}

/**
 * The RAW (pre-calibration, pre-ceiling) 0-100 score, or null in limited-data
 * mode. Exposed so the stats builder can refit the calibration curve from the
 * real catalogue distribution (spec §8), and so the alternatives engine can
 * sort on the un-clamped value. Same math as skarenScore minus calibrate/ceil.
 */
export function rawSkarenScore(p: ScoreProduct, stats: CategoryStats): number | null {
  const mode = MODE_OF(p.bucket);
  if (mode === "excluded") return null;
  const s = stats[p.bucket];
  if (!s || s.n < MIN_BUCKET) return null;

  const profile = mode === "plain" ? null : PROFILE_OF(p.bucket);
  const base = nutritionBase(p, s, profile);
  if (!base) return null;

  let nutrition = base.value;
  if (mode === "plain") {
    nutrition = flattenPlain(nutrition);
    return clamp(nutrition); // plain: no signals, no additives, no processing
  }

  const signals = ingredientSignals(p.ingredients);
  const additives = additiveLoadFor(p);
  const process = processingPenalty(p.nova ?? null);
  return clamp(nutrition + signals.total + additives.total - process);
}

/** The additive layer for a product: the tiered load when codes are present,
 *  else the v1 flat penalty from the watch count (as a negative load). */
function additiveLoadFor(p: ScoreProduct): AdditiveLoad {
  if (p.additiveCodes && p.additiveCodes.length) {
    return additiveLoad(resolveAdditives(p.additiveCodes));
  }
  // v1 fallback: turn the saturating count penalty into the same shape.
  const total = -additivePenalty(p.watchAdditives);
  return { total: Math.max(total, -28), tier1: 0, tier2: p.watchAdditives, redundantJobs: [] };
}

/**
 * Score one product against its bucket. Returns a full result with a v2
 * breakdown, or the limited-data shape (score: null) when the bucket is
 * excluded, too thin, or too little is reported to judge on.
 */
export function skarenScore(p: ScoreProduct, stats: CategoryStats): ScoreResult {
  const mode = MODE_OF(p.bucket);
  if (mode === "excluded") return excluded(p);

  const s = stats[p.bucket];
  if (!s || s.n < MIN_BUCKET) return limitedData(p);

  const profile = mode === "plain" ? null : PROFILE_OF(p.bucket);
  const base = nutritionBase(p, s, profile);
  if (!base) return limitedData(p, "no-nutrition"); // bucket is fine, the label is not

  // ── Layer 1 · nutrition base ─────────────────────────────────────────
  let nutrition = base.value;
  const rows: ScoreBreakdownRow[] = [];

  let signalsTotal = 0;
  let signalItems: IngredientSignal[] = [];
  let additives: AdditiveLoad = { total: 0, tier1: 0, tier2: 0, redundantJobs: [] };
  let process = 0;

  if (mode === "plain") {
    nutrition = flattenPlain(nutrition);
    rows.push({ label: "Nutrition vs shelf", value: Math.round(nutrition), kind: "base", detail: "flattened for a whole food" });
  } else {
    rows.push({ label: "Nutrition vs shelf", value: Math.round(nutrition), kind: "base" });

    // ── Layer 2 · ingredient signals ───────────────────────────────────
    const signals = ingredientSignals(p.ingredients);
    signalsTotal = signals.total;
    signalItems = signals.items;
    for (const item of signals.items) {
      rows.push({ label: item.label, value: item.points, kind: "signal", detail: item.cite });
    }

    // ── Layer 3 · additive load ────────────────────────────────────────
    additives = additiveLoadFor(p);
    if (additives.total !== 0) {
      const detailParts: string[] = [];
      if (additives.tier1) detailParts.push(`${additives.tier1} to limit`);
      if (additives.tier2) detailParts.push(`${additives.tier2} to watch`);
      if (additives.redundantJobs.length)
        detailParts.push(`${additives.redundantJobs.length} same-job group`);
      rows.push({ label: "Additives", value: additives.total, kind: "additives", detail: detailParts.join(", ") || undefined });
    }

    // ── Layer 4 · processing ───────────────────────────────────────────
    process = processingPenalty(p.nova ?? null);
    if (process) rows.push({ label: "Processing", value: -process, kind: "processing", detail: "NOVA 4" });
  }

  // ── Layer 5 · calibrate, THEN ceiling (order matters, §7) ────────────
  // Plain buckets are "nutrition base and ceiling only" (§13). Their base is
  // deliberately flattened into 70..100; the calibration curve is fit to the
  // SCORED distribution, so applying it here would re-compress that band and
  // undo the flatten. Plain therefore skips calibration and clamps to the
  // ceiling directly.
  const raw = clamp(nutrition + signalsTotal + additives.total - process);
  const calibrated = mode === "plain" ? raw : calibrate(raw);
  const ceiling = CEILING(p.bucket);
  const ceilingApplied = calibrated > ceiling;
  const capped = Math.min(calibrated, ceiling);
  const value = Math.round(clamp(capped, FLOOR, 100)); // round only at the very end

  if (ceilingApplied) {
    rows.push({ label: "Category ceiling", value: ceiling, kind: "ceiling", detail: "top of its shelf, still this category" });
  }

  // audit D4 — rank is gated against the band's direction and the shelf's
  // tightness on the DISPLAYED score, so the card never prints a percentile that
  // argues with the word beside it.
  const { rank, suppressed: rankSuppressed } = gatedRank(value, s.scores);

  return {
    score: value,
    bucket: p.bucket,
    n: s.n,
    shelfMedian: s.scoreP50 ?? null,
    confidence: "full",
    band: bandOf(value),
    ceilingApplied,
    ceiling,
    rank,
    rankSuppressed,
    mode,
    version: SCORE_VERSION,
    breakdown: {
      nutrition: Math.round(nutrition),
      additivePenalty: additives.total,
      processingPenalty: -process,
      used: Math.round(base.coverage * 100) / 100,
      percentiles: base.percentiles,
      ingredientTotal: signalsTotal,
      ingredientSignals: signalItems,
      rows,
    },
  };
}
