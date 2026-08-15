/**
 * Merk voice engine · verdict-type selection tests (briefing v2, §2)
 *
 * The verdict TYPE is a computed decision. These lock the priority ladder and
 * the shape of the supporting fields, so the model is always handed a coherent
 * angle. Run:
 *
 *   npx tsx lib/merk/voice/eval/verdictType.test.ts
 */

import type { ProductBrief, BriefDriver } from "@/lib/merk/voice/brief";
import { decideVerdict } from "@/lib/merk/voice/verdictType";

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (!cond) failures++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${!cond && detail ? "  (" + detail + ")" : ""}`);
}

function brief(partial: Partial<ProductBrief> & Pick<ProductBrief, "category">): ProductBrief {
  return {
    name: "X",
    brand: "",
    categoryN: 214,
    score: 50,
    shelfMedian: 50,
    percentile: 50,
    drivers: [],
    additives: { total: 0, watch: [], safeCount: 0 },
    processing: { nova: 3, label: "Processed food" },
    allergens: [],
    ...partial,
  };
}
const d = (nutrient: BriefDriver["nutrient"], vsCategory: BriefDriver["vsCategory"], direction: BriefDriver["direction"], rank?: string): BriefDriver => ({ nutrient, value: 1, unit: "g", vsCategory, direction, ...(rank ? { rank } : {}) });

// 1 · LIMITED_DATA wins on a thin shelf, even with drivers.
check("thin shelf -> LIMITED_DATA", decideVerdict(brief({ category: "x", categoryN: 11, drivers: [d("salt", "highest", "penalty")] })).type === "LIMITED_DATA");
check("no drivers -> LIMITED_DATA", decideVerdict(brief({ category: "x", drivers: [] })).type === "LIMITED_DATA");

// 2 · OUTLIER when one penalty is highest; carries a rank + strongest.
const outlier = decideVerdict(brief({ category: "cheese-yellow", drivers: [d("salt", "highest", "penalty", "2nd of 214"), d("protein", "high", "credit")] }));
check("highest penalty -> OUTLIER", outlier.type === "OUTLIER", outlier.type);
check("OUTLIER lead is the extreme metric", outlier.lead?.nutrient === "salt");
check("OUTLIER parses rank 2 of 214", outlier.rank?.position === 2 && outlier.rank?.of === 214, JSON.stringify(outlier.rank));
check("OUTLIER carries the redeeming metric", outlier.strongest?.metric === "protein");

// 3 · REDUNDANCY when two additives share a job (and nothing is extreme).
const redun = decideVerdict(brief({ category: "cheese-yellow", drivers: [d("satFat", "high", "penalty"), d("protein", "high", "credit")], additives: { total: 4, safeCount: 2, watch: [{ code: "E250", name: "a", job: "preservative" }, { code: "E251", name: "b", job: "preservative" }], duplicateJobs: ["preservative"] } }));
check("shared additive job -> REDUNDANCY", redun.type === "REDUNDANCY", redun.type);
check("REDUNDANCY groups the two codes", redun.redundantGroups?.[0]?.codes.length === 2, JSON.stringify(redun.redundantGroups));

// 4 · TRADE_OFF: one high penalty, one credit, no extreme, no redundancy.
const trade = decideVerdict(brief({ category: "cheese-yellow", drivers: [d("salt", "high", "penalty"), d("protein", "high", "credit")] }));
check("high penalty + credit -> TRADE_OFF", trade.type === "TRADE_OFF", trade.type);
check("TRADE_OFF names both sides", Boolean(trade.weak) && Boolean(trade.strongest));

// 5 · SHELF_POSITION: nothing extreme, score far from median.
const shelf = decideVerdict(brief({ category: "bread", score: 78, shelfMedian: 52, drivers: [d("fibre", "typical", "credit")] }));
check("score far from median -> SHELF_POSITION", shelf.type === "SHELF_POSITION", shelf.type);

// 6 · CLEAN: nothing extreme, score near median, no watch additives.
const clean = decideVerdict(brief({ category: "bread", score: 55, shelfMedian: 52, drivers: [d("fibre", "typical", "credit")] }));
check("near median, clean -> CLEAN", clean.type === "CLEAN", clean.type);

// Priority: OUTLIER beats REDUNDANCY when both conditions hold.
const both = decideVerdict(brief({ category: "cheese-yellow", drivers: [d("salt", "highest", "penalty")], additives: { total: 4, safeCount: 2, watch: [{ code: "E250", name: "a", job: "preservative" }, { code: "E251", name: "b", job: "preservative" }], duplicateJobs: ["preservative"] } }));
check("OUTLIER outranks REDUNDANCY", both.type === "OUTLIER", both.type);

console.log(`\n${failures ? failures + " FAILURES" : "All verdict-type checks passed."}`);
if (failures) process.exitCode = 1;
