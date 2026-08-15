/**
 * Merk voice engine · memory observations test (briefing v2, §11)
 *
 *   npx tsx lib/merk/voice/eval/memory.test.ts
 */

import type { ScanRecord } from "@/lib/types";
import { pickMemory } from "@/lib/merk/voice/memory";

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (!cond) failures++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${!cond && detail ? "  (" + detail + ")" : ""}`);
}

const NOW = Date.UTC(2026, 7, 15, 12, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

function scan(name: string, barcode: string, daysAgo: number, score = 60): ScanRecord {
  return {
    user_id: "u",
    barcode,
    product_name: name,
    brand: null,
    eco_score_grade: "unknown",
    ecoscan_score: score,
    created_at: new Date(NOW - daysAgo * DAY).toISOString(),
  } as ScanRecord;
}

// MILESTONE — exactly 50 scans.
const fifty = Array.from({ length: 50 }, (_, i) => scan("Item " + i, "b" + i, i % 5));
check("50 scans -> MILESTONE", pickMemory(fifty, { barcode: "b0" }, "en", NOW)?.kind === "MILESTONE");

// REPEAT — same barcode seen before.
const repeat = [scan("Norvegia", "111", 0), scan("Norvegia", "111", 5), scan("Bread", "222", 6)];
check("same barcode twice -> REPEAT", pickMemory(repeat, { barcode: "111" }, "en", NOW)?.kind === "REPEAT");

// FIRST — first scan in a new bucket (only one cheese-yellow).
const first = [scan("Norvegia gulost", "111", 0), scan("Grovbrød", "222", 3), scan("Grovbrød", "222", 4)];
const f = pickMemory(first, { barcode: "111", bucket: "cheese-yellow" }, "en", NOW);
check("new bucket -> FIRST", f?.kind === "FIRST", f?.text);
check("FIRST uses a human noun, not a key", Boolean(f && /yellow cheese/.test(f.text)) , f?.text);

// HABIT — 3+ cured-meat this month.
const habit = [
  scan("Chorizo spekemat", "a1", 0),
  scan("Salami spekemat", "a2", 5),
  scan("Fenalår spekemat", "a3", 10),
  scan("Grovbrød", "b1", 2),
];
const h = pickMemory(habit, { barcode: "a1", bucket: "cured-meat" }, "en", NOW);
check("3 from one bucket this month -> HABIT", h?.kind === "HABIT", h?.text);
check("HABIT is an observation, not a judgement", Boolean(h && !/too much|a lot|should/i.test(h.text)), h?.text);

// STREAK — scans on 4 consecutive days, nothing else notable.
const streak = [scan("A", "s1", 0), scan("B", "s2", 1), scan("C", "s3", 2), scan("D", "s4", 3)];
const st = pickMemory(streak, { barcode: "s1", bucket: "bread" }, "en", NOW);
// (bread is not a repeat/first/habit here because each is a distinct bucketless item)
check("consecutive days -> STREAK or FIRST", st?.kind === "STREAK" || st?.kind === "FIRST", st?.kind);

// Empty history -> null.
check("no history -> null", pickMemory([], { barcode: "x" }, "en", NOW) === null);

// Norwegian localisation.
const nb = pickMemory(repeat, { barcode: "111" }, "no", NOW);
check("nb REPEAT is Norwegian", Boolean(nb && /før/.test(nb.text)), nb?.text);

console.log(`\n${failures ? failures + " FAILURES" : "All memory checks passed."}`);
if (failures) process.exitCode = 1;
