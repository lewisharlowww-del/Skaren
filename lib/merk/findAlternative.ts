import type { ProductResult } from "@/lib/types";
import {
  searchKassalappProducts,
  fetchKassalappProduct,
  cleanForKassalappSearch,
  scoreSearchRelevance
} from "@/lib/kassalapp";
import { calculateHealthScore, nutritionDataFromKassalapp, type NutritionData } from "@/lib/healthscore";
import { analyzeAdditives } from "@/lib/additives";
import { bucketOf, sameShelf, shelfLabel, type Bucket } from "@/lib/merk/categoryBuckets";

/**
 * findAlternative — Merk's swap engine.
 *
 * WHAT CHANGED FROM v1, and why the old one always returned nothing:
 *
 *   1. Shelf matching was string containment between two full category paths.
 *      That fails on almost every real pair. Now: coarse buckets (sameShelf).
 *   2. Candidates were pre-filtered on the search payload's healthGrade, which
 *      Kassalapp often omits — ungraded products were silently dropped before
 *      we ever looked at them. Now: every shortlisted candidate is graded
 *      locally on real detail data, same as the scanned product.
 *   3. Two AND-ed hard gates (+15 score AND -25 % on the worst metric) meant a
 *      normal shelf produced zero passes. Now: ONE soft floor, then ranking.
 *   4. Errors were indistinguishable from "nothing better exists". Now the
 *      function throws, and the route reports failure separately from empty.
 *
 * RANKING PRIORITY: additives first. The button says "find versions with fewer
 * additives" — so that is what it must rank on. Nutrition is a tie-breaker and
 * a printed trade-off, never the headline. This also keeps Merk's picks out of
 * nutrition advice, which is where the regulatory risk lives.
 */

export type AlternativeReason = {
  metric: "additives" | "salt" | "sugars" | "saturatedFat" | "nova";
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
  additiveCount: number;
  watchAdditiveCount: number;
  reasons: AlternativeReason[];
  /** Always at least one entry. "Nothing gets worse" is itself a finding. */
  tradeoffs: string[];
  cheapestPrice: { amount: number; store: string } | null;
};

export type AlternativeSearch = {
  results: Alternative[];
  /** How many products on this shelf were actually examined. */
  consideredCount: number;
  /** How many were graded in full (detail fetched). */
  gradedCount: number;
  bucket: Bucket | null;
  shelfLabelNo: string | null;
  shelfLabelEn: string | null;
};

export type WorstMetric = "salt" | "sugars" | "saturatedFat";

const METRIC_VALUE: Record<WorstMetric, (n: NutritionData) => number> = {
  salt: (n) => n.salt ?? 0,
  sugars: (n) => n.sugars ?? 0,
  saturatedFat: (n) => n.saturatedFat ?? 0
};

const METRIC_WORDS: Record<WorstMetric, { no: string; en: string }> = {
  salt: { no: "salt", en: "salt" },
  sugars: { no: "sukker", en: "sugar" },
  saturatedFat: { no: "mettet fett", en: "saturated fat" }
};

/** Which single nutrient drags this product down most, vs keyhole-style limits. */
export function worstMetric(nutrition: NutritionData): WorstMetric {
  const limits: Record<WorstMetric, number> = { salt: 1.0, sugars: 5.0, saturatedFat: 3.0 };
  let worst: WorstMetric = "salt";
  let worstRatio = 0;
  (Object.keys(limits) as WorstMetric[]).forEach((key) => {
    const ratio = METRIC_VALUE[key](nutrition) / limits[key];
    if (ratio > worstRatio) { worstRatio = ratio; worst = key; }
  });
  return worst;
}

function extractAdditiveTags(ingredients: string): string[] {
  return ingredients.match(/\bE[\s-]?\d{3,4}[a-z]?\b/gi) ?? [];
}

function countWatch(additives: Array<{ risk?: string; safety?: string }>): number {
  return additives.filter((a) => {
    const rating = a.risk ?? a.safety;
    return rating && rating !== "safe";
  }).length;
}

/**
 * Search term. The bucket label is a better query than a leaf category
 * ("gulost" finds the shelf; "Skiveost 162g Tine" finds one product).
 */
function searchNoun(product: ProductResult): string {
  const bucket = bucketOf(product.categories, product.name);
  const label = shelfLabel(bucket, "no");
  if (label) return label;
  const category = (product.categories ?? "").split(",")[0]?.trim();
  if (category) return category.toLowerCase();
  return cleanForKassalappSearch(product.name).split(" ").pop() ?? product.name;
}

/**
 * shelfMedian — median score of this shelf, for the "· shelf median 51" chip.
 * Reuses the same cached search as findAlternative, so it costs no extra calls.
 */
export async function shelfMedian(
  scanned: ProductResult
): Promise<{ median: number; sampleSize: number; bucket: Bucket | null } | null> {
  const noun = searchNoun(scanned);
  const candidates = await searchKassalappProducts(noun, 30, { category: noun });
  const graded = candidates
    .filter((c) => sameShelf(scanned, c))
    .map((c) => c.healthGrade)
    .filter((g): g is "A" | "B" | "C" | "D" | "E" => g !== null)
    .map((g) => ({ A: 90, B: 70, C: 50, D: 30, E: 10 }[g]));

  if (graded.length < 5) return null; // never show a median built on a handful
  graded.sort((a, b) => a - b);
  const mid = Math.floor(graded.length / 2);
  const median = graded.length % 2 ? graded[mid] : Math.round((graded[mid - 1] + graded[mid]) / 2);
  return { median, sampleSize: graded.length, bucket: bucketOf(scanned.categories, scanned.name) };
}

/** How many detail requests we are willing to spend per scan. */
const DETAIL_BUDGET = 10;
/** Below this score gain, a swap is not worth interrupting someone for. */
const MIN_SCORE_GAIN = 5;

export async function findAlternative(
  scanned: ProductResult & { nutritionData: NutritionData; healthScore: number },
  options: { preferredStores?: string[]; maxResults?: number; lang?: "no" | "en" } = {}
): Promise<AlternativeSearch> {
  const { preferredStores = [], maxResults = 3, lang = "no" } = options;

  const bucket = bucketOf(scanned.categories, scanned.name);
  const noun = searchNoun(scanned);
  const candidates = await searchKassalappProducts(noun, 30, { category: noun });

  const target = worstMetric(scanned.nutritionData);
  const scannedAdditives = scanned.additives ?? [];
  const scannedTotal = scannedAdditives.length;
  const scannedWatch = countWatch(scannedAdditives);

  // Shortlist. Note what is NOT here any more: no healthGrade pre-filter.
  // Grading happens below, on real data, for everyone who makes the shortlist.
  const shortlist = candidates
    .filter((c) => c.barcode && c.barcode !== scanned.barcode)
    .filter((c) => sameShelf(scanned, c))
    .filter((c) => scoreSearchRelevance(c, noun) > 0)
    .slice(0, DETAIL_BUDGET);

  const detailed = await Promise.all(
    shortlist.map(async (c) => {
      try {
        const full = await fetchKassalappProduct(c.barcode!);
        return full ? { search: c, full } : null;
      } catch {
        return null; // one bad detail fetch must not sink the whole search
      }
    })
  );

  const results: Alternative[] = [];
  let gradedCount = 0;

  for (const entry of detailed) {
    if (!entry) continue;
    gradedCount++;

    const nutrition = nutritionDataFromKassalapp(entry.full.nutrition ?? []);
    const candidateAdditives = analyzeAdditives(extractAdditiveTags(entry.full.ingredients ?? ""));
    const additiveCount = candidateAdditives.length;
    const watchCount = countWatch(candidateAdditives);

    const score = calculateHealthScore({
      nutrition,
      labels: entry.full.labels ?? [],
      category: entry.search.categories.join(","),
      novaGroup: null,
      additives: candidateAdditives
    });
    const scoreDelta = score - scanned.healthScore;

    // The ONE floor. Everything else is ranking, not gatekeeping.
    if (scoreDelta < MIN_SCORE_GAIN) continue;
    // It must not be worse on the thing the button promised.
    if (watchCount > scannedWatch) continue;

    const reasons: AlternativeReason[] = [];

    // Additives lead — that is what the button asked for.
    if (watchCount < scannedWatch) {
      const fewer = scannedWatch - watchCount;
      reasons.push({
        metric: "additives",
        text: watchCount === 0
          ? (lang === "no" ? "ingen tilsetningsstoffer å følge med på" : "no additives worth watching")
          : (lang === "no" ? `${fewer} færre å følge med på` : `${fewer} fewer worth watching`),
        before: scannedWatch,
        after: watchCount
      });
    } else if (additiveCount < scannedTotal) {
      reasons.push({
        metric: "additives",
        text: lang === "no"
          ? `${scannedTotal - additiveCount} færre tilsetningsstoffer`
          : `${scannedTotal - additiveCount} fewer additives`,
        before: scannedTotal,
        after: additiveCount
      });
    }

    // Nutrition is a supporting line, never the headline.
    const before = METRIC_VALUE[target](scanned.nutritionData);
    const after = METRIC_VALUE[target](nutrition);
    const metricGain = before > 0 ? (before - after) / before : 0;
    if (metricGain >= 0.15) {
      reasons.push({
        metric: target,
        text: lang === "no"
          ? `${Math.round(metricGain * 100)} % mindre ${METRIC_WORDS[target].no}`
          : `${Math.round(metricGain * 100)} % less ${METRIC_WORDS[target].en}`,
        before, after
      });
    }

    if (!reasons.length) continue; // better score, but nothing we can name — skip

    // Trade-offs. Always non-empty: saying "nothing gets worse" is the finding.
    const tradeoffs: string[] = [];
    const proteinLoss = (scanned.nutritionData.protein ?? 0) - (nutrition.protein ?? 0);
    if (proteinLoss >= 2) {
      tradeoffs.push(lang === "no" ? `${proteinLoss.toFixed(0)} g mindre protein` : `${proteinLoss.toFixed(0)} g less protein`);
    }
    for (const key of ["salt", "sugars", "saturatedFat"] as WorstMetric[]) {
      const b = METRIC_VALUE[key](scanned.nutritionData);
      const a = METRIC_VALUE[key](nutrition);
      if (b > 0 && (a - b) / b >= 0.15) {
        tradeoffs.push(lang === "no"
          ? `${Math.round(((a - b) / b) * 100)} % mer ${METRIC_WORDS[key].no}`
          : `${Math.round(((a - b) / b) * 100)} % more ${METRIC_WORDS[key].en}`);
      }
    }
    if (additiveCount > scannedTotal) {
      tradeoffs.push(lang === "no"
        ? `${additiveCount - scannedTotal} flere tilsetningsstoffer, alle harmløse`
        : `${additiveCount - scannedTotal} more additives, all harmless`);
    }
    if (!tradeoffs.length) {
      tradeoffs.push(lang === "no" ? "Ingenting blir dårligere her." : "Nothing gets worse here.");
    }

    const prices = (entry.full.storePrices ?? [])
      .filter((p) => p.price != null)
      .sort((a, b) => Number(a.price) - Number(b.price));
    const preferred = prices.find((p) =>
      preferredStores.some((s) => p.store?.toLowerCase().includes(s.toLowerCase()))
    );
    const cheapest = preferred ?? prices[0] ?? null;

    results.push({
      barcode: entry.search.barcode!,
      name: entry.search.name,
      brand: entry.search.brand,
      image: entry.search.image,
      score,
      scoreDelta,
      additiveCount,
      watchAdditiveCount: watchCount,
      reasons,
      tradeoffs,
      cheapestPrice: cheapest ? { amount: Number(cheapest.price), store: cheapest.store ?? "" } : null
    });
  }

  // Rank: additives removed first, then score gain. Price is never a factor.
  results.sort((a, b) => {
    const additiveGain = (x: Alternative) => scannedWatch - x.watchAdditiveCount;
    return additiveGain(b) - additiveGain(a) || b.scoreDelta - a.scoreDelta;
  });

  return {
    results: results.slice(0, maxResults),
    consideredCount: candidates.filter((c) => sameShelf(scanned, c)).length,
    gradedCount,
    bucket,
    shelfLabelNo: shelfLabel(bucket, "no"),
    shelfLabelEn: shelfLabel(bucket, "en")
  };
}
