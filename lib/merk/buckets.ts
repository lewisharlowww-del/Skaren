/**
 * Skaren Score v2 · the bucket registry (spec §13)
 *
 * Every bucket carries three things the score needs: which nutrient PROFILE it
 * is judged by, how high it is allowed to score (its CEILING), and its scoring
 * MODE. The relative engine decides the ranking inside an aisle; the ceiling
 * decides what that ranking is allowed to claim, so the least-bad crisp cannot
 * read as good food.
 *
 * Three modes:
 *   scored   — all five layers, the normal path.
 *   plain    — whole foods with no ingredient list to read: nutrition base and
 *              ceiling only. No ingredient signals, no additive load, no
 *              processing penalty. Chicken breast has nothing to read.
 *   excluded — no score at all, because per-100 g figures are meaningless
 *              (nobody eats 100 g of cinnamon or dry coffee; water has no
 *              figures). The card shows grades, ingredients and additives, and
 *              Merk says "not something a score helps with".
 *
 * This registry is hand-written and reviewed. The keys are the bucket keys from
 * categories.ts; where a key here is not yet produced by the bucket rules, it is
 * a v2 addition/split whose rule is added alongside.
 */

import type { ProfileName } from "@/lib/merk/profiles";

export type ScoreMode = "scored" | "plain" | "excluded";

export type BucketConfig = {
  /** The nutrient profile this bucket is judged by. Null only for excluded. */
  profile: ProfileName | null;
  /** The honest maximum a product in this bucket may show. Null for excluded. */
  ceiling: number | null;
  mode: ScoreMode;
};

/** Floor for every scored/plain bucket — no product drops below this. */
export const FLOOR = 5;

// Keyed by bucket. Order is cosmetic; lookup is by key.
export const BUCKETS: Record<string, BucketConfig> = {
  // ── Dairy & cheese ───────────────────────────────────────────────────
  "cheese-yellow": { profile: "cheeseFat", ceiling: 100, mode: "scored" },
  "cheese-white": { profile: "cheeseFat", ceiling: 100, mode: "scored" },
  "cheese-fresh": { profile: "cheeseFat", ceiling: 100, mode: "scored" },
  "cheese-brown": { profile: "cheeseFat", ceiling: 90, mode: "scored" }, // sugar-heavy by recipe
  milk: { profile: "dairyLiquid", ceiling: 100, mode: "scored" },
  yoghurt: { profile: "dairyLiquid", ceiling: 100, mode: "scored" },
  "sour-cream": { profile: "dairyLiquid", ceiling: 95, mode: "scored" },
  cream: { profile: "dairyLiquid", ceiling: 90, mode: "scored" },
  "plant-drink": { profile: "dairyLiquid", ceiling: 100, mode: "scored" },
  eggs: { profile: "producePlain", ceiling: 100, mode: "plain" },

  // ── Fats ─────────────────────────────────────────────────────────────
  oil: { profile: "fatOil", ceiling: 100, mode: "scored" },
  "butter-spread": { profile: "fatOil", ceiling: 90, mode: "scored" },

  // ── Grains ───────────────────────────────────────────────────────────
  bread: { profile: "cerealBread", ceiling: 95, mode: "scored" },
  crispbread: { profile: "cerealBread", ceiling: 95, mode: "scored" },
  flatbread: { profile: "cerealBread", ceiling: 95, mode: "scored" },
  pasta: { profile: "cerealBread", ceiling: 95, mode: "scored" },
  "rice-grain": { profile: "cerealBread", ceiling: 100, mode: "scored" }, // NEW rice, oats, couscous
  rice: { profile: "cerealBread", ceiling: 100, mode: "scored" }, // legacy alias of rice-grain
  "cereal-plain": { profile: "cerealBread", ceiling: 100, mode: "scored" }, // SPLIT muesli, havregryn
  "cereal-sweet": { profile: "sweetSnack", ceiling: 65, mode: "scored" }, // SPLIT frosted, choco
  cereal: { profile: "cerealBread", ceiling: 95, mode: "scored" }, // pre-split fallback
  "baking-flour": { profile: "cerealBread", ceiling: 95, mode: "scored" }, // SPLIT flour, yeast
  "baking-mix": { profile: "sweetSnack", ceiling: 60, mode: "scored" }, // SPLIT cake mix, frosting
  baking: { profile: "cerealBread", ceiling: 95, mode: "scored" }, // pre-split fallback

  // ── Protein, unprocessed ─────────────────────────────────────────────
  poultry: { profile: "producePlain", ceiling: 100, mode: "plain" },
  fish: { profile: "producePlain", ceiling: 100, mode: "plain" },
  salmon: { profile: "producePlain", ceiling: 100, mode: "plain" },
  shellfish: { profile: "producePlain", ceiling: 100, mode: "plain" },
  "red-meat": { profile: "producePlain", ceiling: 90, mode: "plain" },
  "minced-meat": { profile: "producePlain", ceiling: 85, mode: "plain" },

  // ── Protein, processed ───────────────────────────────────────────────
  pate: { profile: "curedMeat", ceiling: 75, mode: "scored" },
  "ham-bacon": { profile: "curedMeat", ceiling: 70, mode: "scored" },
  "cured-meat": { profile: "curedMeat", ceiling: 70, mode: "scored" },
  sausage: { profile: "curedMeat", ceiling: 70, mode: "scored" },
  "fish-cakes": { profile: "readyMeal", ceiling: 80, mode: "scored" },
  "meat-alt": { profile: "readyMeal", ceiling: 85, mode: "scored" },

  // ── Prepared ─────────────────────────────────────────────────────────
  soup: { profile: "readyMeal", ceiling: 85, mode: "scored" },
  "ready-meal": { profile: "readyMeal", ceiling: 80, mode: "scored" }, // NEW frozen dinners
  pizza: { profile: "readyMeal", ceiling: 75, mode: "scored" },
  "potato-frozen": { profile: "readyMeal", ceiling: 70, mode: "scored" }, // NEW fries, rösti
  "cooking-sauce": { profile: "readyMeal", ceiling: 80, mode: "scored" }, // pasta sauce, salsa

  // ── Produce ──────────────────────────────────────────────────────────
  vegetables: { profile: "producePlain", ceiling: 100, mode: "plain" }, // NEW fresh + frozen
  "frozen-veg": { profile: "producePlain", ceiling: 100, mode: "plain" }, // fresh + frozen veg
  fruit: { profile: "producePlain", ceiling: 100, mode: "plain" }, // NEW
  "frozen-fruit": { profile: "producePlain", ceiling: 100, mode: "plain" },
  "canned-veg": { profile: "producePlain", ceiling: 95, mode: "scored" }, // NEW tomat, beans, corn
  "legumes-canned": { profile: "producePlain", ceiling: 95, mode: "scored" },
  nuts: { profile: "producePlain", ceiling: 95, mode: "scored" },
  "nut-butter": { profile: "producePlain", ceiling: 90, mode: "scored" },
  "dried-fruit": { profile: "producePlain", ceiling: 85, mode: "scored" },

  // ── Sweet ────────────────────────────────────────────────────────────
  "snack-bar": { profile: "sweetSnack", ceiling: 65, mode: "scored" },
  "ice-cream": { profile: "sweetSnack", ceiling: 60, mode: "scored" },
  "jam-honey": { profile: "sweetSnack", ceiling: 60, mode: "scored" },
  biscuits: { profile: "sweetSnack", ceiling: 58, mode: "scored" },
  chocolate: { profile: "sweetSnack", ceiling: 55, mode: "scored" },
  candy: { profile: "sweetSnack", ceiling: 45, mode: "scored" },

  // ── Savoury snacks ───────────────────────────────────────────────────
  crisps: { profile: "savourySnack", ceiling: 62, mode: "scored" },

  // ── Condiments ───────────────────────────────────────────────────────
  condiment: { profile: "condiment", ceiling: 75, mode: "scored" }, // ketchup, mayo, dressing

  // ── Drinks ───────────────────────────────────────────────────────────
  juice: { profile: "drinkSweet", ceiling: 70, mode: "scored" },
  cordial: { profile: "drinkSweet", ceiling: 45, mode: "scored" },
  "soft-drink": { profile: "drinkSweet", ceiling: 45, mode: "scored" },
  "energy-drink": { profile: "drinkSweet", ceiling: 40, mode: "scored" },

  // ── Special ──────────────────────────────────────────────────────────
  "baby-food": { profile: "producePlain", ceiling: 100, mode: "scored" }, // NEW stricter watch list
  spice: { profile: null, ceiling: null, mode: "excluded" },
  sugar: { profile: null, ceiling: null, mode: "excluded" },
  salt: { profile: null, ceiling: null, mode: "excluded" },
  coffee: { profile: null, ceiling: null, mode: "excluded" },
  tea: { profile: null, ceiling: null, mode: "excluded" }, // NEW
  water: { profile: null, ceiling: null, mode: "excluded" },
  beer: { profile: null, ceiling: null, mode: "excluded" }, // never score alcohol
  wine: { profile: null, ceiling: null, mode: "excluded" },
};

/** The config for a bucket, or a safe scored default for an unknown key. An
 *  unmapped bucket is scored on the readyMeal profile with a middling ceiling —
 *  it is better to score conservatively than to crash on a new category. */
export function bucketConfig(bucket: string): BucketConfig {
  return BUCKETS[bucket] ?? { profile: "readyMeal", ceiling: 80, mode: "scored" };
}

export const CEILING = (bucket: string): number =>
  bucketConfig(bucket).ceiling ?? 100;

export const PROFILE_OF = (bucket: string): ProfileName | null =>
  bucketConfig(bucket).profile;

export const MODE_OF = (bucket: string): ScoreMode => bucketConfig(bucket).mode;
