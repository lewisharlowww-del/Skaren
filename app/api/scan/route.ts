import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEcoGrade, getNutritionGrade, gradeLetterToScore, hasEcoData } from "@/lib/ecoscore";
import { calculateHealthGrade, hasNokkelhullLabel, nutritionDataFromKassalapp } from "@/lib/healthscore";
import { fetchKassalappProduct, getVerifiedDisplayImage } from "@/lib/kassalapp";
import { generateAiSummary, generateMerkVerdict } from "@/lib/openai";
import {
  fetchOpenFoodFactsProduct,
  normalizeOpenFoodFactsProduct
} from "@/lib/openfoodfacts";
import { getCachedAiAnalysis, saveCachedAiAnalysis } from "@/lib/productCache";
import { buildProductBrief } from "@/lib/merk/voice/brief";
import { generateMerkCopy } from "@/lib/merk/voice/generate";
import { coverageLine } from "@/lib/merk/voice/partition";
import { briefCacheKey } from "@/lib/merk/voice/cache";
import { MERK_VOICE_VERSION } from "@/lib/merk/voice/prompt";
import { scoreProduct } from "@/lib/merk/scoreProduct";
import skarenStatsJson from "@/lib/merk/categoryStats.json";
import type { CategoryStats } from "@/lib/merk/categoryScore";
import type { MerkCopy } from "@/lib/merk/voice/copy";
import type { MerkVerdict, ProductResult } from "@/lib/types";

// The shipped category distributions (13k+ Kassalapp products, ~49 buckets).
// Shared by the Skaren score and Merk's brief so both compare a product against
// the same shelf. The json is a superset of the brief's stat shape.
const SKAREN_CATEGORY_STATS = skarenStatsJson as unknown as CategoryStats;

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

    const additivesModerate = additives.filter((a) => a.risk === "moderate").length;
    const additiveDetails = additives.filter(
      (a) => a.risk === "avoid" || a.risk === "moderate"
    );

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
      additives_moderate: additivesModerate,
      additives_details: additiveDetails.length > 0 ? additiveDetails : null,
      product_image: product.displayImage ?? null,
    };

    const { error } = await admin.from("scans").insert(payload);
    if (error) {
      // If extended columns don't exist in schema, fall back to core fields only
      console.warn("[Scan] Full save failed, trying minimal payload:", error.message);
      const { error: minError } = await admin.from("scans").insert({
        user_id: payload.user_id,
        barcode: payload.barcode,
        product_name: payload.product_name,
        brand: payload.brand,
        health_grade: payload.health_grade,
        environmental_grade: payload.environmental_grade,
        ecoscan_score: payload.ecoscan_score,
        additives_total: payload.additives_total,
        additives_to_avoid: payload.additives_to_avoid,
      });
      if (minError) {
        console.error("[Scan] Minimal save also failed:", minError.message);
        return false;
      }
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

    const body = (await request.json()) as { barcode?: string; lang?: string };
    const barcode = body.barcode?.trim();
    const lang: "no" | "en" = body.lang === "no" ? "no" : "en";

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

    // ── Skaren Score — category-relative, "is this a good one of these?" ──
    // Scored against the shipped category stats; attach it to the product so the
    // result screen can show the number, its shelf median and the breakdown.
    // Limited-data buckets return null and the UI shows a short line instead.
    const scored = scoreProduct(productWithGrades as ProductResult);
    const skarenFields =
      scored.result.score !== null
        ? {
            skarenScore: scored.result.score,
            skarenBucket: scored.bucket,
            skarenShelfMedian: scored.result.shelfMedian,
            skarenSampleSize: scored.result.n,
            skarenBreakdown: scored.result.breakdown,
            // v2 — band, ceiling and rank so the card and sheet can be honest.
            skarenBand: scored.result.band,
            skarenCeiling: scored.result.ceiling,
            skarenCeilingApplied: scored.result.ceilingApplied,
            skarenRank: scored.result.rank,
            skarenMode: scored.result.mode,
            skarenVersion: scored.result.version,
          }
        : {
            skarenScore: null as number | null,
            skarenBucket: scored.bucket,
            skarenBreakdown: null,
            // v2 — an excluded bucket (spice, water…) is a deliberate no-score.
            skarenExcluded: scored.result.confidence === "limited" && scored.result.excluded === true,
            skarenVersion: scored.result.version,
          };
    Object.assign(productWithGrades, skarenFields);

    // Resolve the authenticated user + premium status once. Reused below for both
    // AI gating and history saving so we only hit Supabase a single time.
    let authedUserId: string | null = null;
    let isPremium = false;
    if (token) {
      try {
        const admin = getSupabaseAdmin();
        if (admin) {
          const { data: userData } = await admin.auth.getUser(token);
          if (userData.user) {
            authedUserId = userData.user.id;
            const { data: profile } = await admin
              .from("profiles")
              .select("is_premium")
              .eq("id", authedUserId)
              .single();
            isPremium = Boolean((profile as { is_premium?: boolean } | null)?.is_premium);
          }
        }
      } catch (authErr) {
        console.error("[Scan] Auth/premium resolve failed (non-fatal):", authErr);
      }
    }

    // AI insights are a premium feature. Serve the cache to everyone (it costs
    // nothing), but only spend an OpenAI call to *generate* fresh insights for
    // premium users. Free users get an empty array and see the upgrade nudge.
    const cachedAi = await getCachedAiAnalysis(productWithGrades.barcode).catch((error) => {
      console.error("[Scan] AI cache error:", error);
      return null;
    });

    let aiSummary = cachedAi?.aiSummary ?? [];
    // Merk's verdict is language-specific, so the cache holds one per language.
    // Serve a cached verdict in the requested language to everyone; only spend a
    // fresh OpenAI call for premium users when this language isn't cached yet.
    let merkVerdict: MerkVerdict | null = cachedAi?.merkVerdict?.[lang] ?? null;

    // ── Merk voice v1 — the four-slot copy ────────────────────────────────
    // Compute the brief (deterministic, no model) and its hash. Serve cached
    // copy only when it was written from THIS exact brief (so a rescore or a
    // reformulation invalidates it). Generate fresh for premium on a miss.
    const voiceLang: "en" | "nb" = lang === "no" ? "nb" : "en";
    // Feed the brief the SAME bucket + category stats the Skaren score used, so
    // Merk gets a real shelf to compare against (drivers, percentile, verdict
    // type) instead of falling to LIMITED_DATA on every product. Without this
    // the brief's own bucketer disagrees with the stats keys and categoryN is 0.
    const skarenPct =
      scored.result.score !== null && scored.result.breakdown
        ? scored.result.breakdown.nutrition
        : null;
    const brief = buildProductBrief(productWithGrades as ProductResult, {
      stats: SKAREN_CATEGORY_STATS,
      bucket: scored.bucket,
      score: productWithGrades.healthScore ?? scored.result.score ?? undefined,
      percentile: skarenPct,
    });
    const briefHash = briefCacheKey(brief, voiceLang);
    const cachedCopyEntry = cachedAi?.merkCopy?.[lang] ?? null;
    let merkCopy: MerkCopy | null =
      cachedCopyEntry && cachedCopyEntry.briefHash === briefHash ? cachedCopyEntry.copy : null;

    // §13 — the data-coverage line ("Fibre and eco not in the catalogue…").
    // Deterministic and model-free, so it is computed for everyone, not just
    // premium, and never contradicts what Merk (silently) omits.
    const merkCoverage = coverageLine(brief.dataGaps ?? [], voiceLang);

    const needsSummary = !cachedAi && isPremium;
    const needsVerdict = !merkVerdict && isPremium;
    const needsCopy = !merkCopy && isPremium;

    if (needsSummary || needsVerdict || needsCopy) {
      const [freshSummary, freshVerdict, freshCopy] = await Promise.all([
        needsSummary
          ? generateAiSummary(productWithGrades).catch((error) => {
              console.error("[Scan] AI summary error:", error);
              return [];
            })
          : Promise.resolve(aiSummary),
        needsVerdict
          ? generateMerkVerdict(productWithGrades, lang).catch((error) => {
              console.error("[Scan] Merk verdict error:", error);
              return null;
            })
          : Promise.resolve(merkVerdict),
        needsCopy
          ? generateMerkCopy(brief, voiceLang)
              .then((r) => r.copy)
              .catch((error) => {
                console.error("[Scan] Merk copy error:", error);
                return null;
              })
          : Promise.resolve(merkCopy),
      ]);

      aiSummary = freshSummary;
      if (freshVerdict) merkVerdict = freshVerdict;
      if (freshCopy) merkCopy = freshCopy;

      // Persist all three, merging the fresh per-language entries so we never
      // clobber the other language's cached copy.
      if (aiSummary.length > 0 || freshVerdict || freshCopy) {
        const verdictMap = {
          ...(cachedAi?.merkVerdict ?? {}),
          ...(freshVerdict ? { [lang]: freshVerdict } : {}),
        };
        const copyMap = {
          ...(cachedAi?.merkCopy ?? {}),
          ...(freshCopy ? { [lang]: { copy: freshCopy, briefHash, v: MERK_VOICE_VERSION } } : {}),
        };
        await saveCachedAiAnalysis({
          barcode: productWithGrades.barcode,
          aiSummary,
          merkVerdict: verdictMap,
          merkCopy: copyMap,
        }).catch((error) => {
          console.error("[Scan] AI cache save error:", error);
        });
      }
    }

    // Save scan to history server-side — completely non-blocking, never fails the scan
    let savedToHistory = false;
    try {
      if (authedUserId) {
        savedToHistory = await saveScanToHistory(
          { ...productWithGrades, ...imageData, aiSummary } as ProductResult,
          authedUserId
        );
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
        merkVerdict,
        merkCopy,
        merkCoverage,
      }
    });
  } catch (error) {
    console.error("[Scan] Unhandled error:", error);
    return NextResponse.json({ error: "scan_failed", message: String(error) }, { status: 500 });
  }
}
