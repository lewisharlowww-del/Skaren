/**
 * Merk · category-relative scoring
 *
 * A product is scored against its own shelf, not against all food.
 * Cheese is compared to cheese, oil to oil. The only absolute layer is
 * additives, because an additive means the same thing in every category.
 *
 * Nothing here is hand-tuned: the thresholds are percentiles taken from
 * your own catalogue (see buildCategoryStats below).
 */

export type NutrientSpread = { p10: number; p50: number; p90: number };

export type CategoryStat = {
  n: number;
  salt: NutrientSpread;
  satFat: NutrientSpread;
  protein: NutrientSpread;
};

export type CategoryStats = Record<string, CategoryStat>;

export type ScoreInput = {
  category: string;
  salt: number | null;        // g / 100 g
  satFat: number | null;      // g / 100 g
  protein: number | null;     // g / 100 g
  watchAdditives: number;     // count of additives rated "worth watching"
};

export type ScoreResult = {
  score: number;
  category: string;
  n: number;
  /** percentile of the product inside its own category, 0-100 */
  percentile: number;
  /** false when the bucket is too thin to be trusted */
  confident: boolean;
  breakdown: { salt: number; satFat: number; protein: number; additives: number };
};

const MIN_BUCKET = 30;        // below this, don't claim a category verdict
const ADDITIVE_EACH = 15;
const ADDITIVE_CAP = 30;
const WEIGHTS = { salt: 0.4, satFat: 0.3, protein: 0.3 };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** 100 = best in category (lowest value), 0 = worst. */
const pctLowerIsBetter = (v: number, s: NutrientSpread) =>
  s.p90 === s.p10 ? 50 : clamp((100 * (s.p90 - v)) / (s.p90 - s.p10), 0, 100);

/** 100 = best in category (highest value). */
const pctHigherIsBetter = (v: number, s: NutrientSpread) =>
  s.p90 === s.p10 ? 50 : clamp((100 * (v - s.p10)) / (s.p90 - s.p10), 0, 100);

export function scoreInCategory(p: ScoreInput, stats: CategoryStats): ScoreResult | null {
  const s = stats[p.category];
  if (!s) return null;

  // A missing nutrient scores as category-average rather than as zero,
  // so an incomplete label never reads as a bad product.
  const salt = p.salt == null ? 50 : pctLowerIsBetter(p.salt, s.salt);
  const satFat = p.satFat == null ? 50 : pctLowerIsBetter(p.satFat, s.satFat);
  const protein = p.protein == null ? 50 : pctHigherIsBetter(p.protein, s.protein);

  const nutrition = WEIGHTS.salt * salt + WEIGHTS.satFat * satFat + WEIGHTS.protein * protein;
  const additives = Math.min(ADDITIVE_CAP, ADDITIVE_EACH * p.watchAdditives);

  return {
    score: Math.round(clamp(nutrition - additives, 0, 100)),
    category: p.category,
    n: s.n,
    percentile: Math.round(nutrition),
    confident: s.n >= MIN_BUCKET,
    breakdown: {
      salt: Math.round(salt),
      satFat: Math.round(satFat),
      protein: Math.round(protein),
      additives: -additives,
    },
  };
}

/* ------------------------------------------------------------------ *
 * Stats generation — run offline, ship the JSON with the app.
 * ------------------------------------------------------------------ */

const percentile = (sorted: number[], q: number) => {
  if (!sorted.length) return 0;
  const i = clamp((sorted.length - 1) * q, 0, sorted.length - 1);
  const lo = Math.floor(i), hi = Math.ceil(i);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
};

const spread = (values: number[]): NutrientSpread => {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  return { p10: percentile(v, 0.1), p50: percentile(v, 0.5), p90: percentile(v, 0.9) };
};

/** One pass over the catalogue snapshot. Regenerate weekly. */
export function buildCategoryStats(products: ScoreInput[]): CategoryStats {
  const buckets = new Map<string, ScoreInput[]>();
  for (const p of products) {
    if (!p.category) continue;
    const list = buckets.get(p.category) ?? [];
    list.push(p);
    buckets.set(p.category, list);
  }

  const out: CategoryStats = {};
  buckets.forEach((list, key) => {
    out[key] = {
      n: list.length,
      salt: spread(list.map((p: ScoreInput) => p.salt as number)),
      satFat: spread(list.map((p: ScoreInput) => p.satFat as number)),
      protein: spread(list.map((p: ScoreInput) => p.protein as number)),
    };
  });
  return out;
}

/* ------------------------------------------------------------------ *
 * Category keys
 *
 * The catalogue already ships its own taxonomy — `normalizeCategories()`
 * in lib/kassalapp.ts flattens `category` (an array of taxonomy nodes),
 * `categories`, `category_name` and `product_category` into a string[],
 * ordered general → specific. The search endpoint also accepts
 * `category_id`, so a bucket can be fetched wholesale rather than
 * reconstructed by keyword.
 *
 * So prefer the taxonomy node over the regex map:
 *   1. If you have the numeric category id, USE IT as the bucket key
 *      (`cat:1423`). It is stable, language-independent, and lets you
 *      build the whole bucket with one paged `category_id` search.
 *   2. Otherwise take the LAST (most specific) entry of the normalised
 *      categories array and slugify it.
 *   3. Only if both are missing, fall back to the keyword map below.
 * ------------------------------------------------------------------ */

const slug = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[æ]/g, 'ae').replace(/[ø]/g, 'o').replace(/[å]/g, 'a')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Preferred: derive the bucket from the catalogue's own taxonomy. */
export function bucketFromCatalogue(
  categoryId: number | null | undefined,
  categories: string[] | null | undefined,
): string | null {
  if (categoryId) return `cat:${categoryId}`;
  const last = categories?.filter(Boolean).slice(-1)[0];
  return last ? slug(last) : null;
}

const CATEGORY_MAP: Array<[RegExp, string]> = [
  [/gulost|cheddar|jarlsberg|norvegia|skivet ost/i, 'cheese-yellow'],
  [/hvitost|brie|camembert/i, 'cheese-white'],
  [/olivenolje|rapsolje|solsikkeolje|matolje/i, 'oil'],
  [/smør|margarin/i, 'butter-spread'],
  [/yoghurt|skyr|kesam/i, 'yoghurt'],
  [/melk(?!esjokolade)/i, 'milk'],
  [/brød|rundstykker/i, 'bread'],
  [/knekkebrød|kjeks/i, 'crispbread'],
  [/potetgull|chips|snacks/i, 'crisps'],
  [/sjokolade/i, 'chocolate'],
  [/pølse|kjøttdeig|kylling|karbonade/i, 'meat'],
  [/laks|torsk|fisk/i, 'fish'],
  [/frossenpizza|pizza/i, 'pizza'],
  [/frokostblanding|müsli|havregryn/i, 'cereal'],
  [/brus|saft|energidrikk/i, 'soft-drink'],
];

export function toCategoryKey(raw: string | null | undefined): string | null {
  if (!raw) return null;
  for (const [re, key] of CATEGORY_MAP) if (re.test(raw)) return key;
  return null; // unmapped → caller falls back to the absolute model
}
