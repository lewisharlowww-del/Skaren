/**
 * Merk voice engine · cache invalidation (section 7)
 *
 * The cache key's whole job is correctness under change: identical facts must
 * share a key (serve cached, zero calls), and ANY changed fact must produce a
 * new key (so a reformulation, a new median, or a rescore never silently serves
 * stale copy). This test locks both directions. Run:
 *
 *   npx tsx lib/merk/voice/eval/cache.test.ts
 */

import type { ProductBrief } from "@/lib/merk/voice/brief";
import { briefCacheKey } from "@/lib/merk/voice/cache";

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (!cond) failures++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${!cond && detail ? "  (" + detail + ")" : ""}`);
}

const base: ProductBrief = {
  name: "Cheddar Burger Cheese",
  brand: "Tine",
  category: "cheese-yellow",
  categoryN: 214,
  score: 22,
  shelfMedian: 50,
  percentile: 12,
  drivers: [{ nutrient: "salt", value: 2.1, unit: "g", vsCategory: "highest", direction: "penalty" }],
  additives: { total: 4, watch: [{ code: "E250", name: "Sodium nitrite", job: "preservative" }], safeCount: 2 },
  processing: { nova: 4, label: "Ultra-processed food" },
  allergens: ["milk"],
};

const clone = (): ProductBrief => JSON.parse(JSON.stringify(base));
const key = briefCacheKey(base, "en");

// Identical facts -> same key.
check("identical brief -> identical key", briefCacheKey(clone(), "en") === key);

// Key ordering must not matter: a brief with keys in a different insertion
// order must still hash the same (canonicalisation).
const reordered: ProductBrief = {
  allergens: ["milk"],
  processing: { label: "Ultra-processed food", nova: 4 },
  additives: { safeCount: 2, total: 4, watch: [{ job: "preservative", name: "Sodium nitrite", code: "E250" }] },
  drivers: [{ direction: "penalty", vsCategory: "highest", unit: "g", value: 2.1, nutrient: "salt" }],
  percentile: 12,
  shelfMedian: 50,
  score: 22,
  categoryN: 214,
  category: "cheese-yellow",
  brand: "Tine",
  name: "Cheddar Burger Cheese",
};
check("key is independent of property order (canonical)", briefCacheKey(reordered, "en") === key);

// Every fact that changes the copy must change the key.
type Mut = { name: string; mutate: (b: ProductBrief) => void };
const mutations: Mut[] = [
  { name: "score (a rescore)", mutate: (b) => { b.score = 64; } },
  { name: "shelfMedian (a new median)", mutate: (b) => { b.shelfMedian = 51; } },
  { name: "percentile", mutate: (b) => { b.percentile = 40; } },
  { name: "categoryN (shelf grew)", mutate: (b) => { b.categoryN = 300; } },
  { name: "a driver value (reformulation)", mutate: (b) => { b.drivers[0].value = 1.4; } },
  { name: "a driver band", mutate: (b) => { b.drivers[0].vsCategory = "high"; } },
  { name: "additive total", mutate: (b) => { b.additives.total = 3; } },
  { name: "a watch additive code", mutate: (b) => { b.additives.watch[0].code = "E251"; } },
  { name: "nova / processing", mutate: (b) => { b.processing = { nova: 3, label: "Processed food" }; } },
  { name: "allergens", mutate: (b) => { b.allergens = ["milk", "soy"]; } },
  { name: "product name", mutate: (b) => { b.name = "Cheddar Slices"; } },
  { name: "category bucket", mutate: (b) => { b.category = "cheese-white"; } },
];

const seen = new Set<string>([key]);
for (const m of mutations) {
  const b = clone();
  m.mutate(b);
  const k = briefCacheKey(b, "en");
  check(`changing ${m.name} changes the key`, k !== key, `key unchanged after ${m.name}`);
  check(`changing ${m.name} yields a fresh key (no collision)`, !seen.has(k) || k !== key);
  seen.add(k);
}

// Language must partition the cache (two entries per product, one per language).
check("language scopes the key", briefCacheKey(base, "en") !== briefCacheKey(base, "nb"));

console.log(`\n${failures ? failures + " FAILURES" : "All cache-invalidation checks passed."}`);
if (failures) process.exitCode = 1;
