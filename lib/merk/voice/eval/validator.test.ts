/**
 * Merk voice engine · validator self-test
 *
 * Asserts the guardrails actually bite. Each malformed copy MUST fail with the
 * expected reason; the clean one must pass. Run:
 *
 *   npx tsx lib/merk/voice/eval/validator.test.ts
 */

import type { ProductBrief } from "@/lib/merk/voice/brief";
import type { MerkCopy } from "@/lib/merk/voice/copy";
import { validate } from "@/lib/merk/voice/validate";

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

const clean: MerkCopy = {
  headline: "Saltiest on this shelf",
  verdict: "The saltiest yellow cheese on this shelf. The protein is the one bright spot.",
  additiveNote: "Two additives do the same job, stretching shelf life.",
  wouldMerkBuy:
    "I'd buy this for a burger night, not the fridge shelf. At 2,1 g salt per 100 g it's the saltiest on this shelf.",
};

type Case = { name: string; copy: MerkCopy; expect: "ok" | string };

const cases: Case[] = [
  { name: "clean copy passes", copy: clean, expect: "ok" },
  {
    name: "banned term (avoid)",
    copy: { ...clean, verdict: "High salt, best to avoid this one." },
    expect: "banned-term",
  },
  {
    name: "exclamation / tone",
    copy: { ...clean, headline: "Saltiest here!" },
    expect: "tone",
  },
  {
    name: "hallucinated number (3,4 not in brief)",
    copy: { ...clean, verdict: "3,4 g salt per 100 g, the most on this shelf." },
    expect: "hallucinated-number",
  },
  {
    name: "bare comparison (no category)",
    copy: {
      headline: "Saltier than most",
      verdict: "It has more salt than the others.",
      additiveNote: null,
      wouldMerkBuy: "At 2,1 g salt it sits above the rest, though the 18 g protein is real.",
    },
    expect: "bare-comparison",
  },
  {
    name: "too long headline",
    copy: { ...clean, headline: "This is a headline that runs well beyond the forty-two character budget" },
    expect: "too-long",
  },
  {
    name: "naming an additive by its E-number is not a hallucinated number",
    copy: {
      ...clean,
      additiveNote: "The E250 here is a preservative, safe in the amounts used.",
    },
    expect: "ok",
  },
];

let failures = 0;
for (const c of cases) {
  const r = validate(c.copy, brief);
  const got = r.ok ? "ok" : r.reason;
  const pass = got === c.expect;
  if (!pass) failures++;
  console.log(`${pass ? "PASS" : "FAIL"}  ${c.name}  (expected ${c.expect}, got ${got})`);
}

console.log(`\n${cases.length - failures}/${cases.length} assertions passed.`);
if (failures) process.exitCode = 1;
