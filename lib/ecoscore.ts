import type { EcoGrade, GradeLetter, ProductResult } from "@/lib/types";

export function normalizeEcoGrade(value?: string | null): EcoGrade {
  const grade = value
    ?.toLowerCase()
    .trim()
    .replace(/^[a-z]{2}:/, "")
    .replace("ecoscore-", "")
    .replace("environmental-score-", "");

  if (grade === "a" || grade === "b" || grade === "c" || grade === "d" || grade === "e") {
    return grade;
  }

  return "unknown";
}

export const hasEcoData = (product: unknown): boolean => {
  const p = product as Record<string, unknown> | null | undefined;
  const grade = String(p?.ecoscore_grade ?? p?.eco_score_grade ?? p?.ecoGrade ?? "").toLowerCase().trim();
  return (
    !!grade &&
    grade !== "unknown" &&
    grade !== "not-applicable" &&
    grade !== "not_applicable" &&
    grade !== ""
  );
};

export function scoreToGrade(score: number): GradeLetter {
  if (score >= 81) return "A";
  if (score >= 61) return "B";
  if (score >= 41) return "C";
  if (score >= 21) return "D";
  return "E";
}

export function gradeLetterToScore(grade: GradeLetter) {
  return { A: 90, B: 75, C: 55, D: 35, E: 15 }[grade];
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function isUnknownValue(value: string, unknownLabel: string) {
  return !value.trim() || value === unknownLabel;
}

export function calculateFallbackScore({
  nutri_score,
  packaging,
  categories,
  ingredients,
  origins,
  nutritionBoost = 0
}: {
  nutri_score?: string | null;
  packaging?: string | null;
  categories?: string | null;
  ingredients?: string | null;
  origins?: string | null;
  nutritionBoost?: number;
}) {
  const nutriScore = nutri_score?.toLowerCase().trim();
  const packagingText = packaging?.toLowerCase().trim() ?? "";
  const categoryText = `${categories ?? ""} ${ingredients ?? ""}`.toLowerCase().trim();
  const originText = origins?.toLowerCase().trim() ?? "";
  const isPlantBased = includesAny(categoryText, ["vegetar", "vegansk", "vegan", "plantebasert", "plant-based"]);
  const isSausageLike = includesAny(categoryText, ["pølse", "pølser", "polse", "polser", "sausage", "sausages", "wiener"]);

  const nutriPoints = nutriScore === "a" ? 20 : nutriScore === "b" ? 15 : nutriScore === "c" ? 10 : nutriScore === "d" ? 5 : nutriScore === "e" ? 0 : 10;

  let packagingPoints = 5;
  if (!isUnknownValue(packagingText, "packaging info unavailable")) {
    if (packagingText.includes("glass")) packagingPoints = 15;
    else if (includesAny(packagingText, ["cardboard", "paper"])) packagingPoints = 12;
    else if (packagingText.includes("recyclable")) packagingPoints = 10;
    else if (includesAny(packagingText, ["aluminium", "aluminum", "can"])) packagingPoints = 8;
    else if (packagingText.includes("plastic")) packagingPoints = 0;
  }

  let categoryPoints = 10;
  if (categoryText.includes("water")) categoryPoints = 20;
  else if (isPlantBased && isSausageLike) categoryPoints = 43;
  else if (includesAny(categoryText, ["vegetable", "fruit", "plant", "vegetar", "vegansk", "vegan", "plantebasert"])) categoryPoints = 18;
  else if (includesAny(categoryText, ["organic", "bio"])) categoryPoints = 15;
  else if (includesAny(categoryText, ["soda", "soft drink", "sugar"])) categoryPoints = 0;
  else if (includesAny(categoryText, ["meat", "beef"])) categoryPoints = 2;
  else if (includesAny(categoryText, ["dairy", "milk"])) categoryPoints = 8;

  let originPoints = 5;
  if (!isUnknownValue(originText, "origin unknown")) {
    const originCount = originText.split(",").filter((origin) => origin.trim().length > 0).length;
    originPoints = originCount > 3 ? 3 : 10;
  }

  return Math.min(100, Math.max(15, nutriPoints + packagingPoints + categoryPoints + originPoints + nutritionBoost));
}

function findNutritionAmount(product: ProductResult, terms: string[]) {
  const match = product.kassalappNutrition.find((item) => {
    const text = `${item.code} ${item.displayName}`.toLowerCase();
    return terms.some((term) => text.includes(term));
  });

  if (!match || typeof match.amount !== "number") return null;

  if (terms.includes("calories") || terms.includes("energy") || terms.includes("kcal")) {
    const unit = match.unit.toLowerCase();
    return unit.includes("kj") ? match.amount / 4.184 : match.amount;
  }

  return match.amount;
}

export function getEcoGrade(product: ProductResult): GradeLetter {
  if (product.ecoGrade !== "unknown") {
    return product.ecoGrade.toUpperCase() as GradeLetter;
  }

  const ecoOnlyScore = calculateFallbackScore({
    packaging: product.packaging,
    categories: `${product.categories} ${product.name} ${product.brand}`,
    ingredients: product.ingredients,
    origins: product.origins
  });

  return scoreToGrade(ecoOnlyScore);
}

export function getNutritionGrade(product: ProductResult): GradeLetter {
  const nutriGrade = product.nutriGrade.toLowerCase().trim();
  if (nutriGrade === "a" || nutriGrade === "b" || nutriGrade === "c" || nutriGrade === "d" || nutriGrade === "e") {
    return nutriGrade.toUpperCase() as GradeLetter;
  }

  const calories = findNutritionAmount(product, ["energy", "energi", "calories", "calorie", "kcal", "kj"]);
  const sugar = findNutritionAmount(product, ["sugars", "sugar", "sukker", "sukkerarter"]);
  const fat = findNutritionAmount(product, ["fat", "fett"]);
  const salt = findNutritionAmount(product, ["salt"]);

  let score = 90;
  if (typeof calories === "number") score -= calories > 400 ? 25 : calories >= 150 ? 10 : 0;
  else score -= 10;

  if (typeof sugar === "number") score -= sugar > 15 ? 25 : sugar >= 5 ? 10 : 0;
  else score -= 8;

  if (typeof fat === "number") score -= fat > 17 ? 20 : fat >= 5 ? 8 : 0;
  else score -= 6;

  if (typeof salt === "number") score -= salt > 1.5 ? 20 : salt >= 0.3 ? 8 : 0;
  else score -= 6;

  return scoreToGrade(Math.max(15, score));
}
