/**
 * Skaren Score · ProductResult adapter
 *
 * Ties the pure score (score.ts) to the app's ProductResult and the shipped
 * categoryStats.json, so the scan route can attach a category-relative score to
 * every product. Kept separate from score.ts to keep that module pure and
 * I/O-free.
 */

import type { ProductResult } from "@/lib/types";
import { bucketOf } from "@/lib/merk/categories";
import { countWatchlisted } from "@/lib/merk/watchlist";
import { skarenScore, type CategoryStats, type ScoreResult } from "@/lib/merk/score";
import { readCleanNutrients, toScoreNutrients, type Rejection } from "@/lib/merk/normalise";
import statsJson from "@/lib/merk/categoryStats.json";

const STATS = statsJson as unknown as CategoryStats;

/** The scored result plus the bucket, for the scan route to persist/return. */
export type SkarenScored = {
  result: ScoreResult;
  bucket: string;
  /** D2 — nutrients dropped as implausible, for the data-quality log. */
  rejections: Rejection[];
};

/** Score one product against the shipped category stats. Never throws. */
export function scoreProduct(product: ProductResult): SkarenScored {
  const bucket = bucketOf({
    name: product.name ?? null,
    category:
      product.kassalappCategories?.filter(Boolean).join(" ") ||
      product.categories ||
      null,
    // D3 — let the processed-protein guard see the ingredient list + additive
    // count, so breaded chicken leaves the plain "poultry" shelf.
    ingredients: product.ingredients ?? null,
    additiveCount: (product.additives ?? []).length,
  });

  // D1 + D2 — one parser, plausibility-gated against the product's own shelf.
  const { nutrients: clean, rejections } = readCleanNutrients(
    product.kassalappNutrition ?? [],
    STATS[bucket] ?? null
  );
  const additiveCodes = (product.additives ?? [])
    .map((a) => a.code)
    .filter((c): c is string => Boolean(c));
  const watchAdditives = countWatchlisted(
    (product.additives ?? []).map((a) => ({ code: a.code, risk: a.risk }))
  );

  // Log every rejection with the barcode — this log IS the data-quality
  // backlog (audit D2): after a few weeks it says which source to distrust.
  if (rejections.length) {
    console.warn(
      `[Skaren D2] ${product.barcode} "${product.name}" dropped ${rejections
        .map((r) => `${r.nutrient}=${r.value}(${r.reason})`)
        .join(", ")}`
    );
  }

  const result = skarenScore(
    {
      bucket,
      nutrients: toScoreNutrients(clean),
      watchAdditives,
      // v2 — the ingredient list and additive codes drive the new layers.
      ingredients: product.ingredients ?? null,
      additiveCodes,
      nova: product.novaGroup ?? null,
    },
    STATS
  );

  return { result, bucket, rejections };
}
