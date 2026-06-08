import type { ProductResult } from "@/lib/types";

const productPrefix = "skaren:product:";
const recentKey = "skaren:recent-products";
const maxRecentProducts = 100;

type CachedProduct = {
  product: ProductResult;
  savedAt: number;
};

export type LocalProductSummary = {
  barcode: string;
  name: string;
  brand: string;
  image: string | null;
  healthGrade: string;
  savedAt: number;
};

function canUseStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

function readRecentSummaries(): LocalProductSummary[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(recentKey);
    return raw ? (JSON.parse(raw) as LocalProductSummary[]) : [];
  } catch {
    return [];
  }
}

export function cacheProductLocally(product: ProductResult) {
  if (!canUseStorage()) return;

  const savedAt = Date.now();
  const summary: LocalProductSummary = {
    barcode: product.barcode,
    name: product.name,
    brand: product.brand,
    image: product.displayImage ?? product.image ?? null,
    healthGrade: product.healthGrade ?? "C",
    savedAt
  };

  try {
    window.localStorage.setItem(`${productPrefix}${product.barcode}`, JSON.stringify({ product, savedAt } satisfies CachedProduct));
    const recent = readRecentSummaries()
      .filter((item) => item.barcode !== product.barcode)
      .concat(summary)
      .sort((a, b) => b.savedAt - a.savedAt)
      .slice(0, maxRecentProducts);

    window.localStorage.setItem(recentKey, JSON.stringify(recent));
  } catch {
    // Local storage can be full or disabled. Network and Supabase storage still work.
  }
}

export function readLocalProduct(barcode: string) {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(`${productPrefix}${barcode}`);
    if (!raw) return null;
    return (JSON.parse(raw) as CachedProduct).product;
  } catch {
    return null;
  }
}

export function readRecentLocalProducts() {
  return readRecentSummaries();
}
