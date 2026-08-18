/**
 * Skaren Score · category stats builder (run offline, ship the JSON)
 *
 *   npx tsx lib/merk/buildStats.ts
 *
 * Reads KASSALAPP_API_KEY from the environment (the same var the rest of the
 * app uses). For each bucket it searches the catalogue by a representative
 * term, pages through unique products (which carry nutrition inline), maps the
 * Kassalapp nutrition codes to the score's nutrients, then runs the two-pass
 * buildStats to produce lib/merk/categoryStats.json.
 *
 * Regenerate weekly; ship the JSON. Never hand-edit the output.
 */

import { writeFileSync } from "node:fs";
import { buildStatsWithDiagnostics, pctl, type StatInputProduct } from "@/lib/merk/stats";
import { bucketOf } from "@/lib/merk/categories";
import { countWatchlisted } from "@/lib/merk/watchlist";
import { normalizeAdditiveCode } from "@/lib/additives";

const TOKEN = process.env.KASSALAPP_API_KEY;
const BASE = "https://kassal.app/api/v1";
const PAGE_SIZE = 100;
const MAX_PAGES = 6; // up to ~600 products per search term
const RATE_MS = 1100; // stay under the 60 calls/min API limit (1 call/sec + margin)

// One search term per bucket. Broad enough to fill the shelf, specific enough
// to stay on it. bucketOf() re-buckets every returned product, so a term that
// pulls a few neighbours is fine — they land in their own bucket or drop out.
const BUCKET_TERMS: string[] = [
  "gulost", "brunost", "hvitost", "kremost", "yoghurt", "melk", "rømme", "fløte",
  "smør margarin", "havredrikk", "olivenolje", "rapsolje", "brød", "knekkebrød",
  "rundstykker", "frokostblanding", "pasta", "ris", "potetgull", "sjokolade",
  "godteri", "kjeks", "nøtter", "proteinbar", "iskrem", "leverpostei", "spekemat",
  "pølse", "kjøttdeig", "kylling", "bacon", "biff", "laks", "torsk", "fiskekaker",
  "reker", "tofu", "frosne bær", "frosne grønnsaker", "rosiner", "hermetiske bønner",
  "syltetøy", "peanøttsmør", "ketchup", "pastasaus", "suppe", "krydder", "sukker",
  "energidrikk", "brus", "saft", "juice", "vann", "kaffe", "pizza", "ferdigmiddag",
  "barnemat", "egg",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type KassalNutrition = { code: string; amount: number; unit: string };
type KassalProduct = {
  name?: string;
  category?: Array<{ name?: string }>;
  ingredients?: string;
  nutrition?: KassalNutrition[];
};

async function search(term: string, page: number): Promise<KassalProduct[]> {
  const url = new URL(`${BASE}/products`);
  url.searchParams.set("search", term);
  url.searchParams.set("size", String(PAGE_SIZE));
  url.searchParams.set("unique", "1");
  url.searchParams.set("page", String(page));
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (res.status === 429) { await sleep(4000); return search(term, page); }
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const json = (await res.json()) as { data?: KassalProduct[] };
  return json.data ?? [];
}

// Kassalapp nutrition codes → the score's nutrients (per 100 g).
function amount(n: KassalNutrition[] | undefined, codes: string[]): number | null {
  if (!n) return null;
  for (const code of codes) {
    const hit = n.find((x) => x.code === code);
    if (hit && Number.isFinite(Number(hit.amount))) return Number(hit.amount);
  }
  return null;
}

// Parse the E-numbers out of the ingredient text (deduplicated).
function additiveCodes(ingredients: string | undefined): string[] {
  if (!ingredients) return [];
  const codes = (ingredients.match(/e[\s-]?\d{3,4}[a-z]?/gi) ?? [])
    .map((raw) => normalizeAdditiveCode(raw))
    .filter((c): c is string => Boolean(c));
  return Array.from(new Set(codes));
}

// Parse E-numbers out of the ingredient text and count the watch-listed ones.
function watchCount(ingredients: string | undefined): number {
  return countWatchlisted(additiveCodes(ingredients));
}

function toStatInput(p: KassalProduct): StatInputProduct | null {
  const bucket = bucketOf({
    name: p.name ?? null,
    category: p.category?.map((c) => c.name).filter(Boolean).join(" ") ?? null,
  });
  if (bucket === "unbucketed") return null;
  const n = p.nutrition;
  const nutrients = {
    salt: amount(n, ["salt"]),
    satFat: amount(n, ["mettet_fett", "fett_mettet"]),
    sugar: amount(n, ["sukkerarter", "sukker"]),
    protein: amount(n, ["protein"]),
    fibre: amount(n, ["kostfiber", "fiber"]),
    energy: amount(n, ["energi_kcal", "energi", "kcal"]),
  };
  if (nutrients.salt == null && nutrients.satFat == null && nutrients.protein == null && nutrients.sugar == null) {
    return null; // no usable nutrition
  }
  return {
    bucket,
    nutrients,
    watchAdditives: watchCount(p.ingredients),
    // v2 — carry the ingredient list + additive codes so pass 2 scores with the
    // real five layers (ingredient signals, tiered additives, ceiling).
    ingredients: p.ingredients ?? null,
    additiveCodes: additiveCodes(p.ingredients),
    nova: null,
  };
}

async function main() {
  if (!TOKEN) throw new Error("Set KASSALAPP_API_KEY");
  const all: StatInputProduct[] = [];
  const seen = new Set<string>();

  for (const term of BUCKET_TERMS) {
    let got = 0;
    for (let page = 1; page <= MAX_PAGES; page++) {
      const items = await search(term, page);
      for (const p of items) {
        const key = `${p.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const row = toStatInput(p);
        if (row) { all.push(row); got++; }
      }
      if (items.length < PAGE_SIZE) break;
      await sleep(RATE_MS);
    }
    console.log(`${term.padEnd(22)} +${got}`);
    await sleep(RATE_MS);
  }

  // Cache the raw collected inputs so the calibration can be refitted without
  // re-hitting the API (spec section 8 — fit the curve to the real distribution).
  writeFileSync("lib/merk/.statsInputs.json", JSON.stringify(all));

  const { stats, rawScores } = buildStatsWithDiagnostics(all);
  writeFileSync("lib/merk/categoryStats.json", JSON.stringify(stats, null, 2));

  const buckets = Object.keys(stats).sort();
  console.log(`\n${all.length} products → ${buckets.length} buckets (n≥30):`);
  for (const b of buckets) {
    const s = stats[b];
    console.log(`  ${b.padEnd(18)} n=${String(s.n).padStart(3)}  scoreP50=${s.scoreP50}`);
  }

  // Raw (pre-calibration) distribution — the basis for the calibration knots.
  const qs = [0.1, 0.25, 0.5, 0.75, 0.9];
  console.log(`\nRAW score distribution (n=${rawScores.length}) — fit calibration so p50 → 50:`);
  console.log("  " + qs.map((q) => `p${q * 100}=${pctl(rawScores, q).toFixed(1)}`).join("  "));
}

main().catch((e) => { console.error(e); process.exit(1); });
