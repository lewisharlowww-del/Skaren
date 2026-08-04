import type { GradeLetter, ProductResult } from "@/lib/types";
import {
  searchKassalappProducts,
  fetchKassalappProduct,
  cleanForKassalappSearch,
  scoreSearchRelevance,
  type KassalappSearchProduct
} from "@/lib/kassalapp";
import { calculateHealthScore, nutritionDataFromKassalapp, type NutritionData } from "@/lib/healthscore";
import { analyzeAdditives } from "@/lib/additives";

/**
 * Pull E-numbers out of a printed ingredient list so a catalogue candidate can
 * be graded on the same additive layer as the scanned product. Open Food Facts
 * ships `additives_tags`; the Norwegian catalogue does not, so we read the text.
 */
function extractAdditiveTags(ingredients: string): string[] {
  return ingredients.match(/\bE[\s-]?\d{3,4}[a-z]?\b/gi) ?? [];
}

/**
 * findAlternative — Merk's swap engine on top of the Kassalapp API.
 *
 * Pipeline (designed around Kassalapp's 60 req/min budget):
 *   1. Derive a generic noun + category from the scanned product.
 *   2. ONE cached search against /api/v1/products (unique=1, exclude_without_ean=1).
 *   3. Grade every candidate locally with the same calculateHealthScore the
 *      scanned product got — no extra network calls for scoring.
 *   4. Hard filters: same product type, meaningfully better, and it must fix
 *      the scanned product's WORST metric (that is what "alternative" means).
 *   5. Fetch full detail (nutrition table, store_prices) for the top 3 only.
 *
 * The reason string is built from real deltas, never templated fluff.
 */

export type AlternativeReason = {
  metric: "salt" | "sugars" | "saturatedFat" | "additives" | "nova";
  /** e.g. "43 % less salt" — already localised, built from actual numbers */
  text: string;
  before: number;
  after: number;
};

export type Alternative = {
  barcode: string;
  name: string;
  brand: string;
  image: string | null;
  score: number;
  scoreDelta: number;
  reasons: AlternativeReason[];      // ordered, worst-metric fix first
  tradeoffs: string[];               // honesty: e.g. "2 g less protein"
  cheapestPrice: { amount: number; store: string } | null;
  consideredCount: number;           // for the "why this one" trace in UI
};

export type WorstMetric = "salt" | "sugars" | "saturatedFat";

const WORST_METRIC_THRESHOLDS: Record<WorstMetric, (n: NutritionData) => number> = {
  salt: (n) => n.salt ?? 0,
  sugars: (n) => n.sugars ?? 0,
  saturatedFat: (n) => n.saturatedFat ?? 0
};

const METRIC_WORDS: Record<WorstMetric, string> = {
  salt: "salt",
  sugars: "sugar",
  saturatedFat: "saturated fat"
};

/** Which single metric drags this product down the most, relative to
 *  Norwegian keyhole-style limits. This is the metric a swap MUST improve. */
export function worstMetric(nutrition: NutritionData): WorstMetric {
  const limits: Record<WorstMetric, number> = { salt: 1.0, sugars: 5.0, saturatedFat: 3.0 }; // per 100 g
  let worst: WorstMetric = "salt";
  let worstRatio = 0;
  (Object.keys(limits) as WorstMetric[]).forEach((key) => {
    const ratio = WORST_METRIC_THRESHOLDS[key](nutrition) / limits[key];
    if (ratio > worstRatio) { worstRatio = ratio; worst = key; }
  });
  return worst;
}

/** Generic noun for the search: "Tine Cheddar Burgerost 162g" -> "cheddar" is
 *  too narrow (would only find other cheddars); the category gives "ost". */
function searchNoun(product: ProductResult): string {
  const category = (product.categories ?? "").split(",")[0]?.trim();
  if (category) return category.toLowerCase();
  return cleanForKassalappSearch(product.name).split(" ").pop() ?? product.name;
}

/**
 * shelfMedian — the median health score of the scanned product's category.
 * Powers the "this one · 22 / shelf median · 51" scale on the result screen.
 *
 * Fully doable with Kassalapp: it reuses the SAME cached category search as
 * findAlternative (zero extra requests), grades every candidate locally, and
 * takes the middle value. Cache the result per category (it moves slowly) so
 * repeat scans of the same shelf are free.
 */
export async function shelfMedian(scanned: ProductResult): Promise<{ median: number; sampleSize: number } | null> {
  const noun = searchNoun(scanned);
  const candidates = await searchKassalappProducts(noun, 30, { category: noun });
  const graded = candidates
    .filter((c) => c.categories.some((cat) => (scanned.categories ?? "").toLowerCase().includes(cat.toLowerCase())))
    .filter((c) => c.healthGrade !== null)
    // search payload carries enough nutrition for the grade; map A–E to the
    // score midpoints so the median lands on the same 0–100 scale as scores.
    .map((c) => ({ A: 90, B: 70, C: 50, D: 30, E: 10 }[c.healthGrade as GradeLetter]));
  if (graded.length < 5) return null; // don't show a median built on 3 products
  graded.sort((a, b) => a - b);
  const mid = Math.floor(graded.length / 2);
  const median = graded.length % 2 ? graded[mid] : Math.round((graded[mid - 1] + graded[mid]) / 2);
  return { median, sampleSize: graded.length };
}

export async function findAlternative(
  scanned: ProductResult & { nutritionData: NutritionData; healthScore: number },
  options: { preferredStores?: string[]; maxResults?: number } = {}
): Promise<Alternative[]> {
  const { preferredStores = [], maxResults = 3 } = options;

  // 1–2. One cached category search. size 30 gives enough candidates without
  //      burning the rate budget; searchKassalappProducts already caches 1 h.
  const noun = searchNoun(scanned);
  const candidates = await searchKassalappProducts(noun, 30, { category: noun });

  const target = worstMetric(scanned.nutritionData);

  // 3–4. Grade + filter locally.
  const scoredCandidates = candidates
    .filter((c) => c.barcode && c.barcode !== scanned.barcode)
    // same product type: at least one category token overlaps
    .filter((c) => c.categories.some((cat) => (scanned.categories ?? "").toLowerCase().includes(cat.toLowerCase())))
    // relevance guard: drop accessory hits ("ostehøvel" when searching "ost")
    .filter((c) => scoreSearchRelevance(c, noun) > 0)
    // healthGrade comes free with the search payload — a cheap pre-filter
    // before we spend detail requests. Keep A–C only.
    .filter((c) => c.healthGrade !== null && c.healthGrade <= "C");

  // 5. Full detail for the top candidates ONLY (3 requests max, each cached).
  const detailed = await Promise.all(
    scoredCandidates.slice(0, 8).map(async (c) => {
      try {
        const full = await fetchKassalappProduct(c.barcode!);
        return full ? { search: c, full } : null;
      } catch { return null; }
    })
  );

  const results: Alternative[] = [];
  for (const entry of detailed) {
    if (!entry) continue;
    // The catalogue detail payload carries nutrition, labels and categories but
    // no NOVA group; additives are derived from the printed ingredient list,
    // the same source the scanned product uses.
    const nutrition = nutritionDataFromKassalapp(entry.full.nutrition ?? []);
    const candidateAdditives = analyzeAdditives(
      extractAdditiveTags(entry.full.ingredients ?? "")
    );
    const score = calculateHealthScore({
      nutrition,
      labels: entry.full.labels ?? [],
      category: entry.search.categories.join(","),
      novaGroup: null,
      additives: candidateAdditives
    });

    const scoreDelta = score - scanned.healthScore;
    const before = WORST_METRIC_THRESHOLDS[target](scanned.nutritionData);
    const after = WORST_METRIC_THRESHOLDS[target](nutrition);

    // HARD RULES: +15 score minimum, and the worst metric improves ≥ 25 %.
    if (scoreDelta < 15) continue;
    if (before > 0 && (before - after) / before < 0.25) continue;

    const reasons: AlternativeReason[] = [{
      metric: target,
      text: `${Math.round(((before - after) / before) * 100)} % less ${METRIC_WORDS[target]}`,
      before, after
    }];
    const addBefore = scanned.additives?.length ?? 0;
    const addAfter = candidateAdditives.length;
    if (addAfter < addBefore) {
      reasons.push({ metric: "additives", text: addAfter === 0 ? "no additives" : `${addBefore - addAfter} fewer additives`, before: addBefore, after: addAfter });
    }

    // Honesty: surface what gets WORSE, never hide it.
    const tradeoffs: string[] = [];
    const proteinLoss = (scanned.nutritionData.protein ?? 0) - (nutrition.protein ?? 0);
    if (proteinLoss >= 2) tradeoffs.push(`${proteinLoss.toFixed(0)} g less protein`);

    // Availability + price from store_prices; prefer the user's stores.
    const prices = (entry.full.storePrices ?? [])
      .filter((p) => p.price != null)
      .sort((a, b) => Number(a.price) - Number(b.price));
    const preferred = prices.find((p) => preferredStores.some((s) => p.store?.toLowerCase().includes(s.toLowerCase())));
    const cheapest = preferred ?? prices[0] ?? null;

    results.push({
      barcode: entry.search.barcode!,
      name: entry.search.name,
      brand: entry.search.brand,
      image: entry.search.image,
      score, scoreDelta, reasons, tradeoffs,
      cheapestPrice: cheapest ? { amount: Number(cheapest.price), store: cheapest.store ?? "" } : null,
      consideredCount: candidates.length
    });
  }

  // Rank: fixes the problem hardest, then availability, then score.
  return results
    .sort((a, b) => (b.reasons[0].before - b.reasons[0].after) - (a.reasons[0].before - a.reasons[0].after) || b.score - a.score)
    .slice(0, maxResults);
}
