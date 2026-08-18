/**
 * Skaren · one nutrient parser, one set of plausibility gates (audit D1 + D2)
 *
 * Every nutrient value in the app flows through here. Two rules, both absolute:
 *
 *   D1 — absent stays absent. A blank, an empty string, a NaN, or an
 *        all-zero placeholder record becomes `null`, never 0. A missing figure
 *        must drop its weight from the score, and must never reach Merk's brief
 *        (if the number is not in the slice, he cannot say it). `0` is a value a
 *        source ASSERTS, not one we infer from silence.
 *
 *   D2 — no implausible number survives. Three cheap gates (absolute bounds,
 *        internal consistency, bucket p1/p99). Any failure nulls the nutrient
 *        and logs the barcode, so the log becomes the data-quality backlog.
 *
 * It also fixes a matcher collision the audit surfaced: the Norwegian codes
 * `enumettet_fett` (monounsaturated) and `flerumettet_fett` (polyunsaturated)
 * both contain the substring "mettet", so a naive saturated-fat match on
 * "mettet" grabbed a monounsaturated 57 g and reported it as saturated fat.
 * The exclude lists below make each nutrient match exactly one row.
 */

import type { KassalappNutrition } from "@/lib/types";
import type { ScoreNutrients } from "@/lib/merk/score";

/** The subset of a bucket stat the p1/p99 gate needs: optional percentile bands
 *  per nutrient. Accepts either the score's BucketStat or the brief's lighter
 *  CategoryStat — both carry {p10,p90} bands under nutrient keys. Other fields
 *  (n, scores…) are ignored, so we accept a loose record. */
export type StatBands = { [key: string]: unknown };

/** The single number parser. No `?? 0` may exist anywhere else in the app. */
export function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Absolute physical bounds per 100 g. Physics, not nutrition. Anything outside
 *  is a data error, not a remarkable product. */
const BOUNDS: Record<string, [number, number]> = {
  energy: [0, 900], // kcal
  fat: [0, 100],
  satFat: [0, 100],
  carbs: [0, 100],
  sugar: [0, 100],
  fibre: [0, 80],
  protein: [0, 90],
  salt: [0, 100],
};

// Matcher terms per nutrient. `exclude` is what makes each match exactly one
// Kassalapp row — see the collision note above.
const TERMS: Record<string, { include: string[]; exclude: string[]; kcal?: boolean }> = {
  energy: { include: ["energi_kcal", "kcal", "energy", "energi", "calorie"], exclude: [], kcal: true },
  fat: { include: ["fett_totalt", "fett", "fat"], exclude: ["mettet", "umettet", "syre"] },
  satFat: { include: ["mettet_fett", "mettede", "saturated"], exclude: ["umettet", "enumettet", "flerumettet"] },
  carbs: { include: ["karbohydrat", "carbohydrate"], exclude: [] },
  sugar: { include: ["sukkerarter", "sukker", "sugars", "sugar", "hvorav sukker", "herav sukker"], exclude: ["alkohol", "polyol"] },
  fibre: { include: ["kostfiber", "fiber", "fibre"], exclude: [] },
  protein: { include: ["protein"], exclude: [] },
  salt: { include: ["salt"], exclude: ["syre"] },
};

/** Read one nutrient off the flat Kassalapp list, honouring include/exclude and
 *  the kcal-over-kJ preference. Returns null when the label is silent. */
export function readNutrientRaw(nutrition: KassalappNutrition[], key: keyof typeof TERMS): number | null {
  const t = TERMS[key];
  const candidates = nutrition.filter((entry) => {
    const text = `${entry.code} ${entry.displayName}`.toLowerCase();
    return t.include.some((m) => text.includes(m)) && !t.exclude.some((e) => text.includes(e));
  });
  if (candidates.length === 0) return null;
  // Prefer a kcal row for energy; if only a kJ row exists, convert it.
  if (t.kcal) {
    const kcal = candidates.find((c) => c.unit.toLowerCase().includes("kcal") || c.code.toLowerCase().includes("kcal"));
    if (kcal) return num(kcal.amount);
    const kj = candidates.find((c) => c.unit.toLowerCase().includes("kj") || c.code.toLowerCase().includes("kj"));
    if (kj) { const v = num(kj.amount); return v == null ? null : Math.round(v / 4.184); }
  }
  return num(candidates[0].amount);
}

export type NutrientBundle = {
  energy: number | null;
  fat: number | null;
  satFat: number | null;
  carbs: number | null;
  sugar: number | null;
  fibre: number | null;
  protein: number | null;
  salt: number | null;
};

export type Rejection = { nutrient: string; value: number; reason: string };

/** Read all nutrients, then run the D1 + D2 gates. Returns the cleaned bundle
 *  (nulls where a value was absent or implausible) and the list of rejections
 *  for logging. `stat` is optional; when present it powers the bucket p1/p99
 *  sanity gate (gate 3). */
export function readCleanNutrients(
  nutrition: KassalappNutrition[],
  stat?: StatBands | null
): { nutrients: NutrientBundle, rejections: Rejection[] } {
  const rejections: Rejection[] = [];
  const raw: NutrientBundle = {
    energy: readNutrientRaw(nutrition, "energy"),
    fat: readNutrientRaw(nutrition, "fat"),
    satFat: readNutrientRaw(nutrition, "satFat"),
    carbs: readNutrientRaw(nutrition, "carbs"),
    sugar: readNutrientRaw(nutrition, "sugar"),
    fibre: readNutrientRaw(nutrition, "fibre"),
    protein: readNutrientRaw(nutrition, "protein"),
    salt: readNutrientRaw(nutrition, "salt"),
  };

  // ── D1 · all-zero placeholder record ─────────────────────────────────
  // Kassalapp/OFF sometimes store a product with every field literally 0. A
  // food with zero energy AND zero macros is not a food — it is an empty row.
  // Treat the WHOLE record as absent so an incomplete label cannot score as a
  // perfect product (the least-bad-crisp-reads-88 failure, root cause).
  const macros = [raw.energy, raw.fat, raw.carbs, raw.protein, raw.sugar];
  const present = macros.filter((v) => v != null);
  const allZero = present.length > 0 && present.every((v) => v === 0);
  if (allZero) {
    for (const k of Object.keys(raw) as Array<keyof NutrientBundle>) {
      if (raw[k] != null) rejections.push({ nutrient: k, value: raw[k] as number, reason: "all-zero-record" });
      raw[k] = null;
    }
    return { nutrients: raw, rejections };
  }

  const drop = (k: keyof NutrientBundle, reason: string) => {
    if (raw[k] != null) rejections.push({ nutrient: k, value: raw[k] as number, reason });
    raw[k] = null;
  };

  // ── D2 gate 1 · absolute bounds ──────────────────────────────────────
  for (const k of Object.keys(BOUNDS) as Array<keyof NutrientBundle>) {
    const v = raw[k];
    if (v == null) continue;
    const [lo, hi] = BOUNDS[k];
    if (v < lo || v > hi) drop(k, `out-of-bounds(${lo}..${hi})`);
  }

  // ── D2 gate 2 · internal consistency — a part cannot exceed its whole ─
  if (raw.satFat != null && raw.fat != null && raw.satFat > raw.fat + 0.5) drop("satFat", "satFat>fat");
  if (raw.sugar != null && raw.carbs != null && raw.sugar > raw.carbs + 0.5) drop("sugar", "sugar>carbs");
  // The Atwater energy cross-check: kcal ≈ 9·fat + 4·carbs + 4·protein (±25%).
  if (raw.energy != null && raw.fat != null && raw.carbs != null && raw.protein != null) {
    const predicted = 9 * raw.fat + 4 * raw.carbs + 4 * raw.protein;
    if (predicted > 0 && (raw.energy < predicted * 0.5 || raw.energy > predicted * 1.6)) {
      // The energy figure is the least-trusted (often a placeholder); drop it,
      // not the macros, so the shelf comparison still runs.
      drop("energy", "energy-macro-mismatch");
    }
  }

  // ── D2 gate 3 · bucket sanity (p1/p99 of the shelf itself) ────────────
  // A value far outside what the whole shelf ever shows is almost certainly a
  // bad record. We approximate p1≈p10·0.5 and p99≈p90·2 from the shipped bands.
  if (stat) {
    const check: Array<[keyof NutrientBundle, string]> = [
      ["satFat", "satFat"], ["sugar", "sugar"], ["protein", "protein"], ["salt", "salt"], ["fibre", "fibre"],
    ];
    for (const [nk, sk] of check) {
      const v = raw[nk];
      const band = (stat as unknown as Record<string, { p10: number; p90: number } | null>)[sk];
      if (v == null || !band) continue;
      const lo = band.p10 * 0.5;
      const hi = band.p90 * 2 + 0.5;
      if (v < lo - 0.001 || v > hi) drop(nk, `outside-shelf-p1p99(${lo.toFixed(1)}..${hi.toFixed(1)})`);
    }
  }

  return { nutrients: raw, rejections };
}

/** Map a cleaned bundle onto the score's nutrient shape. */
export function toScoreNutrients(b: NutrientBundle): ScoreNutrients {
  return { salt: b.salt, satFat: b.satFat, sugar: b.sugar, protein: b.protein, fibre: b.fibre, energy: b.energy };
}
