/**
 * merk/healthGrade.ts
 *
 * One entry point for the Health grade shown on the result screen.
 *
 * Order of preference:
 *   1. Nutri-Score from Open Food Facts, when it exists and is applicable.
 *      It is already category-adjusted (separate tracks for cheese, added fats,
 *      beverages), which is precisely the problem our own absolute model has.
 *   2. Skaren's own category-relative score (merk/categoryScore.ts), when the
 *      shelf has enough products to be trustworthy.
 *   3. Skaren's absolute model (lib/healthscore.ts), as the last resort.
 *
 * Every result carries `source` and `model` so the "why?" sheet can state which
 * engine produced the number, and so a re-tune never silently rewrites history.
 *
 * NOTE: Nutri-Score grades nutrition only. Additives and processing stay ours —
 * they are scored separately and are never folded into this number.
 */

import type { GradeLetter } from "@/lib/types";
import { calculateHealthScore, type HealthScoreInput } from "@/lib/healthscore";
import { scoreInCategory, type CategoryStats, type ScoreResult as CategoryScoreResult } from "./categoryScore";

export const HEALTH_MODEL_VERSION = "health-1.0";

export type HealthSource = "nutriscore" | "skaren-category" | "skaren-absolute";

export type HealthGradeResult = {
  grade: GradeLetter;
  /** 0-100, comparable across sources. */
  score: number;
  source: HealthSource;
  model: string;
  /** False when the source is a low-confidence fallback — UI shows "limited data". */
  confident: boolean;
  /** One plain sentence for the "why?" sheet. */
  basis: string;
  /** Present when source === "skaren-category". */
  percentile?: number;
  sampleSize?: number;
};

/* ------------------------------------------------------------------ *
 * 1 · Nutri-Score
 * ------------------------------------------------------------------ */

/** Values Open Food Facts uses when it cannot grade a product. */
const NOT_GRADED = new Set(["unknown", "not-applicable", "not-applicable-", "", "not rated"]);

export type NutriScoreFields = {
  /** "a".."e" */
  nutriscore_grade?: string | null;
  /** legacy alias */
  nutrition_grades?: string | null;
  /** raw points, roughly -15 (best) .. 40 (worst) */
  nutriscore_score?: number | null;
};

const isGrade = (v: unknown): v is GradeLetter =>
  typeof v === "string" && /^[a-e]$/i.test(v.trim());

/**
 * Nutri-Score points -> 0-100.
 * The scale runs about -15 (best) to 40 (worst); we clamp and invert so the
 * number reads the same direction as every other score in the app.
 */
export function nutriPointsToScore(points: number): number {
  const clamped = Math.max(-15, Math.min(40, points));
  return Math.round(((40 - clamped) / 55) * 100);
}

/** Midpoint of each grade band, used when only the letter is published. */
const GRADE_MIDPOINT: Record<GradeLetter, number> = { A: 90, B: 70, C: 50, D: 30, E: 12 };

export function readNutriScore(fields: NutriScoreFields): { grade: GradeLetter; score: number } | null {
  const raw = (fields.nutriscore_grade ?? fields.nutrition_grades ?? "").toString().trim().toLowerCase();
  if (!raw || NOT_GRADED.has(raw) || !isGrade(raw)) return null;

  const grade = raw.toUpperCase() as GradeLetter;
  const score =
    typeof fields.nutriscore_score === "number" && Number.isFinite(fields.nutriscore_score)
      ? nutriPointsToScore(fields.nutriscore_score)
      : GRADE_MIDPOINT[grade];

  return { grade, score };
}

/* ------------------------------------------------------------------ *
 * 2 · Resolver
 * ------------------------------------------------------------------ */

const scoreToGrade = (score: number): GradeLetter =>
  score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : score >= 20 ? "D" : "E";

export type ResolveHealthInput = {
  /** Straight from the Open Food Facts payload. */
  offFields?: NutriScoreFields | null;
  /** Everything our own models need. */
  fallback: HealthScoreInput;
  /** Category-relative inputs; omit to skip straight to the absolute model. */
  category?: {
    key: string;
    stats: CategoryStats;
    nutrition: { salt?: number | null; satFat?: number | null; protein?: number | null };
    watchAdditives: number;
  };
};

export function resolveHealthGrade(input: ResolveHealthInput): HealthGradeResult {
  // --- 1 · Nutri-Score, when published -----------------------------
  const nutri = input.offFields ? readNutriScore(input.offFields) : null;
  if (nutri) {
    return {
      grade: nutri.grade,
      score: nutri.score,
      source: "nutriscore",
      model: HEALTH_MODEL_VERSION,
      confident: true,
      basis: "Nutrition graded by Nutri-Score. Additives and processing scored by Skaren."
    };
  }

  // --- 2 · Our category-relative score ------------------------------
  if (input.category) {
    const { key, stats, nutrition, watchAdditives } = input.category;
    const result: CategoryScoreResult | null = scoreInCategory(
      {
        category: key,
        salt: nutrition.salt ?? null,
        satFat: nutrition.satFat ?? null,
        protein: nutrition.protein ?? null,
        watchAdditives,
      },
      stats
    );
    if (result && result.confident) {
      return {
        grade: scoreToGrade(result.score),
        score: result.score,
        source: "skaren-category",
        model: HEALTH_MODEL_VERSION,
        confident: true,
        percentile: result.percentile,
        sampleSize: result.n,
        basis: `Compared with ${result.n} other products in the same category. No Nutri-Score published for this item.`
      };
    }
  }

  // --- 3 · Absolute fallback ----------------------------------------
  const score = calculateHealthScore(input.fallback);

  return {
    grade: scoreToGrade(score),
    score,
    source: "skaren-absolute",
    model: HEALTH_MODEL_VERSION,
    confident: false,
    basis: "Limited data — no Nutri-Score published and too few similar products to compare against."
  };
}

/* ------------------------------------------------------------------ *
 * 3 · UI helpers
 * ------------------------------------------------------------------ */

/** Short attribution line for the score card / "why?" sheet. */
export function healthAttribution(result: HealthGradeResult): string {
  switch (result.source) {
    case "nutriscore":
      return "Nutri-Score";
    case "skaren-category":
      return `Skaren · ${result.sampleSize} in category`;
    case "skaren-absolute":
      return "Skaren · limited data";
  }
}

/** Word shown under the grade letter on the Health tile. */
export function healthVerdict(grade: GradeLetter): string {
  return { A: "Excellent", B: "Good", C: "Average", D: "Poor", E: "Weak" }[grade];
}
