import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEcoGrade, getNutritionGrade, gradeLetterToScore, hasEcoData } from "@/lib/ecoscore";
import { calculateHealthGrade, hasNokkelhullLabel, nutritionDataFromKassalapp } from "@/lib/healthscore";
import { fetchKassalappProduct, getVerifiedDisplayImage } from "@/lib/kassalapp";
import { generateAiSummary } from "@/lib/openai";
import {
  fetchOpenFoodFactsProduct,
  normalizeOpenFoodFactsProduct
} from "@/lib/openfoodfacts";
import { getCachedAiAnalysis, saveCachedAiAnalysis } from "@/lib/productCache";
import type { ProductResult } from "@/lib/types";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function saveScanToHistory(product: ProductResult, userId: string): Promise<boolean> {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return false;

    const environmentalGrade = hasEcoData(product) ? product.ecoGradeLetter ?? getEcoGrade(product) : null;
    const healthGrade = product.healthGrade ?? null;
    const additives = product.additives ?? [];
    const additivesToAvoid = additives.filter((a) => a.risk === "avoid").length;

    const payload = {
      user_id: userId,
      barcode: product.barcode,
      product_name: product.name,
      brand: product.brand === "Brand not listed" ? null : (product.brand ?? null),
      health_grade: healthGrade,
      environmental_grade: environmentalGrade,
      ecoscan_score: gradeLetterToScore(healthGrade ?? environmentalGrade ?? "C"),
      additives_total: additives.length,
      additives_to_avoid: additivesToAvoid,
    };

    const { error } = await admin.from("scans").insert(payload);
    if (error) {
      console.error("[Scan] DB save error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Scan] DB save exception:", err);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") ?? null;

    const body = (await request.json()) as { barcode?: string };
    const barcode = body.barcode?.trim();

    if (!barcode) {
      return NextResponse.json({ error: "Barcode is required." }, { status: 400 });
    }

    let kassalappProduct: Awaited<ReturnType<typeof fetchKassalappProduct>> = null;
    let openFoodFactsProduct: ReturnType<typeof normalizeOpenFoodFactsProduct> | null = null;

    try {
      kassalappProduct = await fetchKassalappProduct(barcode);
    } catch (error) {
      console.error("[Scan] Kassalapp error:", error);
    }

    try {
      const offProduct = await fetchOpenFoodFactsProduct(barcode);
      openFoodFactsProduct = normalizeOpenFoodFactsProduct(barcode, offProduct);
    } catch (error) {
      console.error("[Scan] OFF error:", error);
    }

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
        category: product.categories,
        novaGroup: product.novaGroup,
        additives: product.additives
      }),
      hasNokkelhull: hasNokkelhullLabel(product.labels)
    };
    const imageData = getVerifiedDisplayImage(productWithGrades);
    const cachedAi = await getCachedAiAnalysis(productWithGrades.barcode).catch((error) => {
      console.error("[Scan] AI cache error:", error);
      return null;
    });
    const aiSummary = cachedAi?.aiSummary ?? await generateAiSummary(productWithGrades).catch((error) => {
      console.error("[Scan] AI summary error:", error);
      return [];
    });

    if (!cachedAi && aiSummary.length > 0) {
      await saveCachedAiAnalysis({ barcode: productWithGrades.barcode, aiSummary }).catch((error) => {
        console.error("[Scan] AI cache save error:", error);
      });
    }

    // Save scan to history server-side — completely non-blocking, never fails the scan
    let savedToHistory = false;
    try {
      if (token) {
        const admin = getSupabaseAdmin();
        if (admin) {
          const { data: userData } = await admin.auth.getUser(token);
          if (userData.user) {
            savedToHistory = await saveScanToHistory(
              { ...productWithGrades, ...imageData, aiSummary } as ProductResult,
              userData.user.id
            );
          }
        }
      }
    } catch (saveErr) {
      console.error("[Scan] History save failed (non-fatal):", saveErr);
    }

    return NextResponse.json({
      savedToHistory,
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
