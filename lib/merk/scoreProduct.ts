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
import { nutritionDataFromKassalapp } from "@/lib/healthscore";
import { skarenScore, type CategoryStats, type ScoreResult } from "@/lib/merk/score";
import statsJson from "@/lib/merk/categoryStats.json";

const STATS = statsJson as unknown as CategoryStats;

/** The scored result plus the bucket, for the scan route to persist/return. */
export type SkarenScored = {
  result: ScoreResult;
  bucket: string;
};

/** Score one product against the shipped category stats. Never throws. */
export function scoreProduct(product: ProductResult): SkarenScored {
  const bucket = bucketOf({
    name: product.name ?? null,
    category:
      product.kassalappCategories?.filter(Boolean).join(" ") ||
      product.categories ||
      null,
  });

  const n = nutritionDataFromKassalapp(product.kassalappNutrition ?? []);
  const additiveCodes = (product.additives ?? [])
    .map((a) => a.code)
    .filter((c): c is string => Boolean(c));
  const watchAdditives = countWatchlisted(
    (product.additives ?? []).map((a) => ({ code: a.code, risk: a.risk }))
  );

  const result = skarenScore(
    {
      bucket,
      nutrients: {
        salt: n.salt ?? null,
        satFat: n.saturatedFat ?? null,
        sugar: n.sugars ?? null,
        protein: n.protein ?? null,
        fibre: n.fiber ?? null,
        energy: n.calories ?? null,
      },
      watchAdditives,
      // v2 — the ingredient list and additive codes drive the new layers.
      ingredients: product.ingredients ?? null,
      additiveCodes,
      nova: product.novaGroup ?? null,
    },
    STATS
  );

  return { result, bucket };
}
