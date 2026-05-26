import type { ProductResult } from "@/lib/types";

export type SwapSuggestion = {
  name: string;
  reason: string;
  estimatedScore: number;
};

export function generateSwaps(product: Pick<ProductResult, "categories">, score = 50): SwapSuggestion[] {
  const category = product.categories?.toLowerCase() ?? "";

  if (category.includes("drink") || category.includes("beverage")) {
    return [
      { name: "Local refill drink", reason: "Reusable bottles can reduce packaging waste.", estimatedScore: Math.max(score + 18, 76) },
      { name: "Glass bottle option", reason: "Often easier to recycle where local systems support it.", estimatedScore: Math.max(score + 14, 72) },
      { name: "Concentrated format", reason: "Less shipped weight and less packaging per serving.", estimatedScore: Math.max(score + 20, 80) }
    ];
  }

  if (category.includes("snack") || category.includes("sweet") || category.includes("chocolate")) {
    return [
      { name: "Bulk-bin snack", reason: "Can avoid single-use wrappers.", estimatedScore: Math.max(score + 17, 74) },
      { name: "Organic oat snack", reason: "Often uses simpler ingredients and lighter packaging.", estimatedScore: Math.max(score + 12, 70) },
      { name: "Locally made treat", reason: "Shorter supply chains can improve the estimate.", estimatedScore: Math.max(score + 15, 72) }
    ];
  }

  return [
    { name: "Lower-packaging alternative", reason: "Look for minimal or recyclable packaging.", estimatedScore: Math.max(score + 16, 74) },
    { name: "Local brand option", reason: "Shorter transport distance can improve the footprint estimate.", estimatedScore: Math.max(score + 12, 70) },
    { name: "Certified sustainable swap", reason: "Credible environmental labels can signal better practices.", estimatedScore: Math.max(score + 20, 80) }
  ];
}
