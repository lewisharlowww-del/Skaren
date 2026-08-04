import type { GradeLetter, KassalappNutrition } from "@/lib/types";

export type NutritionData = {
  calories?: number;
  fat?: number;
  saturatedFat?: number;
  carbohydrates?: number;
  sugars?: number;
  protein?: number;
  salt?: number;
  fiber?: number;
};

export type HealthScoreInput = {
  nutrition: NutritionData;
  labels: string[];
  category: string;
  novaGroup?: 1 | 2 | 3 | 4 | null;
  additives?: Array<{ risk: "safe" | "moderate" | "avoid" }>;
};

function scoreToHealthGrade(score: number): GradeLetter {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  if (score >= 20) return "D";
  return "E";
}

export function hasNokkelhullLabel(labels: string[]) {
  return labels.some((label) => {
    const normalized = label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replaceAll("ø", "o");

    return normalized.includes("nokkelhull") || normalized.includes("nøkkelhull");
  });
}

function isRedMeatCategory(category: string) {
  const text = category.toLowerCase();
  return /(pork|beef|svin|storfe|okse|biff|kjøtt|kjott|ribbe|bacon|red meat|red-meat)/i.test(text);
}

function isButterOrCreamCategory(category: string) {
  const text = category.toLowerCase();
  return /(butter|smør|smoer|cream|fløte|flote|crème|creme)/i.test(text);
}

export function calculateHealthScore({ nutrition, labels, category, novaGroup, additives }: HealthScoreInput) {
  let score = 50;

  if (hasNokkelhullLabel(labels)) score += 30;

  if (typeof nutrition.protein === "number") {
    if (nutrition.protein >= 15) score += 15;
    else if (nutrition.protein >= 10) score += 10;
  }

  if (typeof nutrition.fiber === "number") {
    if (nutrition.fiber >= 6) score += 15;
    else if (nutrition.fiber >= 3) score += 10;
  }

  if (typeof nutrition.sugars === "number") {
    if (nutrition.sugars <= 5) score += 15;
    else if (nutrition.sugars <= 10) score += 8;

    if (nutrition.sugars >= 20) score -= 25;
    else if (nutrition.sugars >= 15) score -= 15;
    else if (nutrition.sugars >= 10) score -= 8;
  }

  if (typeof nutrition.salt === "number") {
    if (nutrition.salt <= 0.3) score += 15;
    else if (nutrition.salt <= 0.8) score += 8;

    if (nutrition.salt >= 1.5) score -= 20;
    else if (nutrition.salt >= 1) score -= 10;
  }

  if (typeof nutrition.saturatedFat === "number") {
    if (nutrition.saturatedFat <= 1.5) score += 10;

    if (nutrition.saturatedFat >= 10) score -= 30;
    else if (nutrition.saturatedFat >= 7) score -= 20;
    else if (nutrition.saturatedFat >= 5) score -= 15;
    else if (nutrition.saturatedFat >= 3) score -= 8;
  }

  if (typeof nutrition.fat === "number") {
    if (nutrition.fat >= 50) score -= 35;
    else if (nutrition.fat >= 35) score -= 28;
    else if (nutrition.fat >= 25) score -= 20;
  }

  if (typeof nutrition.calories === "number") {
    if (nutrition.calories <= 150) score += 10;

    if (nutrition.calories >= 500) score -= 15;
    else if (nutrition.calories >= 400) score -= 8;
  }

  const hasHighFat = typeof nutrition.fat === "number" && nutrition.fat >= 25;
  const hasHighSaturatedFat = typeof nutrition.saturatedFat === "number" && nutrition.saturatedFat >= 7;

  if (typeof nutrition.calories === "number" && nutrition.calories >= 400 && hasHighFat) {
    score -= 15;
  }

  if (isRedMeatCategory(category) && hasHighFat) {
    score -= 12;
  }

  if (isRedMeatCategory(category) && hasHighSaturatedFat) {
    score -= 15;
  }

  if (isButterOrCreamCategory(category) && hasHighFat) {
    score -= 18;
  }

  // ── NOVA processing level penalty ────────────────────────────────────────
  if (novaGroup === 4) score -= 25;
  else if (novaGroup === 3) score -= 10;

  // ── Additive risk penalties ───────────────────────────────────────────────
  if (additives && additives.length > 0) {
    const avoidCount = additives.filter((a) => a.risk === "avoid").length;
    const moderateCount = additives.filter((a) => a.risk === "moderate").length;
    // Each "avoid" additive: -12, capped at -24 total
    score -= Math.min(avoidCount * 12, 24);
    // Each "moderate" additive above the first: -4, capped at -12 total
    score -= Math.min(Math.max(0, moderateCount - 1) * 4, 12);
  }

  return Math.max(0, Math.min(100, score));
}

export function calculateHealthGrade(input: HealthScoreInput): GradeLetter {
  return scoreToHealthGrade(calculateHealthScore(input));
}

export type ScoreFactor = {
  /** Machine key so the UI can translate; never shown raw. */
  key:
    | "nokkelhull" | "protein" | "fiber" | "sugars" | "salt"
    | "saturatedFat" | "fat" | "calories" | "nova" | "additives";
  /** The number that triggered it, for the one-line reason. */
  detail?: string;
  value: number;
};

/**
 * The same ladder as calculateHealthScore, itemised.
 *
 * This exists so the "why?" sheet can show real working rather than a plausible
 * story: every row here is a rule that actually ran. The baseline is 50, not
 * the 100 the design mock used — the sheet prints whichever number the model
 * really starts from, because a made-up baseline is exactly the kind of thing
 * this screen is supposed to rule out.
 */
export const HEALTH_SCORE_BASELINE = 50;

export function explainHealthScore(input: HealthScoreInput): ScoreFactor[] {
  const { nutrition, labels, category, novaGroup, additives } = input;
  const factors: ScoreFactor[] = [];
  const push = (key: ScoreFactor["key"], value: number, detail?: string) => {
    if (value !== 0) factors.push({ key, value, detail });
  };

  if (hasNokkelhullLabel(labels)) push("nokkelhull", 30);

  if (typeof nutrition.protein === "number") {
    const value = nutrition.protein >= 15 ? 15 : nutrition.protein >= 10 ? 10 : 0;
    push("protein", value, `${nutrition.protein} g`);
  }

  if (typeof nutrition.fiber === "number") {
    const value = nutrition.fiber >= 6 ? 15 : nutrition.fiber >= 3 ? 10 : 0;
    push("fiber", value, `${nutrition.fiber} g`);
  }

  if (typeof nutrition.sugars === "number") {
    let value = nutrition.sugars <= 5 ? 15 : nutrition.sugars <= 10 ? 8 : 0;
    if (nutrition.sugars >= 20) value -= 25;
    else if (nutrition.sugars >= 15) value -= 15;
    else if (nutrition.sugars >= 10) value -= 8;
    push("sugars", value, `${nutrition.sugars} g`);
  }

  if (typeof nutrition.salt === "number") {
    let value = nutrition.salt <= 0.3 ? 15 : nutrition.salt <= 0.8 ? 8 : 0;
    if (nutrition.salt >= 1.5) value -= 20;
    else if (nutrition.salt >= 1) value -= 10;
    push("salt", value, `${nutrition.salt} g`);
  }

  if (typeof nutrition.saturatedFat === "number") {
    let value = nutrition.saturatedFat <= 1.5 ? 10 : 0;
    if (nutrition.saturatedFat >= 10) value -= 30;
    else if (nutrition.saturatedFat >= 7) value -= 20;
    else if (nutrition.saturatedFat >= 5) value -= 15;
    else if (nutrition.saturatedFat >= 3) value -= 8;
    push("saturatedFat", value, `${nutrition.saturatedFat} g`);
  }

  if (typeof nutrition.fat === "number") {
    let value = 0;
    if (nutrition.fat >= 50) value = -35;
    else if (nutrition.fat >= 35) value = -28;
    else if (nutrition.fat >= 25) value = -20;
    // Category-specific piles-on, folded into the same row so the sheet does
    // not list "fat" three times for one product.
    const hasHighFat = nutrition.fat >= 25;
    if (typeof nutrition.calories === "number" && nutrition.calories >= 400 && hasHighFat) value -= 15;
    if (isRedMeatCategory(category) && hasHighFat) value -= 12;
    if (isButterOrCreamCategory(category) && hasHighFat) value -= 18;
    push("fat", value, `${nutrition.fat} g`);
  }

  if (typeof nutrition.saturatedFat === "number" && isRedMeatCategory(category) && nutrition.saturatedFat >= 7) {
    push("saturatedFat", -15, `${nutrition.saturatedFat} g`);
  }

  if (typeof nutrition.calories === "number") {
    let value = nutrition.calories <= 150 ? 10 : 0;
    if (nutrition.calories >= 500) value -= 15;
    else if (nutrition.calories >= 400) value -= 8;
    push("calories", value, `${nutrition.calories} kcal`);
  }

  if (novaGroup === 4) push("nova", -25, "NOVA 4");
  else if (novaGroup === 3) push("nova", -10, "NOVA 3");

  if (additives && additives.length > 0) {
    const avoid = additives.filter((a) => a.risk === "avoid").length;
    const moderate = additives.filter((a) => a.risk === "moderate").length;
    const value = -(Math.min(avoid * 12, 24) + Math.min(Math.max(0, moderate - 1) * 4, 12));
    push("additives", value, `${avoid + moderate}`);
  }

  return factors;
}

function findNutritionAmount(nutrition: KassalappNutrition[], matches: string[], excludes: string[] = [], preferredUnits: string[] = []) {
  const candidates = nutrition.filter((entry) => {
    const text = `${entry.code} ${entry.displayName}`.toLowerCase();
    const isMatch = matches.some((match) => text.includes(match));
    const isExcluded = excludes.some((exclude) => text.includes(exclude));

    return isMatch && !isExcluded && Number.isFinite(entry.amount);
  });
  const match = preferredUnits.length > 0
    ? candidates.find((entry) => preferredUnits.some((unit) => entry.unit.toLowerCase().includes(unit))) ?? candidates[0]
    : candidates[0];

  if (!match) return undefined;

  if (preferredUnits.includes("kcal") && match.unit.toLowerCase().includes("kj")) {
    return match.amount / 4.184;
  }

  return match.amount;
}

export function nutritionDataFromKassalapp(nutrition: KassalappNutrition[]): NutritionData {
  return {
    calories: findNutritionAmount(nutrition, ["energy", "energi", "calories", "calorie", "kcal", "kj"], [], ["kcal"]),
    fat: findNutritionAmount(nutrition, ["fat", "fett"], ["saturated", "mettede", "mettet"]),
    saturatedFat: findNutritionAmount(nutrition, ["saturated", "mettede", "mettet"]),
    carbohydrates: findNutritionAmount(nutrition, ["carbohydrate", "karbohydrat"]),
    sugars: findNutritionAmount(nutrition, ["sugars", "sugar", "sukker", "sukkerarter"]),
    protein: findNutritionAmount(nutrition, ["protein", "proteins"]),
    salt: findNutritionAmount(nutrition, ["salt"]),
    fiber: findNutritionAmount(nutrition, ["fiber", "fibre", "kostfiber"])
  };
}
