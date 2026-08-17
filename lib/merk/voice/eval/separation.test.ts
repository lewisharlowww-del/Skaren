/**
 * Merk voice engine · the separation contract tests (briefing §13)
 *
 * §13 is a structural fix, not a stylistic one: partition the brief so each slot
 * sees only its own facts, route absences to the coverage line, and enforce the
 * split after generation with an overlap check and an absence-talk check. These
 * lock all four pieces. Run:
 *
 *   npx tsx lib/merk/voice/eval/separation.test.ts
 */

import type { ProductBrief, BriefDriver } from "@/lib/merk/voice/brief";
import type { MerkCopy } from "@/lib/merk/voice/copy";
import { partitionBrief, coverageLine } from "@/lib/merk/voice/partition";
import { validate, slotOverlap } from "@/lib/merk/voice/validate";
import { decideVerdict } from "@/lib/merk/voice/verdictType";
import { templateCopy } from "@/lib/merk/voice/template";

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (!cond) failures++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${!cond && detail ? "  (" + detail + ")" : ""}`);
}

const d = (
  nutrient: BriefDriver["nutrient"],
  vsCategory: BriefDriver["vsCategory"],
  direction: BriefDriver["direction"]
): BriefDriver => ({ nutrient, value: 2.1, unit: "g", vsCategory, direction });

function brief(partial: Partial<ProductBrief> & Pick<ProductBrief, "category">): ProductBrief {
  const b: ProductBrief = {
    name: "Cheddar Burger",
    brand: "Tine",
    categoryN: 214,
    score: 22,
    shelfMedian: 51,
    percentile: 12,
    drivers: [d("salt", "highest", "penalty"), d("protein", "high", "credit")],
    additives: { total: 4, watch: [], safeCount: 2 },
    processing: { nova: 3, label: "Processed food" },
    allergens: ["milk"],
    categoryNoun: { en: "yellow cheese", nb: "gulost" },
    portionRole: "component",
    typicalPortion: "a slice",
    ...partial,
  };
  b.verdict = decideVerdict(b);
  return b;
}

// ── Partition: each fact set gets only its own fields ──────────────────────
{
  const p = partitionBrief(brief({ category: "cheese-yellow" }));

  // Verdict slice carries the shelf comparison, never the portion fields.
  check("verdict slice has drivers", p.verdict.drivers.length > 0);
  check("verdict slice has percentile", p.verdict.percentile === 12);
  check("verdict slice has NO portionRole", !("portionRole" in p.verdict));
  check("verdict slice has NO typicalPortion", !("typicalPortion" in p.verdict));

  // Buy-note slice carries portion + occasion, never the shelf rank/percentile.
  check("buyNote slice has portionRole", p.buyNote.portionRole === "component");
  check("buyNote slice has typicalPortion", p.buyNote.typicalPortion === "a slice");
  check("buyNote slice has NO percentile", !("percentile" in p.buyNote));
  check("buyNote slice has NO drivers", !("drivers" in p.buyNote));
  check("buyNote slice has NO score", !("score" in p.buyNote));

  // The decisive trade-off is qualitative — nutrient + band, never a value.
  check("buyNote decisiveTradeoff names the lead nutrient", p.buyNote.decisiveTradeoff?.nutrient === "salt");
  check("buyNote decisiveTradeoff carries NO value", !("value" in (p.buyNote.decisiveTradeoff ?? {})));
}

// ── Coverage: absences go to neither slice, only to the coverage list ──────
{
  const p = partitionBrief(brief({ category: "cheese-yellow", dataGaps: ["fibre", "eco"] }));
  check("coverage holds the data gaps", p.coverage.join(",") === "fibre,eco");
  check("verdict slice never carries dataGaps", !("dataGaps" in p.verdict));
  check("buyNote slice never carries dataGaps", !("dataGaps" in p.buyNote));

  const en = coverageLine(["fibre", "eco"], "en");
  check("coverage line EN reads naturally", en === "Fibre and eco not in the catalogue for this product.", en ?? "null");
  const nb = coverageLine(["fibre", "eco"], "nb");
  check("coverage line NB reads naturally", nb === "Fiber og miljø står ikke i katalogen for dette produktet.", nb ?? "null");
  check("coverage line is null when nothing missing", coverageLine([], "en") === null);
  check("single gap has no list connector", coverageLine(["fibre"], "en") === "Fibre not in the catalogue for this product.");
}

// ── Validator: cross-slot overlap is rejected ──────────────────────────────
{
  const b = brief({ category: "cheese-yellow" });
  const restating: MerkCopy = {
    headline: "Second-saltiest on this shelf",
    verdict: "High salt for a yellow cheese, four additives the recipe leans on.",
    additiveNote: null,
    // Same story as the verdict — salt, additives, yellow cheese repeated.
    wouldMerkBuy: "High salt for a yellow cheese, and the additives the recipe leans on make it a sometimes choice, not the weekly shelf.",
  };
  const v = validate(restating, b);
  check("overlapping verdict+buyNote is rejected", !v.ok && v.reason === "slot-overlap", v.ok ? "accepted" : (v as {reason:string}).reason);

  const separated: MerkCopy = {
    headline: "Second-saltiest on this shelf",
    verdict: "High salt for a yellow cheese, though the protein is real.",
    additiveNote: null,
    wouldMerkBuy: "Fine for a burger night rather than the everyday fridge. One slice melts well and goes further than the plate suggests.",
  };
  const v2 = validate(separated, b);
  check("separated verdict+buyNote passes", v2.ok, v2.ok ? "" : (v2 as {reason:string}).reason);
}

// ── Validator: absence talk is rejected in both slots ──────────────────────
{
  const b = brief({ category: "cheese-yellow", dataGaps: ["fibre"] });
  const deflect: MerkCopy = {
    headline: "Middle of its shelf",
    verdict: "The fibre is not listed, so check it yourself.",
    additiveNote: null,
    wouldMerkBuy: "Fine for a quick lunch. One slice goes further than the panel suggests.",
  };
  const v = validate(deflect, b);
  check("absence talk in verdict is rejected", !v.ok && v.reason === "absence-talk", v.ok ? "accepted" : (v as {reason:string}).reason);

  const deflectBuy: MerkCopy = {
    headline: "Middle of its shelf",
    verdict: "A fair bit better than most yellow cheese here.",
    additiveNote: null,
    wouldMerkBuy: "No data on the eco side, so check it yourself before buying.",
  };
  const v2 = validate(deflectBuy, b);
  check("absence talk in buyNote is rejected", !v2.ok && v2.reason === "absence-talk", v2.ok ? "accepted" : (v2 as {reason:string}).reason);
}

// ── slotOverlap arithmetic ─────────────────────────────────────────────────
{
  check("identical strings overlap 1.0", slotOverlap("salt cheese shelf", "salt cheese shelf") === 1);
  check("disjoint strings overlap 0", slotOverlap("salt cheese", "burger lunch") === 0);
  check("short set contained in long scores high", slotOverlap("salt cheese", "salt cheese additives protein shelf") === 1);
}

// ── The template floor never trips its own §13 validator ───────────────────
{
  const shapes: ProductBrief[] = [
    brief({ category: "cheese-yellow" }), // concern
    brief({ category: "cheese-yellow", drivers: [d("fibre", "highest", "credit")], score: 78, additives: { total: 0, watch: [], safeCount: 0 } }), // clean
    brief({ category: "coffee", categoryN: 8, drivers: [], dataGaps: ["fibre", "eco"] }), // thin
  ];
  let allValid = true;
  for (const b of shapes) {
    for (const lang of ["en", "nb"] as const) {
      const v = validate(templateCopy(b, lang), b);
      if (!v.ok) {
        allValid = false;
        console.log(`   template ${b.category}/${lang} -> ${(v as {reason:string}).reason}`);
      }
    }
  }
  check("template copy passes §13 for every shape and language", allValid);
}

console.log(`\n${failures ? failures + " FAILURES" : "All separation-contract checks passed."}`);
if (failures) process.exitCode = 1;
