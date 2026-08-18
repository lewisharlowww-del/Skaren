/**
 * Skaren Score v2 · nutrient profiles (spec §2)
 *
 * Nine profiles, not sixty. A bucket points at one (see buckets.ts); a new
 * bucket inherits a profile rather than inventing weights. Under one global
 * weight set a wholegrain bread and a chocolate bar were judged on the same
 * axes, and fibre — the most useful signal in the bread aisle — had no weight at
 * all. These are hand-written and every profile sums to 1.00 (asserted in tests
 * and at module load).
 *
 * Directions: `down` means less is better (salt, satFat, sugar, energy),
 * `up` means more is better (protein, fibre).
 */

export type Nutrient = "salt" | "satFat" | "sugar" | "energy" | "protein" | "fibre";

export const DIR: Record<Nutrient, "up" | "down"> = {
  salt: "down",
  satFat: "down",
  sugar: "down",
  energy: "down",
  protein: "up",
  fibre: "up",
};

export type Profile = Partial<Record<Nutrient, number>>;

export const PROFILES = {
  cheeseFat: { satFat: 0.3, salt: 0.3, protein: 0.25, sugar: 0.15 },
  curedMeat: { salt: 0.35, satFat: 0.25, protein: 0.25, sugar: 0.15 },
  dairyLiquid: { sugar: 0.35, satFat: 0.3, protein: 0.25, salt: 0.1 },
  fatOil: { satFat: 0.6, salt: 0.2, sugar: 0.2 },
  cerealBread: { fibre: 0.35, sugar: 0.3, salt: 0.2, protein: 0.15 },
  sweetSnack: { sugar: 0.4, satFat: 0.25, fibre: 0.2, salt: 0.15 },
  savourySnack: { salt: 0.35, satFat: 0.25, fibre: 0.2, sugar: 0.2 },
  readyMeal: { salt: 0.3, satFat: 0.25, fibre: 0.2, sugar: 0.15, protein: 0.1 },
  producePlain: { fibre: 0.4, sugar: 0.25, salt: 0.2, satFat: 0.15 },
  // Two profiles added in v2 (§13).
  drinkSweet: { sugar: 0.55, energy: 0.25, fibre: 0.1, salt: 0.1 },
  condiment: { salt: 0.4, sugar: 0.35, satFat: 0.25 },
} as const satisfies Record<string, Profile>;

export type ProfileName = keyof typeof PROFILES;

/** Every profile's weights must sum to 1.00. A drifted profile silently
 *  reweights a whole aisle, so this is checked at load and in the test suite. */
export function profileSum(name: ProfileName): number {
  return Object.values(PROFILES[name]).reduce((a, b) => a + b, 0);
}

// Fail fast at import time if a profile no longer sums to 1 (± float epsilon).
for (const name of Object.keys(PROFILES) as ProfileName[]) {
  const sum = profileSum(name);
  if (Math.abs(sum - 1) > 1e-9) {
    throw new Error(`[Skaren] profile "${name}" sums to ${sum}, expected 1.00`);
  }
}
