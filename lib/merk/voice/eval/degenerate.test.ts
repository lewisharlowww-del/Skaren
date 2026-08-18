/**
 * Merk voice engine · degenerate-input robustness
 *
 * Real catalogue rows are dirty: NaN amounts, negative grams, Infinity,
 * unreadable nutrients on a well-populated shelf, empty products. The engine
 * must never throw, never emit copy its own validator would reject, and never
 * invent a comparison. This locks the behaviour probed during development. Run:
 *
 *   npx tsx lib/merk/voice/eval/degenerate.test.ts
 */

import type { ProductResult } from "@/lib/types";
import type { CategoryStats } from "@/lib/merk/categoryScore";
import { buildProductBrief } from "@/lib/merk/voice/brief";
import { templateCopy } from "@/lib/merk/voice/template";
import { validate } from "@/lib/merk/voice/validate";

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (!cond) failures++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${!cond && detail ? "  (" + detail + ")" : ""}`);
}

const stats: CategoryStats = {
  ost: { n: 100, salt: { p10: 0.8, p50: 1.2, p90: 2.0 }, satFat: { p10: 8, p50: 12, p90: 18 }, protein: { p10: 16, p50: 24, p90: 28 } },
};

function product(nut: ProductResult["kassalappNutrition"], overrides: Partial<ProductResult> = {}): ProductResult {
  return {
    barcode: "0",
    name: "Ost",
    brand: "",
    categories: "",
    image: null,
    ecoGrade: "unknown",
    healthGrade: "C",
    hasNokkelhull: false,
    nutriGrade: "",
    packaging: "",
    origins: "",
    ingredients: "",
    displayImage: null,
    displayImageSource: "placeholder",
    placeholderEmoji: "🧀",
    norwegianDataStatus: "kassalapp",
    storePrices: [],
    currentPrice: null,
    store: null,
    allergens: [],
    labels: [],
    kassalappCategories: ["Ost"],
    kassalappNutrition: nut,
    additives: [],
    novaGroup: 3,
    aiSummary: [],
    ...overrides,
  };
}

type Case = { name: string; product: ProductResult; withStats: boolean; expectDrivers: number };

const cases: Case[] = [
  { name: "negative salt is dropped as a data gap (no impossible -5 g)", product: product([{ code: "salt", displayName: "Salt", amount: -5, unit: "g" }]), withStats: true, expectDrivers: 0 },
  { name: "NaN amount is dropped", product: product([{ code: "salt", displayName: "Salt", amount: NaN, unit: "g" }, { code: "protein", displayName: "Protein", amount: 20, unit: "g" }]), withStats: true, expectDrivers: 1 },
  { name: "Infinity is dropped", product: product([{ code: "salt", displayName: "Salt", amount: Infinity, unit: "g" }]), withStats: true, expectDrivers: 0 },
  // audit D2 gate 3 (bucket sanity): a cheese reading 0 g salt sits below the
  // shelf's plausible minimum (p10 0.8 → p1 ≈ 0.4), so it is dropped as
  // implausible rather than believed. A real 0 must be plausible for its shelf.
  { name: "implausible zero for the shelf is dropped (audit D2)", product: product([{ code: "salt", displayName: "Salt", amount: 0, unit: "g" }]), withStats: true, expectDrivers: 0 },
  // audit D2 gate 1 (absolute bounds): 99999 g protein is not a food, it is a
  // bad record. Out of [0,90] → dropped, never "banded" as a dramatic fact.
  { name: "out-of-bounds value is dropped (audit D2)", product: product([{ code: "protein", displayName: "Protein", amount: 99999, unit: "g" }]), withStats: true, expectDrivers: 0 },
  { name: "empty product (no name, nothing)", product: product([], { name: "", kassalappCategories: [] }), withStats: false, expectDrivers: 0 },
  { name: "long name does not throw", product: product([], { name: "A".repeat(300) }), withStats: false, expectDrivers: 0 },
];

for (const c of cases) {
  let threw = false;
  let driversLen = -1;
  let valid = false;
  let saysOnlyN = false;
  try {
    const brief = buildProductBrief(c.product, c.withStats ? { stats, score: 50, percentile: 50 } : {});
    driversLen = brief.drivers.length;
    for (const lang of ["en", "nb"] as const) {
      const copy = templateCopy(brief, lang);
      const v = validate(copy, brief);
      valid = lang === "en" ? v.ok : valid && v.ok;
      // A large shelf with unreadable nutrients must NOT claim "Only N products".
      if (brief.categoryN >= 12 && /only \d+ products|bare \d+ produkter/i.test(copy.verdict)) saysOnlyN = true;
    }
  } catch {
    threw = true;
  }
  check(`${c.name} — no throw`, !threw);
  check(`${c.name} — ${c.expectDrivers} drivers`, driversLen === c.expectDrivers, `got ${driversLen}`);
  check(`${c.name} — copy validates (self-consistent)`, valid);
  check(`${c.name} — no false "Only N products" on a populated shelf`, !saysOnlyN);
}

console.log(`\n${failures ? failures + " FAILURES" : "All degenerate-input checks passed."}`);
if (failures) process.exitCode = 1;
