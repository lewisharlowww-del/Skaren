import { NextResponse } from "next/server";
import { getEcoGrade, getNutritionGrade, getProductSkarenScore } from "@/lib/ecoscore";
import { calculateHealthGrade, hasNokkelhullLabel, nutritionDataFromKassalapp } from "@/lib/healthscore";
import { fetchKassalappProduct, getVerifiedDisplayImage } from "@/lib/kassalapp";
import { generateAiSummary } from "@/lib/openai";
import {
  fetchOpenFoodFactsProduct,
  normalizeOpenFoodFactsProduct
} from "@/lib/openfoodfacts";
import { getCachedAiAnalysis, saveCachedAiAnalysis } from "@/lib/productCache";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { barcode?: string };
    const barcode = body.barcode?.trim();

    console.log("[Scan] Starting scan for barcode:", barcode);

    if (!barcode) {
      return NextResponse.json({ error: "Barcode is required." }, { status: 400 });
    }

    let kassalappProduct: Awaited<ReturnType<typeof fetchKassalappProduct>> = null;
    let openFoodFactsProduct: ReturnType<typeof normalizeOpenFoodFactsProduct> | null = null;

    try {
      kassalappProduct = await fetchKassalappProduct(barcode);
      console.log("[Scan] Kassalapp:", kassalappProduct?.name ?? "not found");
    } catch (error) {
      console.error("[Scan] Kassalapp error:", error);
    }

    try {
      const offProduct = await fetchOpenFoodFactsProduct(barcode);
      console.log("[Scan] OFF:", offProduct?.product_name ?? "not found");
      openFoodFactsProduct = normalizeOpenFoodFactsProduct(barcode, offProduct);
    } catch (error) {
      console.error("[Scan] OFF error:", error);
    }

    console.log("[Scan] Sources:", {
      hasKassalapp: Boolean(kassalappProduct),
      hasOpenFoodFacts: Boolean(openFoodFactsProduct)
    });

    if (!kassalappProduct && !openFoodFactsProduct) {
      return NextResponse.json({
        error: "PRODUCT_NOT_FOUND",
        code: "PRODUCT_NOT_FOUND",
        message: "We couldn't find this product. Try another barcode or check the number is correct."
      }, { status: 404 });
    }

    const ecoProduct = openFoodFactsProduct ?? normalizeOpenFoodFactsProduct(barcode, {});
    const product = {
      ...ecoProduct,
      barcode: kassalappProduct?.barcode ?? ecoProduct.barcode,
      name: kassalappProduct?.name ?? ecoProduct.name,
      brand: kassalappProduct?.brand ?? ecoProduct.brand,
      ingredients: kassalappProduct?.ingredients ?? ecoProduct.ingredients,
      image: kassalappProduct?.image ?? null,
      norwegianDataStatus: kassalappProduct ? "kassalapp" as const : "limited" as const,
      storePrices: kassalappProduct?.storePrices ?? [],
      currentPrice: kassalappProduct?.currentPrice ?? null,
      store: kassalappProduct?.store ?? null,
      allergens: kassalappProduct?.allergens ?? [],
      labels: kassalappProduct?.labels ?? [],
      kassalappCategories: kassalappProduct?.categories ?? [],
      kassalappNutrition: kassalappProduct?.nutrition ?? []
    };
    const productWithGrades = {
      ...product,
      ecoGradeLetter: getEcoGrade(product),
      nutritionGradeLetter: getNutritionGrade(product),
      healthGrade: calculateHealthGrade({
        nutrition: nutritionDataFromKassalapp(product.kassalappNutrition),
        labels: product.labels,
        category: product.categories
      }),
      hasNokkelhull: hasNokkelhullLabel(product.labels)
    };
    const imageData = getVerifiedDisplayImage(productWithGrades);
    const cachedAi = await getCachedAiAnalysis(productWithGrades.barcode).catch((error) => {
      console.error("[Scan] AI cache error:", error);
      return null;
    });
    const aiSummary = cachedAi?.aiSummary ?? await generateAiSummary(productWithGrades, getProductSkarenScore(productWithGrades)).catch((error) => {
      console.error("[Scan] AI summary error:", error);
      return [];
    });

    if (!cachedAi && aiSummary.length > 0) {
      await saveCachedAiAnalysis({ barcode: productWithGrades.barcode, aiSummary }).catch((error) => {
        console.error("[Scan] AI cache save error:", error);
      });
    }

    return NextResponse.json({
      product: {
        ...productWithGrades,
        ...imageData,
        aiSummary,
      }
    });
  } catch (error) {
    console.error("[Scan] Unhandled error:", error);
    return NextResponse.json({ error: "scan_failed", message: String(error) }, { status: 500 });
  }
}
