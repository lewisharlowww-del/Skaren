import { NextResponse } from "next/server";
import { findAlternative, shelfMedian } from "@/lib/merk/findAlternative";
import { nutritionDataFromKassalapp, calculateHealthScore } from "@/lib/healthscore";
import type { ProductResult } from "@/lib/types";

/**
 * Alternatives + shelf median.
 *
 * Both answers come from ONE cached category search inside lib/merk, which is
 * what keeps this inside the catalogue's 60 req/min budget. Results are never
 * sponsored and never ranked by price — the trade-offs are printed instead.
 */
export const runtime = "nodejs";

export async function POST(request: Request) {
  let product: ProductResult;
  try {
    ({ product } = (await request.json()) as { product: ProductResult });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (!product?.barcode) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const nutritionData = nutritionDataFromKassalapp(product.kassalappNutrition ?? []);
  const healthScore =
    product.healthScore ??
    calculateHealthScore({
      nutrition: nutritionData,
      labels: product.labels ?? [],
      category: product.categories,
      novaGroup: product.novaGroup,
      additives: product.additives ?? []
    });

  // A failure here must never break the result page: the section simply does
  // not appear, which is honest — we could not check the shelf.
  const [alternatives, median] = await Promise.all([
    findAlternative({ ...product, nutritionData, healthScore }).catch(() => []),
    shelfMedian(product).catch(() => null)
  ]);

  return NextResponse.json({
    alternatives,
    shelfMedian: median?.median ?? null,
    shelfSampleSize: median?.sampleSize ?? null
  });
}
