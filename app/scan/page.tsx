"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Crown, ScanBarcode, Search } from "lucide-react";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { BottomNav } from "@/components/BottomNav";
import { Spinner } from "@/components/Spinner";
import { useUser } from "@/hooks/useUser";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/language-context";
import { PhoneFrame } from "@/components/PhoneFrame";
import { vibrate } from "@/lib/haptics";
import { cacheProductLocally } from "@/lib/localProducts";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getUserPremiumStatus } from "@/lib/premium";
import type { ProductResult } from "@/lib/types";

const loadingMessages = ["Reading barcode...", "Checking ingredients...", "Checking product grades...", "Analyzing nutrition..."];


function ScanLoadingOverlay({ barcode, scanSuccess, saved }: { barcode: string; scanSuccess: boolean; saved: boolean }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex((index) => (index + 1) % loadingMessages.length);
    }, 1050);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-[var(--sk-brand-mist)] px-5 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.section
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 170, damping: 24 }}
        className="w-full max-w-sm rounded-[2rem] border border-[var(--sk-border-default)] bg-white p-6 text-center shadow-[0_24px_70px_rgba(45,74,38,0.14)]"
      >
        <div className={`mx-auto grid h-24 w-24 place-items-center rounded-full ${scanSuccess ? "bg-leaf-100 text-forest" : "bg-forest text-cream"} shadow-phone scan-glow`}>
          <AnimatePresence mode="wait">
            {scanSuccess ? (
              <motion.span
                key="found"
                initial={{ opacity: 0, scale: 0.82 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 360, damping: 24 }}
              >
                <CheckCircle2 className="h-12 w-12" />
              </motion.span>
            ) : (
              <motion.span key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ScanBarcode className="h-12 w-12" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <p className="type-section-label mt-5 text-forest">{scanSuccess ? "Found product" : "Skaren scan"}</p>
        <h2 className="type-heading-2 mt-2 text-ink">
          {scanSuccess ? "Opening product report" : loadingMessages[messageIndex]}
        </h2>
        <p className="type-body-sm mt-2 text-soil-600">
          Barcode {barcode || "detected"} is being turned into a clean product report.
        </p>

        <div className="mt-6 overflow-hidden rounded-full bg-leaf-50">
          <div className="scan-progress-line h-2 rounded-full bg-forest" />
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-black/5 bg-soil-50 p-4 text-left">
          <div className="skeleton-shimmer h-4 w-2/3 rounded-full bg-white" />
          <div className="skeleton-shimmer mt-3 h-4 w-full rounded-full bg-white" />
          <div className="skeleton-shimmer mt-3 h-4 w-4/5 rounded-full bg-white" />
        </div>

        <AnimatePresence>
          {saved ? (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="motion-scan-success type-body-sm mt-4 inline-flex items-center gap-2 rounded-full bg-leaf-100 px-4 py-2 font-bold text-forest"
            >
              <CheckCircle2 className="h-4 w-4" />
              Saved to history
            </motion.p>
          ) : null}
        </AnimatePresence>
      </motion.section>
    </motion.div>
  );
}

export default function ScanPage() {
  const router = useRouter();
  const { lang } = useLang();
  const { user, loading: userLoading } = useUser();
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [savedToHistory, setSavedToHistory] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const premium = supabase ? await getUserPremiumStatus(supabase) : false;
      if (active) setIsPremium(premium);
    }

    loadSession();
    const listener = supabase?.auth.onAuthStateChange((_event, session) => {
      if (session?.user && supabase) {
        void getUserPremiumStatus(supabase).then((premium) => setIsPremium(premium));
      } else {
        setIsPremium(false);
      }
    });

    return () => {
      active = false;
      listener?.data.subscription.unsubscribe();
    };
  }, []);

  async function analyzeBarcode(nextBarcode: string) {
    const cleanBarcode = nextBarcode.trim();
    if (!cleanBarcode) {
      setError(t('scan_error_empty', lang));
      return;
    }

    const isSignedIn = Boolean(user);

    setLoading(true);
    setScanSuccess(false);
    setSavedToHistory(false);
    setError("");
    setBarcode(cleanBarcode);
    vibrate(12);
    let keepLoadingForNavigation = false;

    try {
      // Pass auth token so the server can save to history directly
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (isSupabaseConfigured && supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.access_token) {
          headers["Authorization"] = `Bearer ${sessionData.session.access_token}`;
        }
      }

      const response = await fetch("/api/scan", {
        method: "POST",
        headers,
        body: JSON.stringify({ barcode: cleanBarcode })
      });
      const data = (await response.json()) as { product?: ProductResult; savedToHistory?: boolean; error?: string };

      if (!response.ok || !data.product) {
        sessionStorage.setItem(
          `skaren-error:${cleanBarcode}`,
          JSON.stringify({
            message: response.status === 404 ? t('scan_error_not_found', lang) : t('scan_error_generic', lang),
            type: response.status === 404 ? "not-found" : "retry"
          })
        );
        router.push(`/product/${cleanBarcode}`);
        return;
      }

      const product = data.product;
      sessionStorage.setItem(`skaren:${product.barcode}`, JSON.stringify(product));
      cacheProductLocally(product);

      if (data.savedToHistory) {
        setSavedToHistory(true);
        vibrate([12, 24, 18]);
      }

      setScanSuccess(true);
      keepLoadingForNavigation = true;
      vibrate([18, 30, 35]);
      window.setTimeout(() => router.push(`/product/${product.barcode}`), 720);
    } catch {
      sessionStorage.setItem(
        `skaren-error:${cleanBarcode}`,
        JSON.stringify({
          message: t('scan_error_generic', lang),
          type: "retry"
        })
      );
      router.push(`/product/${cleanBarcode}`);
    } finally {
      if (!keepLoadingForNavigation) setLoading(false);
    }
  }

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await analyzeBarcode(barcode);
  }

  return (
    <>
      <BottomNav />
      <AnimatePresence>
        {loading ? <ScanLoadingOverlay barcode={barcode} scanSuccess={scanSuccess} saved={savedToHistory} /> : null}
      </AnimatePresence>
      <div className="flex h-screen flex-col bg-[#f7f2ea]">
        {/* Scanner panel */}
        <div
          className="relative overflow-hidden"
          style={{
            height: "min(56vh, 34rem)",
            minHeight: 300,
            background: "var(--sk-brand-forest)",
          }}
        >
          {/* Real camera feed fills the full area */}
          <div className="absolute inset-0">
            <BarcodeScanner
              autoStart
              hideControls
              disabled={loading}
              onDetected={(detectedBarcode) => void analyzeBarcode(detectedBarcode)}
            />
          </div>

          {/* Decorative overlay: dark vignette + corner brackets + text */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            {/* Vignette */}
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(82,115,75,0.08) 18%, rgba(25,38,23,0.82) 100%)" }} />

            {/* Corner brackets */}
            <div className="relative z-10" style={{ width: 240, height: 180 }}>
              <div className="absolute left-0 top-0 h-9 w-9 rounded-tl-xl" style={{ borderTop: "3px solid rgba(255,255,255,.9)", borderLeft: "3px solid rgba(255,255,255,.9)" }} />
              <div className="absolute right-0 top-0 h-9 w-9 rounded-tr-xl" style={{ borderTop: "3px solid rgba(255,255,255,.9)", borderRight: "3px solid rgba(255,255,255,.9)" }} />
              <div className="absolute bottom-0 left-0 h-9 w-9 rounded-bl-xl" style={{ borderBottom: "3px solid rgba(255,255,255,.9)", borderLeft: "3px solid rgba(255,255,255,.9)" }} />
              <div className="absolute bottom-0 right-0 h-9 w-9 rounded-br-xl" style={{ borderBottom: "3px solid rgba(255,255,255,.9)", borderRight: "3px solid rgba(255,255,255,.9)" }} />
              {/* Animated scan line */}
              <div className="absolute left-3 right-3" style={{ top: "50%", height: 2, background: "#88bb88", boxShadow: "0 0 10px rgba(136,187,136,0.9)" }} />
            </div>

            {/* Text below brackets */}
            <div className="relative z-10 mt-4 flex flex-col items-center gap-1">
              <p className="text-[18px] font-black text-white" style={{ fontFamily: "Satoshi, sans-serif" }}>
                {t('scan_title', lang)}
              </p>
              <p className="text-[12px]" style={{ color: "rgba(220,238,221,.72)" }}>
                {t('scan_subtitle', lang)}
              </p>
            </div>
          </div>
        </div>
        {/* Bottom section */}
        <div className="flex-1 overflow-hidden px-5 pb-24 pt-4">
          {/* Divider */}
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#e0d8cc]" />
            <span className="type-section-label text-[#9a8e7e]">{t('scan_enter_manually', lang)}</span>
            <div className="h-px flex-1 bg-[#e0d8cc]" />
          </div>
          <form onSubmit={handleAnalyze} className="space-y-2">
            <input
              className="w-full rounded-2xl border border-[#e0d8cc] bg-white px-4 py-3 text-center text-lg font-bold text-[#2d4a26] placeholder:font-normal placeholder:text-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#2d4a26]/20"
              inputMode="numeric"
              placeholder="3017620422003"
              value={barcode}
              onChange={(event) => setBarcode(event.target.value)}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2d4a26] py-3 text-[15px] font-black text-[#dceedd] disabled:opacity-60"
            >
              <AnimatePresence mode="wait" initial={false}>
                {scanSuccess ? (
                  <motion.span key="success" initial={{ opacity: 0, scale: 0.86 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 360, damping: 24 }}>
                    <CheckCircle2 className="h-5 w-5" />
                  </motion.span>
                ) : loading ? (
                  <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Spinner size={20} />
                  </motion.span>
                ) : (
                  <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ScanBarcode className="h-5 w-5" />
                  </motion.span>
                )}
              </AnimatePresence>
              {scanSuccess ? t('scan_product_found', lang) : loading ? t('loading', lang) : t('scan_analyze', lang)}
            </button>
            {error ? (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div>
            ) : null}
          </form>
          {/* Search products row — premium feature */}
          <div className="mt-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#e0d8cc]" />
            <span className="type-section-label text-[#9a8e7e]">{t('scan_or_explore', lang)}</span>
            <div className="h-px flex-1 bg-[#e0d8cc]" />
          </div>
          <Link
            href={isPremium ? "/search" : "/pricing"}
            className="mt-2 flex items-center gap-4 rounded-2xl bg-white border border-[#e0d8cc] px-5 py-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#eaf3de] flex items-center justify-center flex-shrink-0">
              <Search className="h-5 w-5 text-[#2d4a26]" />
            </div>
            <div className="flex-1">
              <p className="flex items-center gap-1.5 text-[14px] font-bold text-[#2d4a26]">
                {t('scan_search_products', lang)}
                {!isPremium ? (
                  <Crown
                    className="h-4 w-4 text-[#8a7a30]"
                    strokeWidth={2}
                    aria-label={t('pro_feature', lang)}
                  />
                ) : null}
              </p>
              <p className="text-[12px] text-[#9a8e7e]">{isPremium ? t('scan_find_without_scanning', lang) : t('pro_feature', lang)}</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b0a090" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </Link>
          {/* Status */}
          <div className="mt-3 flex justify-center">
            {userLoading ? (
              <span className="h-8 w-36 animate-pulse rounded-full bg-[#eaf3de]" aria-label="Checking account" />
            ) : user ? (
              <span className="rounded-full bg-[#eaf3de] px-4 py-2 text-[12px] font-bold text-[#2d4a26]">
                {t('scan_signed_in', lang)}
              </span>
            ) : (
              <p className="text-center text-[12px] text-[#9a8e7e]">
                <Link href="/login?next=%2Fscan" className="font-bold text-[#2d4a26] underline underline-offset-2">
                  {t('scan_log_in', lang)}
                </Link>
                {" · "}
                {t('scan_free_hint', lang)}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
