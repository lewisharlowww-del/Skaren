/**
 * Merk voice engine · model-reply handling test
 *
 * The fallback-ladder integration test can only reach the no-key path. This
 * simulates what a real model returns and drives it through the exact sequence
 * generateMerkCopy runs on a reply: parseCopy -> validate. It covers the
 * branches that only execute when the model actually answers — including the
 * cases the retry/fallback exists for. Run:
 *
 *   npx tsx lib/merk/voice/eval/model-reply.test.ts
 */

import type { ProductBrief } from "@/lib/merk/voice/brief";
import { parseCopy } from "@/lib/merk/voice/generate";
import { validate } from "@/lib/merk/voice/validate";

let failures = 0;

const brief: ProductBrief = {
  name: "Cheddar Burger Cheese",
  brand: "Tine",
  category: "cheese-yellow",
  categoryN: 214,
  score: 22,
  shelfMedian: 50,
  percentile: 12,
  drivers: [
    { nutrient: "salt", value: 2.1, unit: "g", vsCategory: "highest", direction: "penalty" },
    { nutrient: "protein", value: 18, unit: "g", vsCategory: "typical", direction: "credit" },
  ],
  additives: {
    total: 4,
    watch: [{ code: "E250", name: "Sodium nitrite", job: "preservative" }],
    safeCount: 2,
    duplicateJobs: ["preservative"],
  },
  processing: { nova: 4, label: "Ultra-processed food" },
  allergens: ["milk"],
};

// The outcome of parse+validate on one raw model string, mirroring generateMerkCopy.
function handle(raw: string | null): "accept" | "reject-parse" | "reject-validate" {
  const copy = parseCopy(raw);
  if (!copy) return "reject-parse";
  return validate(copy, brief).ok ? "accept" : "reject-validate";
}

type Case = { name: string; raw: string | null; expect: "accept" | "reject-parse" | "reject-validate" };

const cases: Case[] = [
  {
    name: "well-formed reply within budgets is accepted",
    raw: JSON.stringify({
      headline: "Saltiest on this shelf",
      verdict: "The saltiest yellow cheese on this shelf. The protein is the bright spot.",
      additiveNote: "Two additives do the same job, stretching shelf life.",
      wouldMerkBuy: "I'd buy it for a burger night, not the fridge shelf. At 2,1 g salt it's the saltiest on this shelf.",
    }),
    expect: "accept",
  },
  {
    name: "reply wrapped in prose/markdown still parses (regex extracts the object)",
    raw: 'Here you go:\n```json\n{"headline":"Saltiest on this shelf","verdict":"The saltiest here.","additiveNote":null,"wouldMerkBuy":"It leads this shelf on salt."}\n```',
    expect: "accept",
  },
  {
    name: "explicit null additiveNote is accepted",
    raw: JSON.stringify({
      headline: "Most salt on this shelf",
      verdict: "2,1 g salt per 100 g, the most on this shelf.",
      additiveNote: null,
      wouldMerkBuy: "At 2,1 g salt it tops this shelf, though the 18 g protein is real.",
    }),
    expect: "accept",
  },
  {
    name: "missing required slot is rejected at parse",
    raw: JSON.stringify({ headline: "Saltiest on this shelf", additiveNote: null }),
    expect: "reject-parse",
  },
  {
    name: "non-JSON reply is rejected at parse",
    raw: "I think this cheese is a bit salty, honestly.",
    expect: "reject-parse",
  },
  { name: "empty reply (model offline) is rejected at parse", raw: null, expect: "reject-parse" },
  {
    name: "hallucinated number is caught by validate (triggers retry/fallback)",
    raw: JSON.stringify({
      headline: "Most salt on this shelf",
      verdict: "3,4 g salt per 100 g, the most on this shelf.",
      additiveNote: null,
      wouldMerkBuy: "At 3,4 g salt it tops this shelf.",
    }),
    expect: "reject-validate",
  },
  {
    name: "banned term is caught by validate",
    raw: JSON.stringify({
      headline: "Saltiest on this shelf",
      verdict: "High salt, best to avoid this one on this shelf.",
      additiveNote: null,
      wouldMerkBuy: "At 2,1 g salt it tops this shelf.",
    }),
    expect: "reject-validate",
  },
  {
    name: "over-budget verdict is caught by validate",
    raw: JSON.stringify({
      headline: "Saltiest on this shelf",
      verdict: "2,1 g salt per 100 g on this shelf, ".repeat(6),
      additiveNote: null,
      wouldMerkBuy: "At 2,1 g salt it tops this shelf.",
    }),
    expect: "reject-validate",
  },
];

for (const c of cases) {
  const got = handle(c.raw);
  const pass = got === c.expect;
  if (!pass) failures++;
  console.log(`${pass ? "PASS" : "FAIL"}  ${c.name}  (expected ${c.expect}, got ${got})`);
}

console.log(`\n${cases.length - failures}/${cases.length} model-reply assertions passed.`);
console.log(
  "This validates the parse+validate branches generateMerkCopy runs on a real reply. " +
    "The live HTTP call remains untested without OPENAI_API_KEY."
);
if (failures) process.exitCode = 1;
