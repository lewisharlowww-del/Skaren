/**
 * Merk voice engine · integration test through the REAL entry point
 *
 * The 50-brief eval tests hand-written ProductBrief objects. This instead
 * exercises buildProductBrief(product, { stats }) from a realistically shaped
 * ProductResult + CategoryStats — the actual public path a scan takes — and
 * asserts the computed brief reflects the input, then runs it through the
 * template and validator. Run:
 *
 *   npx tsx lib/merk/voice/eval/integration.test.ts
 */

import type { ProductResult } from "@/lib/types";
import type { CategoryStats } from "@/lib/merk/categoryScore";
import { buildProductBrief } from "@/lib/merk/voice/brief";
import { templateCopy } from "@/lib/merk/voice/template";
import { validate } from "@/lib/merk/voice/validate";
import { briefCacheKey } from "@/lib/merk/voice/cache";

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (!cond) failures++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${!cond && detail ? "  (" + detail + ")" : ""}`);
}

// A realistically shaped Kassalapp/OFF-derived product: a salty, additive-heavy
// yellow cheese, plus the shelf stats it is compared against.
const cheese: ProductResult = {
  barcode: "7038010000000",
  name: "Cheddar Burger Cheese",
  brand: "Tine",
  categories: "Meieri, Ost, Gulost skivet",
  image: null,
  ecoGrade: "unknown",
  healthGrade: "D",
  hasNokkelhull: false,
  nutriGrade: "d",
  packaging: "plast",
  origins: "Norge",
  ingredients: "Pasteurisert melk, salt, konserveringsmiddel (E250), fargestoff, emulgator (E339)",
  displayImage: null,
  displayImageSource: "placeholder",
  placeholderEmoji: "🧀",
  norwegianDataStatus: "kassalapp",
  storePrices: [],
  currentPrice: null,
  store: null,
  allergens: ["melk"],
  labels: [],
  kassalappCategories: ["Meieri", "Ost", "Gulost skivet"],
  kassalappNutrition: [
    { code: "salt", displayName: "Salt", amount: 2.1, unit: "g" },
    { code: "saturated-fat", displayName: "Mettet fett", amount: 16, unit: "g" },
    { code: "protein", displayName: "Protein", amount: 18, unit: "g" },
    { code: "fat", displayName: "Fett", amount: 27, unit: "g" },
    // Note: no fibre row on purpose — should surface as a dataGap.
  ],
  additives: [
    { code: "e250", name: "Sodium nitrite", risk: "avoid", description: "Preservative in processed meat", known: true },
    { code: "e339", name: "Sodium phosphates", risk: "moderate", description: "Emulsifier, stabiliser for texture", known: true },
    { code: "e330", name: "Citric acid", risk: "safe", description: "Natural preservative from citrus", known: true },
  ],
  novaGroup: 4,
  aiSummary: [],
};

// Shelf stats: the cheese-yellow bucket. Values chosen so 2.1 g salt lands at
// the very top, 16 g satFat high, 18 g protein middling.
const stats: CategoryStats = {
  "gulost-skivet": {
    n: 214,
    salt: { p10: 0.8, p50: 1.2, p90: 2.0 },
    satFat: { p10: 8, p50: 12, p90: 18 },
    protein: { p10: 16, p50: 24, p90: 28 },
  },
};

// buildProductBrief derives the bucket from the last kassalappCategory,
// slugified: "Gulost skivet" -> "gulost-skivet". Confirm that matches our stat.
const brief = buildProductBrief(cheese, { stats, score: 22, percentile: 12 });

console.log("Computed brief:", JSON.stringify(brief, null, 2), "\n");

check("category bucket derived from catalogue taxonomy", brief.category === "gulost-skivet", brief.category);
check("categoryN pulled from the matched stat bucket", brief.categoryN === 214, String(brief.categoryN));
check("score passed through", brief.score === 22);
check("percentile passed through", brief.percentile === 12);

// Drivers: salt should be present and read as the numerically highest band,
// tagged a penalty. Fibre is absent and must NOT appear as a driver.
const salt = brief.drivers.find((d) => d.nutrient === "salt");
check("salt is a driver", Boolean(salt));
check("salt value extracted from nutrition (2.1)", salt?.value === 2.1, String(salt?.value));
check("salt banded highest (2.1 >= p90 2.0)", salt?.vsCategory === "highest", salt?.vsCategory);
check("salt tagged penalty", salt?.direction === "penalty", salt?.direction);
check("at most 3 drivers", brief.drivers.length <= 3, String(brief.drivers.length));
check("fibre is NOT invented as a driver", !brief.drivers.some((d) => d.nutrient === "fibre"));

const protein = brief.drivers.find((d) => d.nutrient === "protein");
// 18 g protein sits low on THIS shelf (p50 24). Protein is higher-is-better, so
// a low band is correctly a penalty — the direction is data-dependent, not fixed.
check("protein present", Boolean(protein));
check(
  "protein direction follows its band (low band => penalty for a higher-is-better nutrient)",
  protein?.vsCategory === "low" ? protein?.direction === "penalty" : true,
  `${protein?.vsCategory}/${protein?.direction}`
);

// Data gaps: fibre row missing, eco unknown.
check("fibre reported as a data gap", Boolean(brief.dataGaps?.includes("fibre")));
check("eco reported as a data gap", Boolean(brief.dataGaps?.includes("eco")));

// Additives: 3 total, 2 watch (avoid+moderate), 1 safe.
check("additive total counted", brief.additives.total === 3, String(brief.additives.total));
check("watch additives = 2", brief.additives.watch.length === 2, String(brief.additives.watch.length));
check("safe additives = 1", brief.additives.safeCount === 1, String(brief.additives.safeCount));
check("E-codes upcased for display", brief.additives.watch.every((w) => /^E\d/.test(w.code)));

// Processing.
check("nova carried through", brief.processing.nova === 4 && brief.processing.label === "Ultra-processed food");

// The number-honesty allowlist must contain the driver values the copy can cite.
import("@/lib/merk/voice/brief").then(({ numbersInBrief }) => {
  const allowed = numbersInBrief(brief);
  check("2.1 is an allowed number", allowed.has("2.1"));
  check("18 is an allowed number", allowed.has("18"));
  check("214 is an allowed number", allowed.has("214"));

  // Full pipeline: build -> template -> validate must pass on the real brief.
  for (const lang of ["en", "nb"] as const) {
    const copy = templateCopy(brief, lang);
    const v = validate(copy, brief);
    check(`template(${lang}) passes the validator`, v.ok, v.ok ? "" : v.reason);
    // The copy must actually be about THIS product: it should mention salt.
    const text = [copy.headline, copy.verdict, copy.wouldMerkBuy].join(" ").toLowerCase();
    check(`template(${lang}) is about the leading driver (salt)`, text.includes("salt"));
  }

  // Cache key is stable across identical briefs and language-scoped.
  const k1 = briefCacheKey(brief, "en");
  const k2 = briefCacheKey(buildProductBrief(cheese, { stats, score: 22, percentile: 12 }), "en");
  const kNb = briefCacheKey(brief, "nb");
  check("cache key is deterministic for an identical brief", k1 === k2, `${k1} vs ${k2}`);
  check("cache key is language-scoped", k1 !== kNb);

  console.log(`\n${failures ? failures + " FAILURES" : "All integration checks passed."}`);
  if (failures) process.exitCode = 1;
});
