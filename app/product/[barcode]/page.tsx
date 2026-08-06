"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { getEcoGrade } from "@/lib/ecoscore";
import { useLang } from "@/lib/language-context";
import { cacheProductLocally, readLocalProduct } from "@/lib/localProducts";
import { supabase } from "@/lib/supabase";
import { usePremium } from "@/hooks/usePremium";
import {
  consumeSearchProductHistoryMarker,
  saveProductToHistory
} from "@/lib/productHistory";
import { recordScanAndMaybePromptReview } from "@/lib/appReview";
import {
  getKeyInsights,
  getNutritionRows,
  hasNutritionSignal,
  visibleIngredients,
  withProductDefaults
} from "@/lib/productDetails";
import type { ProductResult } from "@/lib/types";
import { NoDataScreen } from "@/components/NoDataScreen";
import { ProductPageLayout } from "@/components/ProductPageLayout";
import { Merk } from "@/components/Merk";

type ProductPageProps = {
  params: {
    barcode: string;
  };
};

type ProductError = {
  message: string;
  type: "not-found" | "retry";
};

export default function ProductPage({ params }: ProductPageProps) {
  const { lang } = useLang();
  const [product, setProduct] = useState<ProductResult | null>(null);
  const [error, setError] = useState<ProductError | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSlow, setLoadingSlow] = useState(false);
  const { isPremium } = usePremium();
  const historySaveBarcode = useRef<string | null>(null);
  const reviewCountedBarcode = useRef<string | null>(null);

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

      // Send the auth token so the server can generate premium-only AI insights
      // for Pro users and save this view to history.
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      try {
        if (supabase) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session?.access_token) {
            headers["Authorization"] = `Bearer ${sessionData.session.access_token}`;
          }
        }
      } catch {
        // No session available — proceed unauthenticated (free tier).
      }

      const response = await fetch("/api/scan", {
        method: "POST",
        headers,
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

  // A successfully loaded product is a positive moment — count it and, once the
  // user has seen a few, ask for a native App Store rating (throttled by Apple
  // and capped to once per app version). Fires once per barcode.
  useEffect(() => {
    if (!product || product.barcode !== params.barcode) return;
    if (reviewCountedBarcode.current === params.barcode) return;

    reviewCountedBarcode.current = params.barcode;
    void recordScanAndMaybePromptReview();
  }, [params.barcode, product]);

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
            className="flex min-h-screen flex-col"
            role="status"
            aria-live="polite"
            style={{ minHeight: "100dvh", background: "var(--sk-brand-mist)" }}
          >
            {/* Top bar — back arrow + a small barcode-pulse status label. */}
            <div
              className="sk-product-topbar sticky top-0 z-40 flex items-center justify-between px-4 pb-2"
              style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
            >
              <Link
                href="/scan"
                aria-label={lang === "no" ? "Tilbake til skanner" : "Back to scan"}
                className="grid h-10 w-10 place-items-center rounded-full"
                style={{ color: "var(--sk-text-green)" }}
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <span className="inline-flex items-center gap-2" style={{ color: "var(--sk-text-muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 1.5, height: 12 }} aria-hidden>
                  {[7, 5, 9, 5, 7].map((h, i) => (
                    <span key={i} style={{ width: 1.5, height: h, background: "var(--sk-brand-forest)", animation: "sk-barcode-pulse 1s ease-in-out infinite", animationDelay: `${i * 0.09}s` }} />
                  ))}
                </span>
                {loadingSlow
                  ? (lang === "no" ? "Laster…" : "Loading…")
                  : (lang === "no" ? "Analyserer" : "Analyzing")}
              </span>
              <div className="h-10 w-10" aria-hidden="true" />
            </div>

            {/* Merk reads the label while you wait — never a skeleton. */}
            <div className="flex flex-1 flex-col items-center justify-center px-8 pb-24 text-center">
              <Merk expression="scanning" size={184} limbs={false} aria-label="Merk" />
              <p
                className="mt-8"
                style={{ fontFamily: "var(--sk-font-brand)", fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--sk-text-primary)" }}
              >
                {loadingSlow
                  ? (lang === "no" ? "Dette tar litt tid…" : "This is taking a moment…")
                  : (lang === "no" ? "Leser etiketten" : "Reading the label")}
              </p>
              <p className="mt-2 max-w-[280px]" style={{ fontFamily: "var(--sk-font-ui)", fontSize: 14, lineHeight: 1.5, color: "var(--sk-text-muted)" }}>
                {lang === "no"
                  ? "Sjekker næring, ingredienser og karakterer."
                  : "Checking nutrition, ingredients, and grades."}
              </p>

              {loadingSlow ? (
                <button
                  type="button"
                  onClick={() => void loadProduct({ skipCache: true })}
                  className="focus-ring mt-7 inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-bold"
                  style={{ borderColor: "var(--sk-border-default)", background: "var(--sk-surface-white)", color: "var(--sk-brand-forest)" }}
                >
                  <RotateCcw className="h-4 w-4" />
                  {lang === "no" ? "Prøv igjen" : "Retry"}
                </button>
              ) : null}
            </div>

            <span className="sr-only">
              {lang === "no" ? "Analyserer produkt – sjekker næring, ingredienser og karakterer." : "Analyzing product – checking nutrition, ingredients, and grades."}
            </span>
          </div>
        ) : error && error.type === "not-found" ? (
          /* Not a failure state — a missing record, said plainly. */
          <NoDataScreen
            barcode={params.barcode}
            lang={lang}
            onRetry={() => void loadProduct({ skipCache: true })}
          />
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
