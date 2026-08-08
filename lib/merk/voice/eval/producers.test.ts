/**
 * Merk voice engine · real-producers boundary test
 *
 * The other tests hand-author `additives` and `kassalappNutrition`. This one
 * builds them with the app's REAL producers — analyzeAdditives() over raw
 * E-number tags — so buildProductBrief is exercised against the genuine
 * AdditiveAnalysis shape (risk values, names, descriptions from the live
 * database), not fixtures. If the additives DB or its risk vocabulary changes
 * shape, this catches it. Run:
 *
 *   npx tsx lib/merk/voice/eval/producers.test.ts
 */

import type { ProductResult } from "@/lib/types";
import type { CategoryStats } from "@/lib/merk/categoryScore";
import { analyzeAdditives } from "@/lib/additives";
import { buildProductBrief } from "@/lib/merk/voice/brief";
import { templateCopy } from "@/lib/merk/voice/template";
import { validate } from "@/lib/merk/voice/validate";
import { generateMerkCopy } from "@/lib/merk/voice/generate";

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (!cond) failures++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${!cond && detail ? "  (" + detail + ")" : ""}`);
}

// Raw E-number tags as they arrive from the catalogue/ingredient parse. Mixed
// risk on purpose: nitrite (avoid), a phosphate (moderate), citric acid (safe).
const tags = ["e250", "e450", "e330"];
const additives = analyzeAdditives(tags);

console.log("Real analyzeAdditives output:", JSON.stringify(additives, null, 2), "\n");

check("analyzeAdditives returned one entry per tag", additives.length === tags.length, String(additives.length));
check("every entry carries a risk in the known vocabulary", additives.every((a) => ["safe", "moderate", "avoid"].includes(a.risk)));
check("every entry has a non-empty name", additives.every((a) => a.name.trim().length > 0));

const product: ProductResult = {
  barcode: "7038010000001",
  name: "Spekepølse Grov",
  brand: "Gilde",
  categories: "Kjøtt, Pålegg, Spekemat",
  image: null,
  ecoGrade: "unknown",
  healthGrade: "E",
  hasNokkelhull: false,
  nutriGrade: "e",
  packaging: "plast",
  origins: "Norge",
  ingredients: "Svinekjøtt, salt, krydder, konserveringsmiddel (E250)",
  displayImage: null,
  displayImageSource: "placeholder",
  placeholderEmoji: "🌭",
  norwegianDataStatus: "kassalapp",
  storePrices: [],
  currentPrice: null,
  store: null,
  allergens: [],
  labels: [],
  kassalappCategories: ["Kjøtt", "Pålegg", "Spekemat"],
  kassalappNutrition: [
    { code: "salt", displayName: "Salt", amount: 4.2, unit: "g" },
    { code: "saturated-fat", displayName: "Mettet fett", amount: 14, unit: "g" },
    { code: "protein", displayName: "Protein", amount: 25, unit: "g" },
  ],
  additives, // ← real producer output, not a fixture
  novaGroup: 4,
  aiSummary: [],
};

const stats: CategoryStats = {
  spekemat: {
    n: 61,
    salt: { p10: 3.0, p50: 4.0, p90: 5.5 },
    satFat: { p10: 8, p50: 12, p90: 18 },
    protein: { p10: 20, p50: 26, p90: 32 },
  },
};

const brief = buildProductBrief(product, { stats, score: 19, percentile: 8 });
console.log("Computed brief.additives:", JSON.stringify(brief.additives, null, 2), "\n");

// The brief must have classified the real additives correctly: nitrite +
// phosphate are watch (avoid/moderate), citric acid is safe.
check("brief total additives = 3", brief.additives.total === 3, String(brief.additives.total));
check("brief watch additives = 2 (nitrite + phosphate)", brief.additives.watch.length === 2, String(brief.additives.watch.length));
check("brief safe additives = 1 (citric acid)", brief.additives.safeCount === 1, String(brief.additives.safeCount));
check("every watch additive has a plain-words job", brief.additives.watch.every((w) => w.job.length > 0));

// Category bucket from the real taxonomy: "Spekemat" -> "spekemat".
check("bucket derived from taxonomy (spekemat)", brief.category === "spekemat", brief.category);
check("categoryN from matched stat bucket", brief.categoryN === 61, String(brief.categoryN));

// Firewall check: the real E250 description contains "cancer risk" (a banned
// term). The brief strips additives to {code, name, job}, so that word must NOT
// reach the brief the model sees. This is the whole point of the brief layer.
const e250 = additives.find((a) => a.code === "e250");
check("real E250 description does contain a banned term (precondition)", /cancer/i.test(e250?.description ?? ""), e250?.description);
const briefText = JSON.stringify(brief);
check("banned term from additive description is firewalled out of the brief", !/cancer|disease/i.test(briefText));

// Full pipeline on real-producer data must validate in both languages, and
// generateMerkCopy must resolve through the fallback ladder.
async function pipeline() {
  for (const lang of ["en", "nb"] as const) {
    const v = validate(templateCopy(brief, lang), brief);
    check(`template(${lang}) validates on real-producer brief`, v.ok, v.ok ? "" : v.reason);
  }
  const result = await generateMerkCopy(brief, "en");
  check("generateMerkCopy resolves on real-producer brief", Boolean(result?.copy));
  check("generateMerkCopy output validates", validate(result.copy, brief).ok);

  console.log(`\n${failures ? failures + " FAILURES" : "All real-producer boundary checks passed."}`);
  if (failures) process.exitCode = 1;
}

pipeline();
