/**
 * One real scan per bucket — reproduces the /api/scan pipeline exactly:
 *   search a real product → fetch Kassalapp + OFF → assemble → Skaren score
 *   → build brief → LIVE Merk verdict + four-slot buy copy → write markdown.
 *
 *   set -a && . ./.env.local && set +a && npx tsx scripts/scanShowcase.mts
 */
import { writeFileSync } from "node:fs";
import { getEcoGrade, getNutritionGrade } from "@/lib/ecoscore";
import { calculateHealthGrade, hasNokkelhullLabel, nutritionDataFromKassalapp } from "@/lib/healthscore";
import { fetchKassalappProduct, searchKassalappProducts } from "@/lib/kassalapp";
import { generateMerkVerdict } from "@/lib/openai";
import { fetchOpenFoodFactsProduct, normalizeOpenFoodFactsProduct } from "@/lib/openfoodfacts";
import { buildProductBrief } from "@/lib/merk/voice/brief";
import { generateMerkCopy } from "@/lib/merk/voice/generate";
import { scoreProduct } from "@/lib/merk/scoreProduct";
import skarenStatsJson from "@/lib/merk/categoryStats.json";
import type { CategoryStats } from "@/lib/merk/categoryScore";
import type { ProductResult } from "@/lib/types";

const SKAREN_CATEGORY_STATS = skarenStatsJson as unknown as CategoryStats;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// One inventive, real Norwegian-shelf search term per bucket. Deliberately not
// Nutella or Cola — the interesting middle of each shelf.
const PICKS: Array<{ bucket: string; term: string }> = [
  { bucket: "cheese-yellow", term: "jarlsberg" },
  { bucket: "cheese-brown", term: "gudbrandsdalsost" },
  { bucket: "cheese-white", term: "feta salatost" },
  { bucket: "cheese-fresh", term: "kremgo" },
  { bucket: "yoghurt", term: "skyr vanilje" },
  { bucket: "milk", term: "kefir" },
  { bucket: "sour-cream", term: "seterrømme" },
  { bucket: "cream", term: "crème fraîche" },
  { bucket: "butter-spread", term: "bremykt" },
  { bucket: "plant-drink", term: "oatly havredrikk" },
  { bucket: "oil", term: "rapsolje" },
  { bucket: "bread", term: "polarbrød" },
  { bucket: "crispbread", term: "wasa sport" },
  { bucket: "biscuits", term: "marie kjeks" },
  { bucket: "cereal", term: "havrefras" },
  { bucket: "pasta", term: "fullkornspasta" },
  { bucket: "crisps", term: "sørlandschips" },
  { bucket: "chocolate", term: "kvikk lunsj" },
  { bucket: "candy", term: "vingummi" },
  { bucket: "nuts", term: "peanøtter salt" },
  { bucket: "snack-bar", term: "maxim proteinbar" },
  { bucket: "ice-cream", term: "iskrem vanilje" },
  { bucket: "pate", term: "leverpostei gilde" },
  { bucket: "cured-meat", term: "fenalår" },
  { bucket: "sausage", term: "grillpølse" },
  { bucket: "minced-meat", term: "karbonadedeig" },
  { bucket: "poultry", term: "kyllingfilet" },
  { bucket: "ham-bacon", term: "bacon strimlet" },
  { bucket: "red-meat", term: "entrecôte" },
  { bucket: "salmon", term: "røkt laks" },
  { bucket: "fish", term: "torskefilet" },
  { bucket: "fish-cakes", term: "fiskekaker" },
  { bucket: "shellfish", term: "reker i lake" },
  { bucket: "meat-alt", term: "quorn filet" },
  { bucket: "dried-fruit", term: "aprikos tørket" },
  { bucket: "jam-honey", term: "nora bringebærsyltetøy" },
  { bucket: "condiment", term: "idun ketchup" },
  { bucket: "soup", term: "toro fiskesuppe" },
  { bucket: "pizza", term: "grandiosa" },
  { bucket: "eggs", term: "frokostegg" },
  { bucket: "juice", term: "appelsinjuice" },
  { bucket: "soft-drink", term: "solo" },
  { bucket: "energy-drink", term: "battery energidrikk" },
  { bucket: "cordial", term: "saft solbær" },
  { bucket: "water", term: "imsdal vann" },
  { bucket: "coffee", term: "friele kaffe" },
  { bucket: "spice", term: "chilipulver" },
  { bucket: "sugar", term: "brunt sukker" },
  { bucket: "baking", term: "hvetemel" },
];

type Row = {
  bucket: string;
  term: string;
  name: string;
  brand: string;
  barcode: string;
  score: number | null;
  band?: string | null;
  shelfMedian?: number | null;
  n?: number | null;
  rank?: number | null;
  rankSuppressed?: string | null;
  ceiling?: number | null;
  ceilingApplied?: boolean;
  mode?: string;
  excluded?: boolean;
  verdictHeadline?: string;
  verdictText?: string;
  verdictExpr?: string;
  verdictSource?: string;
  copyHeadline?: string;
  copyVerdict?: string;
  copyAdditive?: string | null;
  copyBuy?: string;
  copySource?: string;
  note?: string;
};

async function pickBarcode(term: string): Promise<string | null> {
  const results = await searchKassalappProducts(term, 12).catch(() => []);
  const withEan = results.find((r) => r.barcode);
  return withEan?.barcode ?? null;
}

async function scanOne(bucketWanted: string, term: string): Promise<Row> {
  const row: Row = { bucket: bucketWanted, term, name: "", brand: "", barcode: "", score: null };
  const barcode = await pickBarcode(term);
  if (!barcode) { row.note = "no product found for term"; return row; }
  row.barcode = barcode;

  const [kassalappProduct, offRaw] = await Promise.all([
    fetchKassalappProduct(barcode).catch(() => null),
    fetchOpenFoodFactsProduct(barcode).catch(() => null),
  ]);
  const openFoodFactsProduct = offRaw ? normalizeOpenFoodFactsProduct(barcode, offRaw) : null;
  if (!kassalappProduct && !openFoodFactsProduct) { row.note = "not found in either source"; return row; }

  const ecoProduct = openFoodFactsProduct ?? normalizeOpenFoodFactsProduct(barcode, {});
  const product = {
    ...ecoProduct,
    barcode: kassalappProduct?.barcode ?? ecoProduct.barcode,
    name: kassalappProduct?.name ?? ecoProduct.name,
    brand: kassalappProduct?.brand ?? ecoProduct.brand,
    ingredients: kassalappProduct?.ingredients ?? ecoProduct.ingredients,
    image: kassalappProduct?.image ?? null,
    norwegianDataStatus: kassalappProduct ? ("kassalapp" as const) : ("limited" as const),
    storePrices: kassalappProduct?.storePrices ?? [],
    currentPrice: kassalappProduct?.currentPrice ?? null,
    store: kassalappProduct?.store ?? null,
    allergens: kassalappProduct?.allergens ?? [],
    labels: kassalappProduct?.labels ?? [],
    kassalappCategories: kassalappProduct?.categories ?? [],
    kassalappNutrition: kassalappProduct?.nutrition ?? [],
  };
  const productWithGrades = {
    ...product,
    ecoGradeLetter: getEcoGrade(product),
    nutritionGradeLetter: getNutritionGrade(product),
    healthGrade: calculateHealthGrade({
      nutrition: nutritionDataFromKassalapp(product.kassalappNutrition),
      labels: product.labels,
      category: product.categories,
      novaGroup: product.novaGroup,
      additives: product.additives,
    }),
    hasNokkelhull: hasNokkelhullLabel(product.labels),
  } as ProductResult;

  row.name = productWithGrades.name;
  row.brand = productWithGrades.brand ?? "";

  // Skaren score.
  const scored = scoreProduct(productWithGrades);
  row.score = scored.result.score;
  row.band = scored.result.band ?? null;
  row.shelfMedian = scored.result.shelfMedian ?? null;
  row.n = scored.result.n ?? null;
  row.rank = scored.result.rank ?? null;
  row.rankSuppressed = scored.result.rankSuppressed ?? null;
  row.ceiling = scored.result.ceiling ?? null;
  row.ceilingApplied = scored.result.ceilingApplied;
  row.mode = scored.result.mode;
  row.excluded = scored.result.excluded === true;
  // record the real resolved bucket too
  row.bucket = scored.bucket;

  // Brief + LIVE Merk copy (four slots) — English.
  const skarenPct =
    scored.result.score !== null && scored.result.breakdown ? scored.result.breakdown.nutrition : null;
  const brief = buildProductBrief(productWithGrades, {
    stats: SKAREN_CATEGORY_STATS,
    bucket: scored.bucket,
    score: productWithGrades.healthScore ?? scored.result.score ?? undefined,
    percentile: skarenPct,
  });
  const [copyRes, verdict] = await Promise.all([
    generateMerkCopy(brief, "en").catch((e) => ({ copy: null, source: "error:" + String(e) } as any)),
    generateMerkVerdict(productWithGrades, "en").catch(() => null),
  ]);
  if (copyRes?.copy) {
    row.copyHeadline = copyRes.copy.headline;
    row.copyVerdict = copyRes.copy.verdict;
    row.copyAdditive = copyRes.copy.additiveNote;
    row.copyBuy = copyRes.copy.wouldMerkBuy;
    row.copySource = copyRes.source;
  } else {
    row.copySource = copyRes?.source ?? "none";
  }
  if (verdict) {
    row.verdictHeadline = verdict.headline;
    row.verdictText = verdict.text;
    row.verdictExpr = verdict.expression;
    row.verdictSource = verdict.source;
  }
  return row;
}

function md(rows: Row[]): string {
  const now = new Date().toISOString().slice(0, 16).replace("T", " ");
  const scored = rows.filter((r) => r.score !== null).length;
  const out: string[] = [];
  out.push(`# Skaren Score + Merk — one real scan per category`);
  out.push("");
  out.push(`Generated ${now} UTC · Skaren Score v2 · Merk voice (live model) · ${scored}/${rows.length} buckets scored.`);
  out.push("");
  out.push(`Every row below is a **real product**, fetched live from Kassalapp + Open Food Facts, run through the exact \`/api/scan\` pipeline: the category-relative Skaren Score, then Merk's live-generated verdict and buy-note. Numbers come only from each product's own label.`);
  out.push("");
  // quick index table
  out.push(`## At a glance`);
  out.push("");
  out.push(`| Category | Product | Score | Band | vs shelf | Merk's headline |`);
  out.push(`| --- | --- | --- | --- | --- | --- |`);
  for (const r of rows) {
    const score = r.score === null ? (r.excluded ? "—" : "n/a") : String(r.score);
    const band = r.band ?? "";
    const rank = r.rank != null && r.n != null ? `beats ${r.rank}%`
      : r.rankSuppressed === "tight-shelf" ? "tight shelf"
      : r.rankSuppressed === "disagrees" ? "n/a (lopsided)"
      : "";
    const head = (r.copyHeadline || r.verdictHeadline || r.note || "").replace(/\|/g, "/");
    const name = (r.name || r.term).replace(/\|/g, "/");
    out.push(`| ${r.bucket} | ${name} | ${score} | ${band} | ${rank} | ${head} |`);
  }
  out.push("");
  out.push(`## Full scans`);
  out.push("");
  for (const r of rows) {
    out.push(`### ${r.bucket} — ${r.name || r.term}`);
    if (r.brand && r.brand !== "Brand not listed") out.push(`*${r.brand}* · barcode \`${r.barcode || "—"}\``);
    else if (r.barcode) out.push(`barcode \`${r.barcode}\``);
    out.push("");
    if (r.score === null && r.excluded) {
      out.push(`**Skaren Score:** no number — this shelf is deliberately excluded (${r.mode}).`);
    } else if (r.score === null) {
      out.push(`**Skaren Score:** not scored${r.note ? ` (${r.note})` : ""}.`);
    } else {
      const bits = [`**Skaren Score: ${r.score}/100** (${r.band})`];
      if (r.shelfMedian != null) bits.push(`shelf median ${r.shelfMedian}`);
      if (r.rank != null && r.n != null) bits.push(`beats ${r.rank}% of the ${r.n} on this shelf`);
      else if (r.rankSuppressed === "tight-shelf") bits.push(`rank withheld: this shelf is tightly packed`);
      else if (r.rankSuppressed === "disagrees") bits.push(`rank withheld: the shelf is lopsided (band and rank disagree)`);
      if (r.ceilingApplied) bits.push(`ceiling ${r.ceiling} applied`);
      out.push(bits.join(" · "));
    }
    out.push("");
    if (r.verdictHeadline || r.verdictText) {
      out.push(`**Merk's verdict** (${r.verdictExpr ?? "?"}, ${r.verdictSource ?? "?"})`);
      out.push(`> **${r.verdictHeadline ?? ""}**`);
      if (r.verdictText) out.push(`> ${r.verdictText}`);
      out.push("");
    }
    if (r.copyHeadline || r.copyBuy) {
      out.push(`**Merk's copy** (${r.copySource ?? "?"})`);
      if (r.copyHeadline) out.push(`> _${r.copyHeadline}_`);
      if (r.copyVerdict) out.push(`> ${r.copyVerdict}`);
      if (r.copyAdditive) out.push(`> ${r.copyAdditive}`);
      out.push("");
      if (r.copyBuy) {
        out.push(`**What would Merk buy?**`);
        out.push(`> ${r.copyBuy}`);
        out.push("");
      }
    }
    out.push("---");
    out.push("");
  }
  return out.join("\n");
}

async function main() {
  const rows: Row[] = [];
  for (const p of PICKS) {
    process.stdout.write(`${p.bucket.padEnd(16)} "${p.term}" … `);
    try {
      const r = await scanOne(p.bucket, p.term);
      rows.push(r);
      const s = r.score === null ? (r.excluded ? "excluded" : "n/a") : String(r.score);
      console.log(`${r.name || "—"}  score=${s} copy=${r.copySource ?? "-"} verdict=${r.verdictSource ?? "-"}`);
    } catch (e) {
      console.log("ERROR " + String(e));
      rows.push({ bucket: p.bucket, term: p.term, name: "", brand: "", barcode: "", score: null, note: String(e) });
    }
    // stay well under 60 API calls/min: each scan is ~3-4 calls
    await sleep(1500);
  }
  writeFileSync("Skaren-scan-showcase.md", md(rows));
  console.log(`\nWrote Skaren-scan-showcase.md (${rows.length} rows).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
