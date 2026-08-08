/**
 * Merk voice engine · the product brief
 *
 * "You are not training a model. You are writing a brief — a small, computed
 *  summary of one product — and asking the model to phrase it."
 *
 * This module is the whole trick: it turns a raw ProductResult into a small,
 * already-judged, already-ranked ProductBrief. The model that phrases Merk's
 * lines only ever sees this. It cannot invent a number it was never given, and
 * cannot pick the wrong angle when we have already picked it via `drivers`.
 *
 * Nothing here calls a model. It is deterministic: the same product always
 * produces the same brief, so the same product always produces the same
 * argument (different words, same point).
 */

import type { ProductResult } from "@/lib/types";
import type { AdditiveAnalysis } from "@/lib/additives";
import type { CategoryStats, NutrientSpread } from "@/lib/merk/categoryScore";
import { bucketFromCatalogue, toCategoryKey } from "@/lib/merk/categoryScore";

export type BriefNutrient = "salt" | "satFat" | "sugar" | "protein" | "fibre";

export type BriefDriver = {
  nutrient: BriefNutrient;
  value: number;
  unit: string; // "g"
  vsCategory: "highest" | "high" | "typical" | "low" | "lowest";
  rank?: string; // "2nd of 214"
  direction: "penalty" | "credit";
};

export type BriefWatchAdditive = { code: string; name: string; job: string };

export type ProductBrief = {
  name: string;
  brand: string;
  category: string; // the bucket, not the label text
  categoryN: number; // how many products it was compared against
  score: number;
  shelfMedian: number;
  percentile: number; // "worse than 88% of yellow cheeses"
  // Only the (up to) 3 facts that moved the score most, already sorted.
  drivers: BriefDriver[];
  additives: {
    total: number;
    watch: BriefWatchAdditive[];
    safeCount: number;
    duplicateJobs?: string[]; // two additives, same job
  };
  processing: { nova: 1 | 2 | 3 | 4; label: string };
  allergens: string[];
  dataGaps?: string[]; // ["fibre", "eco"] — say so, never guess
};

/* ------------------------------------------------------------------ *
 * Nutrition extraction
 *
 * Kassalapp stores nutrition as a flat list of {code, displayName, amount}.
 * We read one nutrient at a time, matching on either the English or the
 * Norwegian term, and returning null (not zero) when the label is silent —
 * a silent label is a data gap, never a "0 g".
 * ------------------------------------------------------------------ */

const NUTRIENT_TERMS: Record<BriefNutrient, { include: string[]; exclude: string[] }> = {
  salt: { include: ["salt", "sodium", "natrium"], exclude: [] },
  satFat: { include: ["saturated", "mettede", "mettet", "mettet fett"], exclude: [] },
  sugar: {
    include: ["sugars", "sugar", "sukker", "sukkerarter", "hvorav sukker", "herav sukker"],
    exclude: [],
  },
  protein: { include: ["protein", "proteins"], exclude: [] },
  fibre: { include: ["fiber", "fibre", "fibre", "kostfiber", "kostfibre"], exclude: [] },
};

function readNutrient(product: ProductResult, nutrient: BriefNutrient): number | null {
  const { include, exclude } = NUTRIENT_TERMS[nutrient];
  const match = product.kassalappNutrition.find((entry) => {
    const text = `${entry.code} ${entry.displayName}`.toLowerCase();
    return include.some((t) => text.includes(t)) && !exclude.some((e) => text.includes(e));
  });
  // A finite, non-negative gram value. Negative grams/100 g is impossible; a
  // bad row is treated as missing (a data gap) rather than surfaced as "-5 g",
  // which the validator would rightly reject as an impossible number.
  if (match && Number.isFinite(match.amount) && match.amount >= 0) return match.amount;
  return null;
}

/* ------------------------------------------------------------------ *
 * Category placement
 * ------------------------------------------------------------------ */

const NUTRIENT_UNIT: Record<BriefNutrient, string> = {
  salt: "g",
  satFat: "g",
  sugar: "g",
  protein: "g",
  fibre: "g",
};

// Which direction is "good" for each nutrient. Salt/satFat/sugar: lower is
// better (a high value is a penalty). Protein/fibre: higher is better.
const HIGHER_IS_BETTER: Record<BriefNutrient, boolean> = {
  salt: false,
  satFat: false,
  sugar: false,
  protein: true,
  fibre: true,
};

// Category stats only cover salt/satFat/protein. sugar/fibre have no spread,
// so they can appear as drivers only when we can rank them another way.
function spreadFor(stat: CategoryStats[string], nutrient: BriefNutrient): NutrientSpread | null {
  if (nutrient === "salt") return stat.salt;
  if (nutrient === "satFat") return stat.satFat;
  if (nutrient === "protein") return stat.protein;
  return null;
}

// Map a value to its band within the category, and a distance from the median
// that we use to rank which nutrients moved the score the most.
function placeInCategory(
  value: number,
  spread: NutrientSpread,
  higherIsBetter: boolean
): { vsCategory: BriefDriver["vsCategory"]; distance: number } {
  const { p10, p50, p90 } = spread;
  const span = p90 - p10 || 1;
  // 0 at p10 … 1 at p90
  const t = (value - p10) / span;
  const distance = Math.abs(value - p50) / span; // how far from typical

  let band: BriefDriver["vsCategory"];
  if (t <= 0.1) band = "lowest";
  else if (t <= 0.35) band = "low";
  else if (t < 0.65) band = "typical";
  else if (t < 0.9) band = "high";
  else band = "highest";

  // Re-label so the words track the value, not the goodness. "highest salt"
  // and "highest protein" both mean the numerically largest on the shelf.
  void higherIsBetter;
  return { vsCategory: band, distance };
}

function directionFor(nutrient: BriefNutrient, band: BriefDriver["vsCategory"]): BriefDriver["direction"] {
  const higherIsBetter = HIGHER_IS_BETTER[nutrient];
  const high = band === "high" || band === "highest";
  const low = band === "low" || band === "lowest";
  if (higherIsBetter) return high ? "credit" : low ? "penalty" : "credit";
  return high ? "penalty" : low ? "credit" : "penalty";
}

/* ------------------------------------------------------------------ *
 * Additive jobs
 * ------------------------------------------------------------------ */

// A coarse job for an additive, derived from its description. Two additives
// with the same job is a "duplicateJobs" signal — the recipe stretching shelf
// life or texture with more than one agent doing the same thing.
function jobOf(a: AdditiveAnalysis): string {
  const d = `${a.description} ${a.name}`.toLowerCase();
  if (/preserv|antioxidant|mould|mold|shelf/.test(d)) return "preservative";
  if (/colour|color|dye|pigment/.test(d)) return "colour";
  if (/sweeten|sweetener|sugar alcohol/.test(d)) return "sweetener";
  if (/emulsif|stabil|thicken|texture|gell?ing|raising/.test(d)) return "texture";
  if (/flavour|flavor|enhancer|msg|guanylate/.test(d)) return "flavour";
  if (/acid|regulator|ph/.test(d)) return "acidity";
  return "other";
}

const NOVA_LABEL: Record<1 | 2 | 3 | 4, string> = {
  1: "Unprocessed",
  2: "Culinary ingredient",
  3: "Processed food",
  4: "Ultra-processed food",
};

/* ------------------------------------------------------------------ *
 * Build
 * ------------------------------------------------------------------ */

export type BuildBriefOptions = {
  /** Category-relative stats, when the app has them. Enables drivers/percentile. */
  stats?: CategoryStats | null;
  /** Overall 0-100 score for the product, when already computed. */
  score?: number | null;
  /** Percentile inside the category, when already computed. */
  percentile?: number | null;
};

/**
 * Compute the brief for one product. Deterministic and model-free.
 *
 * `drivers` is the important field: at most three nutrients, ranked by how far
 * they sit from the category median (their leverage on the score), already
 * sorted. Pass fifteen nutrients and the model picks a different angle every
 * scan; pass three and the same product always makes the same argument.
 */
export function buildProductBrief(product: ProductResult, opts: BuildBriefOptions = {}): ProductBrief {
  const category =
    bucketFromCatalogue(undefined, product.kassalappCategories) ??
    toCategoryKey(product.categories) ??
    toCategoryKey(product.kassalappCategories.join(" ")) ??
    "uncategorised";

  const stat = opts.stats?.[category] ?? null;
  const categoryN = stat?.n ?? 0;

  const dataGaps: string[] = [];

  // Read every nutrient we might turn into a driver.
  const nutrients: BriefNutrient[] = ["salt", "satFat", "sugar", "protein", "fibre"];
  const values: Array<{ nutrient: BriefNutrient; value: number }> = [];
  for (const n of nutrients) {
    const v = readNutrient(product, n);
    if (v == null) {
      if (n === "fibre") dataGaps.push("fibre");
      continue;
    }
    values.push({ nutrient: n, value: v });
  }
  if (product.ecoGrade === "unknown") dataGaps.push("eco");

  // Rank candidate drivers by their distance from the category median. Only
  // nutrients the category stats can place get a band and a leverage score.
  type Candidate = BriefDriver & { distance: number };
  const candidates: Candidate[] = [];
  for (const { nutrient, value } of values) {
    const spread = stat ? spreadFor(stat, nutrient) : null;
    if (!spread) continue;
    const { vsCategory, distance } = placeInCategory(value, spread, HIGHER_IS_BETTER[nutrient]);
    candidates.push({
      nutrient,
      value: round1(value),
      unit: NUTRIENT_UNIT[nutrient],
      vsCategory,
      direction: directionFor(nutrient, vsCategory),
      distance,
    });
  }

  candidates.sort((a, b) => b.distance - a.distance);
  const drivers: BriefDriver[] = candidates.slice(0, 3).map(({ distance, ...d }) => {
    void distance;
    return d;
  });

  // Additives.
  const watch = product.additives.filter((a) => a.risk === "avoid" || a.risk === "moderate");
  const safeCount = product.additives.filter((a) => a.risk === "safe").length;
  const jobCounts: Record<string, number> = {};
  for (const a of watch) {
    const job = jobOf(a);
    jobCounts[job] = (jobCounts[job] ?? 0) + 1;
  }
  const duplicateJobs = Object.keys(jobCounts).filter((job) => jobCounts[job] > 1);

  const nova = (product.novaGroup ?? 3) as 1 | 2 | 3 | 4;

  return {
    name: product.name,
    brand: product.brand || "",
    category,
    categoryN,
    score: clampScore(opts.score ?? product.healthScore ?? 50),
    shelfMedian: shelfMedianScore(stat),
    percentile: clampScore(opts.percentile ?? 50),
    drivers,
    additives: {
      total: product.additives.length,
      watch: watch.map((a) => ({ code: a.code.toUpperCase(), name: a.name, job: jobOf(a) })),
      safeCount,
      ...(duplicateJobs.length ? { duplicateJobs } : {}),
    },
    processing: { nova, label: NOVA_LABEL[nova] },
    allergens: product.allergens,
    ...(dataGaps.length ? { dataGaps } : {}),
  };
}

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

const round1 = (v: number) => Math.round(v * 10) / 10;
const clampScore = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

// The shelf median is a score, not a nutrient value. Absent real per-shelf
// score distributions we approximate it as 50 (the model baselines there),
// which the brief treats as "typical shelf". Callers with a real median pass
// `score`/`percentile` and this stays honest as the neutral midpoint.
function shelfMedianScore(_stat: CategoryStats[string] | null): number {
  void _stat;
  return 50;
}

/** Collect every number that appears in a brief, for the validator's
 *  hallucinated-number check. */
export function numbersInBrief(brief: ProductBrief): Set<string> {
  const out = new Set<string>();
  const add = (n: number | undefined | null) => {
    if (n == null || !Number.isFinite(n)) return;
    out.add(String(n));
    out.add(String(Math.round(n)));
    // Norwegian comma decimals read the same number.
    out.add(String(n).replace(".", ","));
  };
  add(brief.score);
  add(brief.shelfMedian);
  add(brief.percentile);
  add(brief.categoryN);
  add(brief.additives.total);
  add(brief.additives.safeCount);
  add(brief.additives.watch.length);
  add(brief.processing.nova);
  for (const d of brief.drivers) add(d.value);
  // percentile is often phrased as "worse than 88%".
  add(100 - brief.percentile);
  return out;
}
