// Pure data helpers for the product detail screen.
//
// These functions transform a ProductResult into the shapes the UI renders
// (nutrition rows, key insights, normalized defaults). They contain no JSX and
// no React, so they live here to keep app/product/[barcode]/page.tsx focused on
// data-loading and rendering, and to make the logic unit-testable in isolation.

import { getEcoGrade, getNutritionGrade } from "@/lib/ecoscore";
import {
  calculateHealthGrade,
  hasNokkelhullLabel,
  nutritionDataFromKassalapp
} from "@/lib/healthscore";
import { t, type Language } from "@/lib/i18n";
import type { ProductInsight, ProductResult } from "@/lib/types";

export type NutritionRow = {
  label: string;
  matchKey: string;
  amount: number;
  displayAmount: string;
  tone: string;
};

/**
 * Fill in default values for optional ProductResult fields and derive the
 * health/eco/nutrition grades when they are not already present. Applied to
 * every product before it is stored or rendered.
 */
export function withProductDefaults(product: ProductResult): ProductResult {
  const productWithDefaults = {
    ...product,
    displayImage: product.displayImage ?? null,
    displayImageSource: product.displayImageSource ?? "placeholder",
    placeholderEmoji: product.placeholderEmoji ?? "🌿",
    norwegianDataStatus: product.norwegianDataStatus ?? "limited",
    storePrices: product.storePrices ?? [],
    currentPrice: product.currentPrice ?? null,
    store: product.store ?? null,
    allergens: product.allergens ?? [],
    labels: product.labels ?? [],
    kassalappCategories: product.kassalappCategories ?? [],
    kassalappNutrition: product.kassalappNutrition ?? [],
    additives: product.additives ?? [],
    novaGroup: product.novaGroup ?? null,
    hasNokkelhull: product.hasNokkelhull ?? hasNokkelhullLabel(product.labels ?? []),
    aiSummary: product.aiSummary ?? []
  };

  return {
    ...productWithDefaults,
    ecoGradeLetter: product.ecoGradeLetter ?? getEcoGrade(productWithDefaults),
    nutritionGradeLetter: product.nutritionGradeLetter ?? getNutritionGrade(productWithDefaults),
    healthGrade: product.healthGrade ?? calculateHealthGrade({
      nutrition: nutritionDataFromKassalapp(productWithDefaults.kassalappNutrition),
      labels: productWithDefaults.labels,
      category: productWithDefaults.categories,
      novaGroup: productWithDefaults.novaGroup,
      additives: productWithDefaults.additives
    })
  };
}

function normalizeCalories(amount: number, unit: string) {
  return unit.toLowerCase().includes("kj") ? amount / 4.184 : amount;
}

/**
 * Whether we have a real basis to show a health grade: an official Nutri-Score,
 * actual Kassalapp nutrition values, or the Norwegian Nøkkelhull label. Being a
 * Kassalapp product on its own is NOT enough - that used to show a confident
 * "C" built purely from the neutral base score.
 */
export function hasNutritionSignal(product: ProductResult) {
  const nutri = product.nutriGrade.toLowerCase();
  return (
    ["a", "b", "c", "d", "e"].includes(nutri) ||
    product.kassalappNutrition.length > 0 ||
    product.hasNokkelhull
  );
}

function formatNutritionAmount(amount: number, unit: string) {
  const formatted = Number.isInteger(amount) ? String(amount) : amount.toFixed(1);
  return `${formatted}${unit ? ` ${unit}` : ""}`;
}

function findNutritionForRow(
  product: ProductResult,
  matches: string[],
  excludes: string[] = [],
  preferredUnits: string[] = []
) {
  const candidates = product.kassalappNutrition.filter((entry) => {
    if (entry.amount === 0) return false;

    const text = `${entry.code} ${entry.displayName}`.toLowerCase();
    const isMatch = matches.some((match) => text.includes(match));
    const isExcluded = excludes.some((exclude) => text.includes(exclude));

    return isMatch && !isExcluded;
  });

  return preferredUnits.length > 0
    ? candidates.find((entry) => preferredUnits.some((unit) => entry.unit.toLowerCase().includes(unit))) ?? candidates[0] ?? null
    : candidates[0] ?? null;
}

function getNutritionValueTone(label: string, amount: number) {
  const good     = "sk-grade-a";
  const moderate = "sk-grade-c";
  const poor     = "sk-grade-e";
  const neutral  = "sk-grade-d";

  if (label === "Calories") {
    if (amount < 150) return good;
    if (amount <= 400) return moderate;
    return poor;
  }

  if (label === "Sugars") {
    if (amount < 5) return good;
    if (amount <= 15) return moderate;
    return poor;
  }

  if (label === "Fat") {
    if (amount < 5) return good;
    if (amount <= 17) return moderate;
    return poor;
  }

  if (label === "Saturated fat") {
    if (amount < 1.5) return good;
    if (amount <= 5) return moderate;
    return poor;
  }

  if (label === "Salt") {
    if (amount < 0.3) return good;
    if (amount <= 1.5) return moderate;
    return poor;
  }

  if (label === "Protein") {
    if (amount > 15) return good;
    if (amount >= 5) return moderate;
    return neutral;
  }

  if (label === "Fiber") {
    if (amount >= 6) return good;
    if (amount >= 3) return moderate;
    return neutral;
  }

  return neutral;
}

export function getNutritionRows(product: ProductResult, lang: Language = "en"): NutritionRow[] {
  const wanted = [
    { key: "nutrition_calories" as const,      matchKey: "Calories",      matches: ["energy", "energi", "calories", "calorie", "kcal", "kj"], calories: true, preferredUnits: ["kcal"] },
    { key: "nutrition_fat" as const,           matchKey: "Fat",           matches: ["fat", "fett"], excludes: ["saturated", "mettede", "mettet"] },
    { key: "nutrition_saturated_fat" as const, matchKey: "Saturated fat", matches: ["saturated", "mettede", "mettet"] },
    { key: "nutrition_carbs" as const,         matchKey: "Carbs",         matches: ["carbohydrate", "karbohydrat"] },
    { key: "nutrition_sugars" as const,        matchKey: "Sugars",        matches: ["sugars", "sugar", "sukker", "sukkerarter"] },
    { key: "nutrition_fiber" as const,         matchKey: "Fiber",         matches: ["fiber", "fibre", "kostfiber"] },
    { key: "nutrition_protein" as const,       matchKey: "Protein",       matches: ["protein", "proteins"] },
    { key: "nutrition_salt" as const,          matchKey: "Salt",          matches: ["salt"] }
  ];

  return wanted
    .map((item) => {
      const nutrition = findNutritionForRow(
        product,
        item.matches,
        "excludes" in item ? item.excludes : [],
        "preferredUnits" in item ? item.preferredUnits : []
      );

      if (!nutrition) return null;
      const amount = "calories" in item ? normalizeCalories(nutrition.amount, nutrition.unit) : nutrition.amount;

      return {
        label: t(item.key, lang),
        matchKey: item.matchKey,
        amount,
        displayAmount: item.matchKey === "Calories" ? `${Math.round(amount)} kcal` : formatNutritionAmount(nutrition.amount, nutrition.unit),
        tone: getNutritionValueTone(item.matchKey, amount)
      };
    })
    .filter((row): row is NutritionRow => Boolean(row));
}

export function visibleIngredients(product: ProductResult) {
  const ingredients = product.ingredients.trim();
  if (!ingredients || ingredients === "Ingredients unavailable") return null;
  return ingredients;
}

const insightGoodKeywords = [
  "minimally processed",
  "minimal processing",
  "whole food",
  "whole-food",
  "organic",
  "certified",
  "fairtrade",
  "nokkelhull",
  "nøkkelhull",
  "natural",
  "no additives",
  "no additive",
  "no artificial",
  "simple ingredients",
  "no sugar",
  "no added sugar",
  "low sugar",
  "low salt",
  "low sodium",
  "protein",
  "fiber",
  "fibre",
  "plant-based",
  "plant based",
  "recyclable",
  "sustainable"
];

const insightBadKeywords = [
  "saturated fat",
  "ultra-processed",
  "ultra processed",
  "high sugar",
  "added sugar",
  "additive",
  "additives",
  "preservative",
  "preservatives",
  "avoid",
  "limit",
  "limiting",
  "unhealthy",
  "high salt",
  "high sodium",
  "palm oil",
  "artificial",
  "high fat",
  "weak eco score"
];

function getInsightTone(insight: string) {
  const text = insight.toLowerCase();
  const positive = insightGoodKeywords.some((keyword) => text.includes(keyword));
  const negative = insightBadKeywords.some((keyword) => text.includes(keyword));
  const protectivePositive = [
    "no additives",
    "no additive",
    "no artificial",
    "no sugar",
    "no added sugar",
    "low sugar",
    "low salt",
    "low sodium",
    "simple ingredients",
    "minimally processed",
    "whole food"
  ].some((keyword) => text.includes(keyword));

  if (protectivePositive) return { icon: "✅", className: "border-emerald-200 bg-emerald-50 text-emerald-900" };
  if (negative) return { icon: "⚠️", className: "border-rose-200 bg-rose-50 text-rose-900" };
  if (positive) return { icon: "✅", className: "border-emerald-200 bg-emerald-50 text-emerald-900" };
  return { icon: "ℹ️", className: "border-soil-100 bg-white text-soil-800" };
}

export function getKeyInsights(product: ProductResult): ProductInsight[] {
  const productFatPercent = product.name.match(/(\d+(?:[.,]\d+)?)\s*%/)?.[1]?.replace(",", ".");
  const repeatsVisibleGrade = (text: string) => {
    const normalized = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    return normalized.includes("skaren") || normalized.includes("nutri-score") || normalized.includes("ecoscore");
  };
  const scoredInsights = product.aiSummary
    .map((insight, index) => {
      const rawText = (typeof insight === "string" ? insight : insight.text).replace(/^[-•]\s*/, "").trim();
      const text = productFatPercent && rawText.startsWith("% fat")
        ? `${productFatPercent}${rawText}`
        : rawText;
      const type = typeof insight === "string" ? null : insight.type;
      const lower = text.toLowerCase();
      const tone = getInsightTone(lower);
      const isBad = tone.className.includes("rose");
      const isGood = tone.className.includes("emerald");

      return {
        text,
        type: type ?? (isBad ? "warning" as const : isGood ? "positive" as const : "info" as const),
        priority: type === "warning" || isBad ? 0 : type === "positive" || isGood ? 1 : 2,
        index
      };
    })
    .filter((insight) => insight.text.length > 0 && !repeatsVisibleGrade(insight.text))
    .sort((a, b) => a.priority - b.priority || a.index - b.index);

  return scoredInsights.slice(0, 3).map((insight) => ({
    type: insight.type,
    text: insight.text
  }));
}
