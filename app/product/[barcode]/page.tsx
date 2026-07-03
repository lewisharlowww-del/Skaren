"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { getEcoGrade, getNutritionGrade } from "@/lib/ecoscore";
import { calculateHealthGrade, hasNokkelhullLabel, nutritionDataFromKassalapp } from "@/lib/healthscore";
import { t, type Language } from "@/lib/i18n";
import { useLang } from "@/lib/language-context";
import { cacheProductLocally, readLocalProduct } from "@/lib/localProducts";
import { supabase } from "@/lib/supabase";
import { getUserPremiumStatus } from "@/lib/premium";
import {
  consumeSearchProductHistoryMarker,
  saveProductToHistory
} from "@/lib/productHistory";
import type { GradeLetter, ProductInsight, ProductResult } from "@/lib/types";
import { ProductPageLayout } from "@/components/ProductPageLayout";

type ProductPageProps = {
  params: {
    barcode: string;
  };
};

type ProductError = {
  message: string;
  type: "not-found" | "retry";
};

function withProductDefaults(product: ProductResult): ProductResult {
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

function hasNutritionSignal(product: ProductResult) {
  const nutri = product.nutriGrade.toLowerCase();
  // Only claim a health grade when we have a real basis for it: an official
  // Nutri-Score, actual Kassalapp nutrition values, or the Norwegian Nøkkelhull
  // healthy-choice label. Being a Kassalapp product on its own is NOT enough -
  // that used to show a confident "C" built purely from the neutral base score.
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

function findNutritionForRow(product: ProductResult, matches: string[], excludes: string[] = [], preferredUnits: string[] = []) {
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

function getNutritionRows(product: ProductResult, lang: Language = "en") {
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
    .filter((row): row is { label: string; matchKey: string; amount: number; displayAmount: string; tone: string } => Boolean(row));
}

function visibleIngredients(product: ProductResult) {
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

function getKeyInsights(product: ProductResult): ProductInsight[] {
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

export default function ProductPage({ params }: ProductPageProps) {
  const { lang } = useLang();
  const [product, setProduct] = useState<ProductResult | null>(null);
  const [error, setError] = useState<ProductError | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSlow, setLoadingSlow] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const historySaveBarcode = useRef<string | null>(null);

  async function loadProduct(options: { skipCache?: boolean } = {}) {
    setLoading(true);
    setLoadingSlow(false);
    setError(null);

    try {
      if (options.skipCache) {
        sessionStorage.removeItem(`skaren-error:${params.barcode}`);
      }

      const cachedError = sessionStorage.getItem(`skaren-error:${params.barcode}`);
      if (cachedError && !options.skipCache) {
        setProduct(null);
        setError(JSON.parse(cachedError) as ProductError);
        setLoading(false);
        return;
      }

      const cached =
        sessionStorage.getItem(`skaren:${params.barcode}`) ??
        sessionStorage.getItem(`skaren:v2:${params.barcode}`);
      if (cached && !options.skipCache) {
        const cachedProduct = withProductDefaults(JSON.parse(cached) as ProductResult);
        setProduct(cachedProduct);
        setLoading(false);
        return;
      }

      const localProduct = readLocalProduct(params.barcode);
      if (localProduct && !options.skipCache) {
        setProduct(withProductDefaults(localProduct));
        setLoading(false);
        return;
      }

      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode: params.barcode })
      });
      const data = (await response.json()) as { product?: ProductResult; error?: string; code?: string };

      if (!response.ok || !data.product) {
        setProduct(null);
        setError({
          message:
            data.code === "PRODUCT_NOT_FOUND"
              ? "We couldn't find this product. Try another barcode or check the number is correct."
              : "Something went wrong. Please try again.",
          type: data.code === "PRODUCT_NOT_FOUND" ? "not-found" : "retry"
        });
        return;
      }

      const productWithDefaults = withProductDefaults(data.product);
      sessionStorage.setItem(`skaren:${productWithDefaults.barcode}`, JSON.stringify(productWithDefaults));
      cacheProductLocally(productWithDefaults);
      setProduct(productWithDefaults);
    } catch {
      const localProduct = readLocalProduct(params.barcode);
      if (localProduct) {
        setProduct(withProductDefaults(localProduct));
        setError(null);
      } else {
        setProduct(null);
        setError({ message: "Something went wrong. Please try again.", type: "retry" });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const shouldSkipCache = new URLSearchParams(window.location.search).has("fresh");
    loadProduct({ skipCache: shouldSkipCache });
    // loadProduct intentionally depends only on the route barcode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.barcode]);

  useEffect(() => {
    if (!loading) {
      setLoadingSlow(false);
      return;
    }
    const timer = window.setTimeout(() => setLoadingSlow(true), 3500);
    return () => window.clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (!product || product.barcode !== params.barcode) return;
    if (historySaveBarcode.current === params.barcode) return;
    if (!consumeSearchProductHistoryMarker(params.barcode)) return;

    historySaveBarcode.current = params.barcode;
    void saveProductToHistory(product);
  }, [params.barcode, product]);

  useEffect(() => {
    let active = true;

    async function loadPremiumStatus() {
      const premium = supabase ? await getUserPremiumStatus(supabase) : false;
      if (active) setIsPremium(premium);
    }

    loadPremiumStatus();

    const listener = supabase?.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setIsPremium(false);
        return;
      }
      if (supabase) {
        void getUserPremiumStatus(supabase).then((premium) => setIsPremium(premium));
      }
    });

    return () => {
      active = false;
      listener?.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!product || product.displayImage || !product.barcode) return;

    let isMounted = true;

    async function rescueKassalappImage() {
      try {
        const response = await fetch("/api/kassalapp-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barcode: product?.barcode })
        });
        const data = (await response.json()) as { image?: string | null };

        if (!isMounted || !data.image) return;

        setProduct((current) => {
          if (!current || current.barcode !== product?.barcode) return current;

          const updated = withProductDefaults({
            ...current,
            image: data.image ?? current.image,
            displayImage: data.image ?? current.displayImage,
            displayImageSource: "kassalapp"
          });
          sessionStorage.setItem(`skaren:${updated.barcode}`, JSON.stringify(updated));
          cacheProductLocally(updated);

          return updated;
        });
      } catch {
        // The green placeholder remains the designed fallback if Kassalapp has no official image.
      }
    }

    void rescueKassalappImage();

    return () => {
      isMounted = false;
    };
  }, [product]);

  return (
    <>
      <main className="w-full">
        {loading ? (
          <div
            className="min-h-screen"
            role="status"
            aria-live="polite"
            style={{ minHeight: "100dvh", background: "var(--sk-brand-mist)" }}
          >
            <style>{`
              @keyframes sk-sweep { 0%{transform:translateX(-130%)} 100%{transform:translateX(130%)} }
              @keyframes sk-ringpulse { 0%,100%{transform:scale(0.85);opacity:0.7} 50%{transform:scale(1.1);opacity:0.28} }
              .sk2 { position:relative; overflow:hidden; background:#ece6dc; border-radius:8px; }
              .sk2::after {
                content:""; position:absolute; inset:0; transform:translateX(-130%);
                background:linear-gradient(90deg,transparent,rgba(255,255,255,0.85),transparent);
                animation:sk-sweep 1.6s ease-in-out infinite;
              }
              .sk2-d1::after{animation-delay:0s}
              .sk2-d2::after{animation-delay:.12s}
              .sk2-d3::after{animation-delay:.24s}
              @media (prefers-reduced-motion: reduce) {
                .sk2::after, .sk-ring-el { animation: none !important; }
              }
            `}</style>

            {/* Top bar — matches the real report (back arrow + status pill) */}
            <div
              className="sticky top-0 z-40 flex items-center justify-between px-4 pb-2"
              style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))", background: "rgba(250,247,242,0.94)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
            >
              <Link
                href="/scan"
                aria-label={lang === "no" ? "Tilbake til skanner" : "Back to scan"}
                className="grid h-10 w-10 place-items-center rounded-full"
                style={{ color: "var(--sk-text-green)" }}
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <span className="inline-flex items-center gap-1.5" style={{ color: "var(--sk-text-muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                <span className="relative grid h-[14px] w-[14px] place-items-center">
                  <span className="sk-ring-el absolute inset-0 rounded-full border-[1.5px]" style={{ borderColor: "var(--sk-brand-leaf)", animation: "sk-ringpulse 2s ease-in-out infinite" }} />
                  <span className="h-[4px] w-[4px] rounded-full" style={{ background: "var(--sk-brand-forest)" }} />
                </span>
                {loadingSlow
                  ? (lang === "no" ? "Laster…" : "Loading…")
                  : (lang === "no" ? "Analyserer" : "Analyzing")}
              </span>
              <div className="h-10 w-10" aria-hidden="true" />
            </div>

            {/* Hero card — circular image + name/brand/status, cream bg, green left border */}
            <div
              className="relative mx-4 mt-2 overflow-hidden rounded-2xl"
              style={{ background: "var(--sk-brand-mist-card)", border: "0.5px solid var(--sk-border-default)", borderLeftWidth: 4, borderLeftColor: "var(--sk-brand-leaf)" }}
            >
              <div className="flex items-center gap-3.5" style={{ padding: "18px 18px 18px 14px" }}>
                <div className="sk2 sk2-d1 shrink-0 rounded-full" style={{ width: 80, height: 80, background: "#e6efe6" }} />
                <div className="min-w-0 flex-1">
                  <div className="sk2 sk2-d1 h-3.5 w-4/5 rounded-full" />
                  <div className="sk2 sk2-d2 mt-2 h-2.5 w-2/5 rounded-full" />
                  <div className="sk2 sk2-d3 mt-2.5 h-5 w-1/2 rounded-full" />
                </div>
              </div>
            </div>

            {/* Grades — section label + two side-by-side grade circles */}
            <section className="mx-4 mt-3">
              <div className="sk2 sk2-d1 mb-2 ml-0.5 h-2.5 w-16 rounded-full" />
              <div className="overflow-hidden rounded-2xl" style={{ background: "var(--sk-surface-white)", border: "0.5px solid var(--sk-border-default)" }}>
                <div className="grid grid-cols-2">
                  <div className="flex flex-col items-center gap-2 px-4 py-4">
                    <div className="sk2 sk2-d1 rounded-full" style={{ width: 72, height: 72 }} />
                    <div className="sk2 sk2-d1 h-2.5 w-12 rounded-full" />
                    <div className="sk2 sk2-d1 h-2 w-16 rounded-full" />
                  </div>
                  <div className="flex flex-col items-center gap-2 px-4 py-4" style={{ borderLeft: "0.5px solid var(--sk-border-default)" }}>
                    <div className="sk2 sk2-d2 rounded-full" style={{ width: 72, height: 72 }} />
                    <div className="sk2 sk2-d2 h-2.5 w-12 rounded-full" />
                    <div className="sk2 sk2-d2 h-2 w-16 rounded-full" />
                  </div>
                </div>
              </div>
            </section>

            {/* Two section cards below (processing / nutrition placeholders) */}
            <div className="px-4 pb-10 pt-1">
              {[0, 1].map((block) => (
                <div key={block} className="mb-4 flex flex-col gap-2.5">
                  <div className="sk2 sk2-d1 ml-0.5 h-2.5 w-24 rounded-full" />
                  <div className="rounded-2xl" style={{ background: "var(--sk-surface-white)", border: "0.5px solid var(--sk-border-default)", padding: 16 }}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="sk2 sk2-d1 h-3.5 w-2/5 rounded-full" />
                        <div className="sk2 sk2-d2 mt-2 h-2.5 w-3/5 rounded-full" />
                      </div>
                      <div className="sk2 sk2-d2 h-12 w-14 rounded-xl" />
                    </div>
                    <div className="mt-3 flex items-center gap-1.5">
                      {[0, 1, 2, 3].map((seg) => (
                        <div key={seg} className="sk2 sk2-d3 h-2 flex-1 rounded" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {loadingSlow ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl px-5 py-5 text-center" style={{ background: "var(--sk-surface-white)", border: "0.5px solid var(--sk-border-default)" }}>
                  <p className="type-body-sm font-bold text-[var(--sk-text-primary)]">
                    {lang === "no" ? "Dette tar lengre enn vanlig" : "This is taking longer than usual"}
                  </p>
                  <p className="type-body-sm max-w-xs text-[var(--sk-text-muted)]">
                    {lang === "no" ? "Du kan prøve igjen eller gå tilbake." : "You can retry or return to the scanner."}
                  </p>
                  <button
                    type="button"
                    onClick={() => void loadProduct({ skipCache: true })}
                    className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--sk-border-default)] bg-white px-5 text-sm font-bold text-[var(--sk-brand-forest)]"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {lang === "no" ? "Prøv igjen" : "Retry"}
                  </button>
                </div>
              ) : null}
            </div>

            <span className="sr-only">
              {lang === "no" ? "Analyserer produkt – sjekker næring, ingredienser og karakterer." : "Analyzing product – checking nutrition, ingredients, and grades."}
            </span>
          </div>
        ) : error ? (
          <div className="mx-auto mt-8 max-w-xl rounded-[2rem] border border-black/5 bg-white p-6 text-center shadow-soft sm:mt-10 sm:p-8">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-rose-600">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-3xl font-black text-ink">{error.type === "not-found" ? "Product not found" : "Scan failed"}</h1>
            <p className="mt-3 leading-7 text-soil-600">{error.message}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {error.type === "retry" ? (
                <button
                  onClick={() => void loadProduct({ skipCache: true })}
                className="focus-ring tap-feedback inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 font-bold text-white shadow-soft"
                >
                  <RotateCcw className="h-5 w-5" />
                  Retry
                </button>
              ) : null}
              <Link
                href="/scan"
                className="focus-ring tap-feedback inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 font-bold text-ink"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to scan
              </Link>
            </div>
          </div>
        ) : product ? (
          <ProductPageLayout
            product={product}
            getKeyInsights={getKeyInsights}
            getNutritionRows={(p) => getNutritionRows(p, lang)}
            visibleIngredients={visibleIngredients}
            hasNutritionSignal={hasNutritionSignal}
            getEcoGrade={getEcoGrade}
            isPremium={isPremium}
          />
        ) : null}
      </main>
    </>
  );
}
