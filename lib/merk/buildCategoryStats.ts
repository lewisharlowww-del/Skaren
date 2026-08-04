/**
 * Merk · offline stats builder
 *
 * Run this on your machine, not in the app:
 *   KASSALAPP_TOKEN=… npx tsx lib/merk/buildCategoryStats.ts
 *
 * It pages one category at a time, keeps only the numbers the model needs,
 * and writes lib/merk/categoryStats.json. Regenerate weekly; ship the JSON.
 */

import { writeFileSync } from 'node:fs';
import { buildCategoryStats, type ScoreInput } from './categoryScore';

const TOKEN = process.env.KASSALAPP_TOKEN;
const BASE = 'https://kassal.app/api/v1';
const PAGE_SIZE = 100;
const RATE_MS = 1100;          // stay under 60 req/min
const MIN_BUCKET = 30;

/** Bucket list: numeric category ids from the catalogue's own taxonomy. */
const BUCKETS: Array<{ id: number; label: string }> = [
  // Fill from GET /products/categories — these are placeholders.
  { id: 1, label: 'gulost' },
  { id: 2, label: 'yoghurt' },
  { id: 3, label: 'matolje' },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(path: string, params: Record<string, string | number>) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (res.status === 429) { await sleep(5000); return get(path, params); }
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

/** Kassalapp nutrition arrives as [{code, amount, unit}] — pull what we need. */
function nutrient(nutrition: any[], codes: string[]): number | null {
  for (const code of codes) {
    const hit = nutrition?.find((n) => n?.code === code);
    if (hit && Number.isFinite(Number(hit.amount))) return Number(hit.amount);
  }
  return null;
}

function toScoreInput(p: any, bucket: string): ScoreInput | null {
  const n = p?.nutrition ?? [];
  const salt = nutrient(n, ['salt']);
  const satFat = nutrient(n, ['saturatedFat', 'fatSaturated']);
  const protein = nutrient(n, ['protein']);
  if (salt == null && satFat == null && protein == null) return null;
  return {
    category: bucket,
    salt, satFat, protein,
    watchAdditives: 0,   // not needed for spreads — additives are absolute
  };
}

async function collect(id: number, bucket: string): Promise<ScoreInput[]> {
  const out: ScoreInput[] = [];
  for (let page = 1; page <= 20; page++) {
    const json = await get('/products', { category_id: id, size: PAGE_SIZE, page });
    const items: any[] = json?.data ?? [];
    for (const p of items) {
      const row = toScoreInput(p, bucket);
      if (row) out.push(row);
    }
    if (items.length < PAGE_SIZE) break;
    await sleep(RATE_MS);
  }
  return out;
}

async function main() {
  if (!TOKEN) throw new Error('Set KASSALAPP_TOKEN');
  const all: ScoreInput[] = [];

  for (const { id, label } of BUCKETS) {
    const key = `cat:${id}`;
    const rows = await collect(id, key);
    console.log(`${label.padEnd(18)} ${String(rows.length).padStart(4)} products` +
      (rows.length < MIN_BUCKET ? '   ← too thin, will fall back' : ''));
    all.push(...rows);
    await sleep(RATE_MS);
  }

  const stats = buildCategoryStats(all);
  writeFileSync('lib/merk/categoryStats.json', JSON.stringify(stats, null, 2));

  // Sanity print — spreads that collapse mean the bucket is unusable.
  for (const [key, s] of Object.entries(stats)) {
    const flat = s.salt.p10 === s.salt.p90;
    console.log(`${key}  n=${s.n}  salt ${s.salt.p10}–${s.salt.p90}` + (flat ? '  ← flat' : ''));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
