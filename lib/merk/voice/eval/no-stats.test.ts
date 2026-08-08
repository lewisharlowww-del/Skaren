/**
 * Merk voice engine · no-stats degraded path (the real production entry today)
 *
 * The status doc is explicit: categoryStats.json does not exist yet, so real
 * scans call buildProductBrief(product) with NO CategoryStats. Without stats
 * there is no shelf to place nutrients against, so `drivers` is empty and
 * `categoryN` is 0. The engine must still produce valid, honest copy and never
 * invent a comparison it cannot back. This test locks that behaviour. Run:
 *
 *   npx tsx lib/merk/voice/eval/no-stats.test.ts
 */

import type { ProductResult } from "@/lib/types";
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

const product: ProductResult = {
  barcode: "7038010000002",
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
  ingredients: "Pasteurisert melk, salt, konserveringsmiddel (E250)",
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
  ],
  additives: analyzeAdditives(["e250", "e330"]),
  novaGroup: 4,
  aiSummary: [],
};

// The real call as it happens today: no stats, no precomputed score/percentile.
const brief = buildProductBrief(product);
console.log("No-stats brief:", JSON.stringify(brief, null, 2), "\n");

// Without a shelf, there can be no drivers and no category sample.
check("no drivers without stats (never invents a comparison)", brief.drivers.length === 0, String(brief.drivers.length));
check("categoryN is 0 without stats", brief.categoryN === 0, String(brief.categoryN));
check("score defaults to the neutral midpoint (50)", brief.score === 50, String(brief.score));
check("shelfMedian is the neutral midpoint (50)", brief.shelfMedian === 50, String(brief.shelfMedian));

// Additives are absolute (category-independent), so they still classify.
check("additives still classified without stats", brief.additives.total === 2 && brief.additives.watch.length === 1, JSON.stringify(brief.additives));

// Nova and allergens still carry through.
check("nova carried through", brief.processing.nova === 4);
check("allergens carried through", brief.allergens.includes("melk"));

// The copy must still be valid and, crucially, must NOT contain a bare
// comparison — with no shelf, Merk cannot claim "most" / "saltiest".
async function pipeline() {
  for (const lang of ["en", "nb"] as const) {
    const copy = templateCopy(brief, lang);
    const v = validate(copy, brief);
    check(`template(${lang}) validates without stats`, v.ok, v.ok ? "" : v.reason);
    const text = [copy.headline, copy.verdict, copy.additiveNote, copy.wouldMerkBuy].filter(Boolean).join(" ");
    check(
      `template(${lang}) makes no shelf comparison it cannot back`,
      !/\b(most|least|saltiest|highest|lowest|mest|minst)\b/i.test(text),
      text
    );
  }

  const result = await generateMerkCopy(brief, "en");
  check("generateMerkCopy resolves without stats", Boolean(result?.copy));
  check("generateMerkCopy output validates without stats", validate(result.copy, brief).ok);

  console.log(`\n${failures ? failures + " FAILURES" : "All no-stats degraded-path checks passed."}`);
  if (failures) process.exitCode = 1;
}

pipeline();
