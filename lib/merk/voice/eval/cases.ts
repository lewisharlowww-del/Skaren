/**
 * Merk voice engine · the 50-brief evaluation set (section 10)
 *
 * A fixed set of briefs built before shipping anything: 10 good, 10 weak,
 * 10 mid, 10 thin-data, 10 awkward edge cases (olive oil, a spice, a bag of
 * sugar, an energy drink, baby food). Run the whole set on every prompt change
 * and read all 50 by hand. Twenty minutes, and the only reliable way to catch
 * tone drift.
 *
 * These are ProductBrief objects directly — the brief is the unit under test,
 * not the raw product. Keep them literal and honest.
 */

import type { ProductBrief } from "@/lib/merk/voice/brief";

type Shape = "good" | "weak" | "mid" | "thin" | "edge";
export type EvalCase = { id: string; shape: Shape; brief: ProductBrief };

const nova = (n: 1 | 2 | 3 | 4) => ({ nova: n, label: ["", "Unprocessed", "Culinary ingredient", "Processed food", "Ultra-processed food"][n] });

// A compact constructor to keep 50 cases readable.
function b(partial: Partial<ProductBrief> & Pick<ProductBrief, "name" | "category">): ProductBrief {
  return {
    brand: "",
    categoryN: 120,
    score: 50,
    shelfMedian: 50,
    percentile: 50,
    drivers: [],
    additives: { total: 0, watch: [], safeCount: 0 },
    processing: nova(3),
    allergens: [],
    ...partial,
  };
}

export const EVAL_CASES: EvalCase[] = [
  // ── 10 GOOD ────────────────────────────────────────────────────────────
  { id: "good-01", shape: "good", brief: b({ name: "Grovbrød 100%", category: "bread", categoryN: 214, score: 78, percentile: 82,
    drivers: [{ nutrient: "fibre", value: 7.2, unit: "g", vsCategory: "highest", direction: "credit" }, { nutrient: "salt", value: 0.9, unit: "g", vsCategory: "typical", direction: "credit" }],
    processing: nova(3) }) },
  { id: "good-02", shape: "good", brief: b({ name: "Norvegia Original", category: "cheese-yellow", categoryN: 214, score: 71, percentile: 74,
    drivers: [{ nutrient: "protein", value: 27, unit: "g", vsCategory: "highest", direction: "credit" }, { nutrient: "salt", value: 1.1, unit: "g", vsCategory: "low", direction: "credit" }] }) },
  { id: "good-03", shape: "good", brief: b({ name: "Naturell Skyr", category: "yoghurt", categoryN: 96, score: 84, percentile: 88,
    drivers: [{ nutrient: "protein", value: 11, unit: "g", vsCategory: "highest", direction: "credit" }, { nutrient: "sugar", value: 4, unit: "g", vsCategory: "low", direction: "credit" }] }) },
  { id: "good-04", shape: "good", brief: b({ name: "Havregryn Store", category: "cereal", categoryN: 60, score: 80, percentile: 85,
    drivers: [{ nutrient: "fibre", value: 10, unit: "g", vsCategory: "highest", direction: "credit" }], processing: nova(1), additives: { total: 0, watch: [], safeCount: 0 } }) },
  { id: "good-05", shape: "good", brief: b({ name: "Torsk Filet", category: "fish", categoryN: 40, score: 88, percentile: 90,
    drivers: [{ nutrient: "protein", value: 18, unit: "g", vsCategory: "high", direction: "credit" }, { nutrient: "satFat", value: 0.3, unit: "g", vsCategory: "lowest", direction: "credit" }], processing: nova(1) }) },
  { id: "good-06", shape: "good", brief: b({ name: "Kikerter Hermetisk", category: "legumes", categoryN: 35, score: 82, percentile: 86,
    drivers: [{ nutrient: "fibre", value: 7, unit: "g", vsCategory: "high", direction: "credit" }, { nutrient: "protein", value: 8, unit: "g", vsCategory: "high", direction: "credit" }] }) },
  { id: "good-07", shape: "good", brief: b({ name: "Naturell Cottage Cheese", category: "cheese-white", categoryN: 52, score: 76, percentile: 80,
    drivers: [{ nutrient: "protein", value: 13, unit: "g", vsCategory: "highest", direction: "credit" }, { nutrient: "satFat", value: 2, unit: "g", vsCategory: "low", direction: "credit" }] }) },
  { id: "good-08", shape: "good", brief: b({ name: "Frosne Blåbær", category: "frozen-fruit", categoryN: 30, score: 90, percentile: 92,
    drivers: [{ nutrient: "sugar", value: 6, unit: "g", vsCategory: "low", direction: "credit" }], processing: nova(1) }) },
  { id: "good-09", shape: "good", brief: b({ name: "Knekkebrød Rug", category: "crispbread", categoryN: 44, score: 79, percentile: 83,
    drivers: [{ nutrient: "fibre", value: 15, unit: "g", vsCategory: "highest", direction: "credit" }, { nutrient: "salt", value: 0.8, unit: "g", vsCategory: "low", direction: "credit" }] }) },
  { id: "good-10", shape: "good", brief: b({ name: "Egg Frittgående", category: "eggs", categoryN: 33, score: 85, percentile: 88,
    drivers: [{ nutrient: "protein", value: 13, unit: "g", vsCategory: "high", direction: "credit" }], processing: nova(1) }) },

  // ── 10 WEAK ────────────────────────────────────────────────────────────
  { id: "weak-01", shape: "weak", brief: b({ name: "Cheddar Burger Cheese", brand: "Tine", category: "cheese-yellow", categoryN: 214, score: 22, percentile: 12,
    drivers: [{ nutrient: "salt", value: 2.1, unit: "g", vsCategory: "highest", rank: "2nd of 214", direction: "penalty" }, { nutrient: "satFat", value: 16, unit: "g", vsCategory: "high", direction: "penalty" }, { nutrient: "protein", value: 18, unit: "g", vsCategory: "typical", direction: "credit" }],
    additives: { total: 4, watch: [{ code: "E250", name: "Sodium nitrite", job: "preservative" }, { code: "E251", name: "Sodium nitrate", job: "preservative" }], safeCount: 2, duplicateJobs: ["preservative"] } }) },
  { id: "weak-02", shape: "weak", brief: b({ name: "Frossenpizza Grandiosa", category: "pizza", categoryN: 70, score: 28, percentile: 20,
    drivers: [{ nutrient: "salt", value: 1.4, unit: "g", vsCategory: "high", direction: "penalty" }, { nutrient: "satFat", value: 7, unit: "g", vsCategory: "high", direction: "penalty" }], processing: nova(4),
    additives: { total: 3, watch: [{ code: "E621", name: "MSG", job: "flavour" }], safeCount: 2 } }) },
  { id: "weak-03", shape: "weak", brief: b({ name: "Salami Skivet", category: "meat", categoryN: 88, score: 19, percentile: 8,
    drivers: [{ nutrient: "salt", value: 4.2, unit: "g", vsCategory: "highest", direction: "penalty" }, { nutrient: "satFat", value: 14, unit: "g", vsCategory: "high", direction: "penalty" }], processing: nova(4),
    additives: { total: 4, watch: [{ code: "E250", name: "Sodium nitrite", job: "preservative" }, { code: "E252", name: "Potassium nitrate", job: "preservative" }], safeCount: 2, duplicateJobs: ["preservative"] } }) },
  { id: "weak-04", shape: "weak", brief: b({ name: "Potetgull Salt", category: "crisps", categoryN: 55, score: 30, percentile: 22,
    drivers: [{ nutrient: "satFat", value: 3, unit: "g", vsCategory: "high", direction: "penalty" }, { nutrient: "salt", value: 1.6, unit: "g", vsCategory: "high", direction: "penalty" }], processing: nova(4) }) },
  { id: "weak-05", shape: "weak", brief: b({ name: "Melkesjokolade", category: "chocolate", categoryN: 120, score: 25, percentile: 18,
    drivers: [{ nutrient: "sugar", value: 52, unit: "g", vsCategory: "high", direction: "penalty" }, { nutrient: "satFat", value: 18, unit: "g", vsCategory: "high", direction: "penalty" }],
    additives: { total: 2, watch: [{ code: "E476", name: "PGPR", job: "texture" }], safeCount: 1 } }) },
  { id: "weak-06", shape: "weak", brief: b({ name: "Leverpostei", category: "spread", categoryN: 40, score: 27, percentile: 19,
    drivers: [{ nutrient: "satFat", value: 9, unit: "g", vsCategory: "high", direction: "penalty" }, { nutrient: "salt", value: 1.3, unit: "g", vsCategory: "high", direction: "penalty" }], processing: nova(4),
    additives: { total: 3, watch: [{ code: "E250", name: "Sodium nitrite", job: "preservative" }], safeCount: 2 } }) },
  { id: "weak-07", shape: "weak", brief: b({ name: "Pølse Wiener", category: "meat", categoryN: 88, score: 24, percentile: 14,
    drivers: [{ nutrient: "salt", value: 1.9, unit: "g", vsCategory: "high", direction: "penalty" }, { nutrient: "satFat", value: 8, unit: "g", vsCategory: "high", direction: "penalty" }], processing: nova(4),
    additives: { total: 5, watch: [{ code: "E250", name: "Sodium nitrite", job: "preservative" }, { code: "E301", name: "Sodium ascorbate", job: "preservative" }], safeCount: 3, duplicateJobs: ["preservative"] } }) },
  { id: "weak-08", shape: "weak", brief: b({ name: "Kakemiks Sjokolade", category: "baking-mix", categoryN: 30, score: 29, percentile: 21,
    drivers: [{ nutrient: "sugar", value: 40, unit: "g", vsCategory: "high", direction: "penalty" }], processing: nova(4),
    additives: { total: 4, watch: [{ code: "E450", name: "Diphosphates", job: "texture" }, { code: "E500", name: "Sodium carbonates", job: "texture" }], safeCount: 2, duplicateJobs: ["texture"] } }) },
  { id: "weak-09", shape: "weak", brief: b({ name: "Iskrem Vanilje", category: "ice-cream", categoryN: 48, score: 26, percentile: 17,
    drivers: [{ nutrient: "sugar", value: 24, unit: "g", vsCategory: "high", direction: "penalty" }, { nutrient: "satFat", value: 10, unit: "g", vsCategory: "high", direction: "penalty" }], processing: nova(4),
    additives: { total: 3, watch: [{ code: "E471", name: "Mono- and diglycerides", job: "texture" }], safeCount: 2 } }) },
  { id: "weak-10", shape: "weak", brief: b({ name: "Ferdigmiddag Lasagne", category: "ready-meal", categoryN: 36, score: 31, percentile: 23,
    drivers: [{ nutrient: "salt", value: 1.2, unit: "g", vsCategory: "high", direction: "penalty" }, { nutrient: "satFat", value: 6, unit: "g", vsCategory: "high", direction: "penalty" }], processing: nova(4) }) },

  // ── 10 MID ─────────────────────────────────────────────────────────────
  { id: "mid-01", shape: "mid", brief: b({ name: "Jarlsberg Skivet", category: "cheese-yellow", categoryN: 214, score: 52, percentile: 50,
    drivers: [{ nutrient: "protein", value: 22, unit: "g", vsCategory: "typical", direction: "credit" }, { nutrient: "salt", value: 1.2, unit: "g", vsCategory: "typical", direction: "penalty" }] }) },
  { id: "mid-02", shape: "mid", brief: b({ name: "Fruktyoghurt Jordbær", category: "yoghurt", categoryN: 96, score: 48, percentile: 46,
    drivers: [{ nutrient: "sugar", value: 12, unit: "g", vsCategory: "typical", direction: "penalty" }, { nutrient: "protein", value: 4, unit: "g", vsCategory: "typical", direction: "credit" }] }) },
  { id: "mid-03", shape: "mid", brief: b({ name: "Rundstykker Grove", category: "bread", categoryN: 214, score: 55, percentile: 54,
    drivers: [{ nutrient: "fibre", value: 4, unit: "g", vsCategory: "typical", direction: "credit" }, { nutrient: "salt", value: 1, unit: "g", vsCategory: "typical", direction: "penalty" }] }) },
  { id: "mid-04", shape: "mid", brief: b({ name: "Müsli Frukt", category: "cereal", categoryN: 60, score: 51, percentile: 50,
    drivers: [{ nutrient: "sugar", value: 16, unit: "g", vsCategory: "typical", direction: "penalty" }, { nutrient: "fibre", value: 6, unit: "g", vsCategory: "typical", direction: "credit" }] }) },
  { id: "mid-05", shape: "mid", brief: b({ name: "Kjøttdeig 14%", category: "meat", categoryN: 88, score: 49, percentile: 48,
    drivers: [{ nutrient: "protein", value: 19, unit: "g", vsCategory: "typical", direction: "credit" }, { nutrient: "satFat", value: 6, unit: "g", vsCategory: "typical", direction: "penalty" }], processing: nova(1) }) },
  { id: "mid-06", shape: "mid", brief: b({ name: "Fiskekaker", category: "fish", categoryN: 40, score: 53, percentile: 52,
    drivers: [{ nutrient: "protein", value: 11, unit: "g", vsCategory: "typical", direction: "credit" }, { nutrient: "salt", value: 1.1, unit: "g", vsCategory: "typical", direction: "penalty" }], processing: nova(3),
    additives: { total: 2, watch: [{ code: "E450", name: "Diphosphates", job: "texture" }], safeCount: 1 } }) },
  { id: "mid-07", shape: "mid", brief: b({ name: "Brie", category: "cheese-white", categoryN: 52, score: 47, percentile: 45,
    drivers: [{ nutrient: "satFat", value: 17, unit: "g", vsCategory: "typical", direction: "penalty" }, { nutrient: "protein", value: 17, unit: "g", vsCategory: "typical", direction: "credit" }] }) },
  { id: "mid-08", shape: "mid", brief: b({ name: "Tortilla Wraps", category: "bread", categoryN: 214, score: 46, percentile: 44,
    drivers: [{ nutrient: "salt", value: 1.3, unit: "g", vsCategory: "high", direction: "penalty" }, { nutrient: "fibre", value: 3, unit: "g", vsCategory: "typical", direction: "credit" }], processing: nova(4),
    additives: { total: 3, watch: [{ code: "E471", name: "Mono- and diglycerides", job: "texture" }], safeCount: 2 } }) },
  { id: "mid-09", shape: "mid", brief: b({ name: "Ketchup", category: "condiment", categoryN: 40, score: 50, percentile: 49,
    drivers: [{ nutrient: "sugar", value: 22, unit: "g", vsCategory: "typical", direction: "penalty" }], processing: nova(4) }) },
  { id: "mid-10", shape: "mid", brief: b({ name: "Pasta Fullkorn", category: "pasta", categoryN: 45, score: 58, percentile: 57,
    drivers: [{ nutrient: "fibre", value: 8, unit: "g", vsCategory: "high", direction: "credit" }, { nutrient: "salt", value: 0.1, unit: "g", vsCategory: "lowest", direction: "credit" }] }) },

  // ── 10 THIN DATA ───────────────────────────────────────────────────────
  { id: "thin-01", shape: "thin", brief: b({ name: "Lokal Geitost", category: "cheese-white", categoryN: 12, score: 51, percentile: 50, drivers: [], dataGaps: ["fibre", "eco"], additives: { total: 1, watch: [{ code: "E202", name: "Potassium sorbate", job: "preservative" }], safeCount: 0 } }) },
  { id: "thin-02", shape: "thin", brief: b({ name: "Håndverksbrød", category: "bread", categoryN: 8, score: 50, percentile: 50, drivers: [], dataGaps: ["fibre"] }) },
  { id: "thin-03", shape: "thin", brief: b({ name: "Ny Plantedrikk", category: "plant-drink", categoryN: 6, score: 50, percentile: 50, drivers: [], dataGaps: ["protein", "eco"] }) },
  { id: "thin-04", shape: "thin", brief: b({ name: "Importert Oliven", category: "olives", categoryN: 9, score: 50, percentile: 50, drivers: [{ nutrient: "salt", value: 2.5, unit: "g", vsCategory: "highest", direction: "penalty" }], dataGaps: ["fibre", "eco"] }) },
  { id: "thin-05", shape: "thin", brief: b({ name: "Spesialkaffe", category: "coffee", categoryN: 4, score: 50, percentile: 50, drivers: [], dataGaps: ["salt", "protein", "eco"] }) },
  { id: "thin-06", shape: "thin", brief: b({ name: "Ny Proteinbar", category: "snack-bar", categoryN: 11, score: 50, percentile: 50, drivers: [{ nutrient: "protein", value: 20, unit: "g", vsCategory: "highest", direction: "credit" }], dataGaps: ["fibre"], additives: { total: 2, watch: [{ code: "E950", name: "Acesulfame K", job: "sweetener" }], safeCount: 1 } }) },
  { id: "thin-07", shape: "thin", brief: b({ name: "Gårdsmelk", category: "milk", categoryN: 7, score: 50, percentile: 50, drivers: [], dataGaps: ["fibre", "eco"], processing: nova(1) }) },
  { id: "thin-08", shape: "thin", brief: b({ name: "Ukjent Krydderblanding", category: "spice", categoryN: 3, score: 50, percentile: 50, drivers: [], dataGaps: ["salt", "protein", "fibre", "eco"] }) },
  { id: "thin-09", shape: "thin", brief: b({ name: "Ny Fruktjuice", category: "juice", categoryN: 10, score: 50, percentile: 50, drivers: [{ nutrient: "sugar", value: 10, unit: "g", vsCategory: "typical", direction: "penalty" }], dataGaps: ["fibre", "eco"] }) },
  { id: "thin-10", shape: "thin", brief: b({ name: "Lokal Honning", category: "honey", categoryN: 5, score: 50, percentile: 50, drivers: [], dataGaps: ["salt", "protein", "fibre", "eco"], processing: nova(2) }) },

  // ── 10 EDGE CASES ──────────────────────────────────────────────────────
  { id: "edge-01", shape: "edge", brief: b({ name: "Extra Virgin Olivenolje", category: "oil", categoryN: 30, score: 62, percentile: 60,
    drivers: [{ nutrient: "satFat", value: 14, unit: "g", vsCategory: "low", direction: "credit" }], processing: nova(1), dataGaps: ["fibre"] }) },
  { id: "edge-02", shape: "edge", brief: b({ name: "Kanel Malt", category: "spice", categoryN: 15, score: 50, percentile: 50, drivers: [], dataGaps: ["salt", "protein", "fibre", "eco"], processing: nova(1) }) },
  { id: "edge-03", shape: "edge", brief: b({ name: "Sukker Farin", category: "sugar", categoryN: 12, score: 20, percentile: 15,
    drivers: [{ nutrient: "sugar", value: 100, unit: "g", vsCategory: "highest", direction: "penalty" }], processing: nova(2), dataGaps: ["fibre", "eco"] }) },
  { id: "edge-04", shape: "edge", brief: b({ name: "Energidrikk", category: "energy-drink", categoryN: 25, score: 21, percentile: 16,
    drivers: [{ nutrient: "sugar", value: 11, unit: "g", vsCategory: "high", direction: "penalty" }], processing: nova(4),
    additives: { total: 4, watch: [{ code: "E211", name: "Sodium benzoate", job: "preservative" }, { code: "E950", name: "Acesulfame K", job: "sweetener" }], safeCount: 2 } }) },
  { id: "edge-05", shape: "edge", brief: b({ name: "Babygrøt Havre", category: "baby-food", categoryN: 18, score: 68, percentile: 66,
    drivers: [{ nutrient: "sugar", value: 5, unit: "g", vsCategory: "low", direction: "credit" }, { nutrient: "fibre", value: 4, unit: "g", vsCategory: "typical", direction: "credit" }], processing: nova(3), allergens: ["gluten"] }) },
  { id: "edge-06", shape: "edge", brief: b({ name: "Salt Bordsalt", category: "salt", categoryN: 8, score: 40, percentile: 40,
    drivers: [{ nutrient: "salt", value: 99, unit: "g", vsCategory: "highest", direction: "penalty" }], processing: nova(2), dataGaps: ["protein", "fibre", "eco"] }) },
  { id: "edge-07", shape: "edge", brief: b({ name: "Sennep Sterk", category: "condiment", categoryN: 40, score: 54, percentile: 53,
    drivers: [{ nutrient: "salt", value: 3.5, unit: "g", vsCategory: "high", direction: "penalty" }], processing: nova(3) }) },
  { id: "edge-08", shape: "edge", brief: b({ name: "Tørket Aprikos", category: "dried-fruit", categoryN: 20, score: 45, percentile: 44,
    drivers: [{ nutrient: "sugar", value: 53, unit: "g", vsCategory: "typical", direction: "penalty" }, { nutrient: "fibre", value: 7, unit: "g", vsCategory: "high", direction: "credit" }], processing: nova(1) }) },
  { id: "edge-09", shape: "edge", brief: b({ name: "Proteinpulver Vanilje", category: "supplement", categoryN: 22, score: 60, percentile: 58,
    drivers: [{ nutrient: "protein", value: 80, unit: "g", vsCategory: "highest", direction: "credit" }, { nutrient: "sugar", value: 3, unit: "g", vsCategory: "low", direction: "credit" }], processing: nova(4),
    additives: { total: 3, watch: [{ code: "E955", name: "Sucralose", job: "sweetener" }], safeCount: 2 } }) },
  { id: "edge-10", shape: "edge", brief: b({ name: "Alkoholfri Øl", category: "beer", categoryN: 14, score: 50, percentile: 50, drivers: [{ nutrient: "sugar", value: 5, unit: "g", vsCategory: "typical", direction: "penalty" }], dataGaps: ["fibre", "eco", "protein"] }) },
];
