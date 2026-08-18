/**
 * Skaren Score v2 · layer tests (spec §1–§13)
 *
 * Locks the five layers the v2 spec adds: profiles sum to 1, ingredient signals
 * cite the word they matched, additive tiers price by evidence, the category
 * ceiling binds and is reported, plain buckets flatten, and bands map right.
 * Also runs the p90/p10 "two buckets wearing one name" diagnostic (§13).
 *
 *   npx tsx lib/merk/eval/scoreV2.test.ts
 */

import type { CategoryStats } from "@/lib/merk/score";
import { skarenScore, SCORE_VERSION, type ScoreProduct } from "@/lib/merk/score";
import { PROFILES, profileSum, type ProfileName } from "@/lib/merk/profiles";
import { BUCKETS, FLOOR, CEILING, MODE_OF } from "@/lib/merk/buckets";
import { ingredientSignals } from "@/lib/merk/ingredients";
import { additiveLoad, resolveAdditives, tierOfCode, jobOfCode } from "@/lib/merk/additiveLoad";

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (!cond) failures++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${!cond && detail ? "  (" + detail + ")" : ""}`);
}

const band = (p10: number, p50: number, p90: number) => ({ p10, p50, p90 });

// A stand-in stats table shaped like the shipped json, with sugar/energy bands
// so the v2 profiles (drinkSweet, sweetSnack) have something to read.
const STATS: CategoryStats = {
  "cheese-yellow": { n: 214, salt: band(0.9, 1.5, 2.4), satFat: band(12, 17, 22), sugar: band(0, 0.1, 1.2), protein: band(18, 24, 28), fibre: null, energy: null, scoreP50: 51 },
  crisps: { n: 96, salt: band(0.9, 1.4, 2.1), satFat: band(2, 3.5, 6), sugar: band(0.5, 2, 5), protein: band(4, 6, 8), fibre: band(3, 4.5, 6), energy: null, scoreP50: 40, scores: [20, 25, 30, 35, 40, 45, 50, 55, 60, 62] },
  bread: { n: 180, salt: band(0.8, 1.0, 1.4), satFat: band(0.3, 0.8, 2), sugar: band(1, 3, 7), protein: band(7, 9, 12), fibre: band(3, 5, 9), energy: null, scoreP50: 52 },
  "soft-drink": { n: 120, salt: band(0, 0, 0.1), satFat: band(0, 0, 0.1), sugar: band(0, 6, 11), protein: band(0, 0, 0.5), fibre: null, energy: band(0, 25, 46), scoreP50: 20 },
  poultry: { n: 90, salt: band(0.1, 0.3, 0.9), satFat: band(0.5, 1.5, 4), sugar: band(0, 0, 0.5), protein: band(18, 22, 26), fibre: null, energy: null, scoreP50: 88 },
  chocolate: { n: 120, salt: band(0.05, 0.2, 0.5), satFat: band(10, 18, 26), sugar: band(40, 52, 60), protein: band(4, 6, 9), fibre: band(1, 3, 7), energy: null, scoreP50: 30 },
};

const P = (bucket: string, nutrients: ScoreProduct["nutrients"], extra: Partial<ScoreProduct> = {}): ScoreProduct => ({
  bucket, nutrients, watchAdditives: 0, nova: 3, ...extra,
});

// ── §2 profiles ────────────────────────────────────────────────────────────
for (const name of Object.keys(PROFILES) as ProfileName[]) {
  check(`profile ${name} sums to 1.00`, Math.abs(profileSum(name) - 1) < 1e-9, String(profileSum(name)));
}

// ── §6 ceiling binds and is reported ─────────────────────────────────────────
{
  // The cleanest crisp: least salty, most fibre for its shelf, no additives.
  const cleanCrisp = P("crisps", { salt: 0.9, satFat: 2, sugar: 0.5, protein: 8, fibre: 6 }, { nova: 3 });
  const r = skarenScore(cleanCrisp, STATS);
  check("clean crisp is capped at the crisps ceiling (62)", r.score !== null && r.score <= 62, `${r.score}`);
  check("clean crisp reports ceilingApplied", r.score !== null && r.ceilingApplied === true, JSON.stringify(r.score !== null ? { c: r.ceilingApplied } : r));
  check("clean crisp ceiling value is 62", r.score !== null && r.ceiling === 62, `${r.score !== null ? r.ceiling : "?"}`);
  check("clean crisp still 'best of shelf' (near ceiling)", r.score !== null && r.score >= 55, `${r.score}`);
}

// ── §13 the ceiling does NOT lift a low product ──────────────────────────────
{
  const badCrisp = P("crisps", { salt: 2.1, satFat: 6, sugar: 5, protein: 4, fibre: 3 }, { nova: 4 });
  const r = skarenScore(badCrisp, STATS);
  check("a poor crisp is not lifted by the ceiling", r.score !== null && r.ceilingApplied === false, `${r.score !== null ? r.ceilingApplied : "?"}`);
}

// ── §4 ingredient signals cite their word ────────────────────────────────────
{
  const sugarLead = ingredientSignals("Sukker, hvetemel, kakao, palmeolje, aroma");
  const leads = sugarLead.items.find((i) => i.id === "sugar-leads");
  check("sugar-leads fires when sugar is first", !!leads, JSON.stringify(sugarLead.items.map((i) => i.id)));
  check("sugar-leads cites the word", !!leads && /sukker/.test(leads.cite), leads?.cite);
  const palm = sugarLead.items.find((i) => i.id === "palm-oil");
  check("palm-oil fires and cites palmeolje", !!palm && /palmeolje/.test(palm.cite), palm?.cite);

  const clean = ingredientSignals("Sammalt hvete, vann, gjær, salt");
  const wg = clean.items.find((i) => i.id === "wholegrain-first");
  check("wholegrain-first fires and cites sammalt", !!wg && /sammalt/.test(wg.cite), wg?.cite);
  const nothing = clean.items.find((i) => i.id === "nothing-added");
  check("nothing-added fires on a clean 4-item list", !!nothing, JSON.stringify(clean.items.map((i) => i.id)));
  check("short-list fires at 5 or fewer", clean.items.some((i) => i.id === "short-list"));
  check("signals clamp to ±12", clean.total <= 12 && ingredientSignals("Sukker, palmeolje, aspartam, aroma, mel, salt, vann, olje, eple, tomat, agurk, banan, gulrot, poteter, kikerter, linser").total >= -12);

  const single = ingredientSignals("Oliven");
  check("single-origin fires on a one-item list", single.items.some((i) => i.id === "single-origin"), JSON.stringify(single.items.map((i) => i.id)));
}

// ── §5 additive tiers price by evidence + redundancy ─────────────────────────
{
  check("nitrite is tier 1", tierOfCode("e250") === 1, String(tierOfCode("e250")));
  check("nitrite job is preservative", jobOfCode("e250") === "preservative", jobOfCode("e250"));
  const nitrite = additiveLoad(resolveAdditives(["e250"]));
  check("one tier-1 additive costs 10", nitrite.total === -10, String(nitrite.total));
  // Two preservatives doing the same job → −10−10 plus a −3 redundancy.
  const twoPreserv = additiveLoad(resolveAdditives(["e250", "e251"]));
  check("two same-job preservatives add redundancy", twoPreserv.redundantJobs.includes("preservative") && twoPreserv.total === -23, `${twoPreserv.total} ${twoPreserv.redundantJobs}`);
  check("additive load floors at −28", additiveLoad(resolveAdditives(["e250", "e251", "e102", "e110"])).total === -28);
}

// ── §13 plain buckets flatten into 70..100 ───────────────────────────────────
{
  const leanChicken = P("poultry", { salt: 0.1, satFat: 0.5, sugar: 0, protein: 26 }, { nova: 1 });
  const fattyThigh = P("poultry", { salt: 0.9, satFat: 4, sugar: 0.5, protein: 18 }, { nova: 1 });
  const rl = skarenScore(leanChicken, STATS);
  const rf = skarenScore(fattyThigh, STATS);
  check("plain: lean chicken scores in 70..100", rl.score !== null && rl.score >= 70 && rl.score <= 100, `${rl.score}`);
  check("plain: fatty thigh also >= 70 (noise does not tank it)", rf.score !== null && rf.score >= 70, `${rf.score}`);
  check("plain: real difference still separates them", rl.score !== null && rf.score !== null && rl.score > rf.score, `${rl.score} vs ${rf.score}`);
  check("plain: mode reported as plain", rl.score !== null && rl.mode === "plain");
}

// ── §13 excluded buckets give no number ──────────────────────────────────────
{
  const r = skarenScore(P("water", { salt: 0 }), STATS);
  check("water is excluded (no score, excluded flag)", r.score === null && r.confidence === "limited" && r.excluded === true, JSON.stringify(r));
  check("spice is excluded via the registry", MODE_OF("spice") === "excluded");
}

// ── §9 bands map correctly ───────────────────────────────────────────────────
{
  const soda = skarenScore(P("soft-drink", { salt: 0, satFat: 0, sugar: 11, protein: 0, energy: 46 }, { nova: 4 }), STATS);
  check("a sugary soda lands in a low band", soda.score !== null && (soda.band === "poor" || soda.band === "weak"), `${soda.score}/${soda.score !== null ? soda.band : "?"}`);
  const goodBread = skarenScore(P("bread", { salt: 0.8, satFat: 0.3, sugar: 1, protein: 12, fibre: 9 }, { nova: 3, ingredients: "Sammalt hvete, vann, gjær, salt" }), STATS);
  check("a wholegrain bread lands mid-or-better", goodBread.score !== null && ["middling", "good", "excellent"].includes(goodBread.band), `${goodBread.score}/${goodBread.score !== null ? goodBread.band : "?"}`);
}

// ── §7 FLOOR + version ───────────────────────────────────────────────────────
{
  const worst = skarenScore(P("chocolate", { salt: 0.5, satFat: 26, sugar: 60, protein: 4, fibre: 1 }, { nova: 4, additiveCodes: ["e250", "e251", "e102"] }), STATS);
  check("nothing drops below the floor", worst.score !== null && worst.score >= FLOOR, `${worst.score}`);
  check("score version is 2.0.0", SCORE_VERSION === "2.0.0");
}

// ── §13 the p90/p10 diagnostic (a bucket > 6× on its heavy nutrient is two) ──
{
  const flagged: string[] = [];
  for (const [bucket, s] of Object.entries(STATS)) {
    const cfg = BUCKETS[bucket];
    if (!cfg?.profile) continue;
    const weights = PROFILES[cfg.profile];
    const heavy = (Object.entries(weights).sort((a, b) => b[1] - a[1])[0]?.[0]) as keyof typeof s | undefined;
    const spread = heavy ? (s as unknown as Record<string, { p10: number; p90: number } | null>)[heavy] : null;
    if (spread && spread.p10 > 0 && spread.p90 / spread.p10 > 6) flagged.push(`${bucket}:${heavy}`);
  }
  // The stand-in table is not a real split candidate; the diagnostic must simply
  // run and return an inspectable list (empty here) rather than throw.
  check("p90/p10 split diagnostic runs", Array.isArray(flagged), flagged.join(","));
}

// ── ceiling registry sanity ──────────────────────────────────────────────────
check("every scored/plain bucket has a ceiling ≥ FLOOR", Object.values(BUCKETS).every((b) => b.mode === "excluded" || (b.ceiling != null && b.ceiling >= FLOOR)));
check("CEILING() returns the crisps ceiling", CEILING("crisps") === 62);

console.log(`\n${failures ? failures + " FAILURES" : "All Skaren Score v2 checks passed."}`);
if (failures) process.exitCode = 1;
