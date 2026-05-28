import type { EcoGrade, GradeLetter, ProductResult } from "@/lib/types";

const gradeScores: Record<EcoGrade, number> = {
  a: 90,
  b: 75,
  c: 55,
  d: 35,
  e: 15,
  unknown: 50
};

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

export function getSkarenScore(grade: EcoGrade) {
  return gradeScores[grade];
}

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

export function getOverallSkarenGrade(healthGrade?: GradeLetter | null, ecoGrade?: GradeLetter | null): GradeLetter | null {
  if (healthGrade && ecoGrade) {
    return scoreToGrade(Math.round((gradeLetterToScore(healthGrade) + gradeLetterToScore(ecoGrade)) / 2));
  }

  return healthGrade ?? ecoGrade ?? null;
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

function estimateNutritionBoost(product: ProductResult) {
  if (product.nutriGrade !== "Not rated" || product.kassalappNutrition.length === 0) return 0;

  const byCode = new Map(product.kassalappNutrition.map((item) => [item.code.toLowerCase(), item]));
  const sugar = byCode.get("sugars") ?? byCode.get("sugar");
  const salt = byCode.get("salt");
  const protein = byCode.get("proteins") ?? byCode.get("protein");
  let boost = 0;

  if (typeof sugar?.amount === "number" && sugar.amount > 15) boost -= 5;
  if (typeof salt?.amount === "number" && salt.amount > 1.5) boost -= 5;
  if (typeof protein?.amount === "number" && protein.amount >= 8) boost += 5;

  return boost;
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

export function getOverallGrade(product: ProductResult): GradeLetter {
  return getOverallSkarenGrade(product.healthGrade, product.ecoGradeLetter ?? getEcoGrade(product)) ?? "C";
}

export function getProductSkarenScore(product: ProductResult) {
  if (product.ecoGrade !== "unknown") {
    return getSkarenScore(product.ecoGrade);
  }

  return calculateFallbackScore({
    nutri_score: product.nutriGrade,
    packaging: product.packaging,
    categories: `${product.categories} ${product.name} ${product.brand}`,
    ingredients: product.ingredients,
    origins: product.origins,
    nutritionBoost: estimateNutritionBoost(product)
  });
}

export function getScoreTone(score: number) {
  if (score === 90) return "text-emerald-800 bg-emerald-100 border-emerald-200";
  if (score === 75) return "text-lime-800 bg-lime-100 border-lime-300";
  if (score === 55) return "text-yellow-800 bg-yellow-100 border-yellow-300";
  if (score === 35) return "text-orange-800 bg-orange-100 border-orange-300";
  if (score === 15) return "text-red-800 bg-red-100 border-red-300";
  return "text-zinc-700 bg-zinc-100 border-zinc-300";
}

export function getScoreSummary(score: number, grade: EcoGrade) {
  if (grade === "unknown") {
    return "Skaren calculated its own estimate from the available nutrition, packaging, category, ingredient, and origin data.";
  }

  if (score >= 80) return "This looks like a stronger eco choice based on the available product data.";
  if (score >= 55) return "This product has a mixed profile. It may be fine, but there is room for a better swap.";
  return "This product appears to have a lower eco profile based on the available data.";
}

export function getScoreReasons(product: ProductResult) {
  const hasPackaging = product.packaging !== "Packaging info unavailable";
  const hasOrigins = product.origins !== "Origin unknown";
  const hasNutriScore = product.nutriGrade !== "Not rated";
  const originCount = hasOrigins ? product.origins.split(",").filter((origin) => origin.trim()).length : 0;
  const packagingText = product.packaging.toLowerCase();
  const reasons = [
    product.ecoGrade === "unknown"
      ? "No official Eco-Score available — we calculated our own estimate"
      : `Official Eco-Score ${product.ecoGrade.toUpperCase()} — included in this product's Skaren score`,
    hasPackaging
      ? packagingText.includes("plastic")
        ? `Packaging: ${product.packaging} detected — lower score impact`
        : `Packaging: ${product.packaging} detected — considered in the estimate`
      : "Packaging details are missing — we used a neutral estimate",
    hasOrigins
      ? originCount > 3
        ? "Made in multiple countries — longer transport distances"
        : `Origin: ${product.origins} — fewer listed origins can help the estimate`
      : "Origin is unknown — we used a neutral transport estimate"
  ];

  if (hasNutriScore) {
    reasons.push(`Nutri-Score ${product.nutriGrade.toUpperCase()} — ${product.nutriGrade.toLowerCase() === "e" ? "low nutritional quality affects our estimate" : "nutritional quality is included in our estimate"}`);
  } else {
    reasons.push("No Nutri-Score available — nutrition had a neutral effect");
  }

  return reasons;
}

export function getSwapSuggestions(product: ProductResult, score: number) {
  if (score >= 75) {
    return [
      {
        name: "Keep comparing similar products",
        reason: "This item already scores well, so look for simple packaging and local origin when possible.",
        estimatedScore: Math.min(95, score + 5)
      }
    ];
  }

  const category = product.categories?.toLowerCase() ?? "";
  const base = category.includes("drink") || category.includes("beverage")
    ? [
        ["Local refill drink", "Lower packaging impact when bought in reusable bottles", 82],
        ["Glass-bottle alternative", "Often easier to recycle where local systems support it", 76],
        ["Concentrated format", "Less shipped weight and less packaging per serving", 80]
      ]
    : category.includes("snack") || category.includes("sweet")
      ? [
          ["Bulk-bin snack option", "Can reduce single-use wrapper waste", 78],
          ["Organic oat snack", "Often uses simpler ingredients and lighter packaging", 72],
          ["Locally made alternative", "Shorter supply chain can improve the footprint estimate", 74]
        ]
      : [
          ["Lower-packaging alternative", "Choose products with recyclable or minimal packaging", 78],
          ["Local brand option", "Shorter transport distance can improve the estimate", 74],
          ["Certified sustainable swap", "Look for credible environmental labels on similar products", 82]
        ];

  return base.map(([name, reason, estimatedScore]) => ({
    name: String(name),
    reason: String(reason),
    estimatedScore: Number(estimatedScore)
  }));
}
