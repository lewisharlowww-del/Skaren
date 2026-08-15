import { NextResponse } from "next/server";
import { findAlternative, shelfMedian } from "@/lib/merk/findAlternative";
import { nutritionDataFromKassalapp, calculateHealthScore } from "@/lib/healthscore";
import type { ProductResult } from "@/lib/types";

/**
 * Alternatives + shelf median.
 *
 * The one rule this route exists to enforce: FAILURE AND EMPTY ARE DIFFERENT
 * ANSWERS. v1 caught every error into [], so a missing API key, a 429 and a
 * genuinely clean shelf all rendered as "nothing found" — which is how the
 * feature looked dead while working exactly as written.
 *
 * Now: `ok` says whether we managed to check, `results` says what we found.
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

  const lang = (new URL(request.url).searchParams.get("lang") === "en" ? "en" : "no") as "no" | "en";

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

  const [searchOutcome, medianOutcome] = await Promise.allSettled([
    findAlternative({ ...product, nutritionData, healthScore }, { lang }),
    shelfMedian(product)
  ]);

  if (searchOutcome.status === "rejected") {
    // Log the real cause — this is the line that would have saved v1.
    console.error("[alternatives] search failed", {
      barcode: product.barcode,
      name: product.name,
      error: searchOutcome.reason instanceof Error ? searchOutcome.reason.message : searchOutcome.reason
    });
    return NextResponse.json(
      { ok: false, reason: "search_failed", results: [], consideredCount: 0 },
      { status: 200 } // a soft failure: the page still renders, the section says so
    );
  }

  const search = searchOutcome.value;
  const median = medianOutcome.status === "fulfilled" ? medianOutcome.value : null;

  // Observability: without this you cannot tell a broken bucket map from a
  // genuinely clean shelf. Watch `considered === 0` — that means the shelf
  // match failed, not that the shelf is clean.
  console.info("[alternatives]", {
    barcode: product.barcode,
    bucket: search.bucket,
    considered: search.consideredCount,
    graded: search.gradedCount,
    found: search.results.length
  });

  return NextResponse.json({
    ok: true,
    results: search.results,
    consideredCount: search.consideredCount,
    gradedCount: search.gradedCount,
    bucket: search.bucket,
    shelfLabel: lang === "en" ? search.shelfLabelEn : search.shelfLabelNo,
    shelfMedian: median?.median ?? null,
    shelfSampleSize: median?.sampleSize ?? null
  });
}
