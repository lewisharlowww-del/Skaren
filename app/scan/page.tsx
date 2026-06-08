"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ScanBarcode, Search } from "lucide-react";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { BottomNav } from "@/components/BottomNav";
import { Spinner } from "@/components/Spinner";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/language-context";
import { PhoneFrame } from "@/components/PhoneFrame";
import { vibrate } from "@/lib/haptics";
import { cacheProductLocally } from "@/lib/localProducts";
import { toScanPayload } from "@/lib/openfoodfacts";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getUserPremiumStatus } from "@/lib/premium";
import type { ProductResult } from "@/lib/types";

const freeGuestScanLimit = 5;
const loadingMessages = ["Reading barcode...", "Checking ingredients...", "Checking product grades...", "Analyzing nutrition..."];

function getGuestScanKey() {
  const date = new Date();
  return `skaren-guest-scans:${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getGuestScanCount() {
  return Number(window.localStorage.getItem(getGuestScanKey()) ?? "0");
}

function recordGuestScan() {
  window.localStorage.setItem(getGuestScanKey(), String(getGuestScanCount() + 1));
}

function toLegacyScanPayload(payload: ReturnType<typeof toScanPayload>) {
  const { skaren_grade, health_grade, environmental_grade, ...legacyPayload } = payload;
  return legacyPayload;
}

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
      className="fixed inset-0 z-[80] grid place-items-center bg-mint/86 px-5 backdrop-blur-xl"
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
        className="w-full max-w-sm rounded-[2.25rem] border border-white/70 bg-white/92 p-6 text-center shadow-glass"
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
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [savedToHistory, setSavedToHistory] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [guestScansUsed, setGuestScansUsed] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
      if (active) {
        setIsSignedIn(Boolean(data.user));
      }

      const premium = supabase ? await getUserPremiumStatus(supabase) : false;
      if (active) setIsPremium(premium);
    }

    loadSession();
    setGuestScansUsed(getGuestScanCount());

    const listener = supabase?.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session?.user));
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
      setError("Enter a barcode or scan one with your camera.");
      return;
    }

    const isGuestAtLimit = !isSignedIn && !isPremium && getGuestScanCount() >= freeGuestScanLimit;

    if (isGuestAtLimit) {
      setError("Free guest scanning includes 5 scans per month. Log in and support Skaren to unlock unlimited scans.");
      return;
    }

    setLoading(true);
    setScanSuccess(false);
    setSavedToHistory(false);
    setError("");
    setBarcode(cleanBarcode);
    vibrate(12);
    let keepLoadingForNavigation = false;

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode: cleanBarcode })
      });
      const data = (await response.json()) as { product?: ProductResult; error?: string };

      if (!response.ok || !data.product) {
        sessionStorage.setItem(
          `skaren-error:${cleanBarcode}`,
          JSON.stringify({
            message: response.status === 404 ? "We couldn't find this product. Try another barcode or check the number is correct." : "Something went wrong. Please try again.",
            type: response.status === 404 ? "not-found" : "retry"
          })
        );
        router.push(`/product/${cleanBarcode}`);
        return;
      }

      const product = data.product;
      sessionStorage.setItem(`skaren:${product.barcode}`, JSON.stringify(product));
      cacheProductLocally(product);

      if (isSupabaseConfigured && supabase) {
        const { data: userData } = await supabase.auth.getUser();

        if (userData.user) {
          const scanPayload = toScanPayload(product, userData.user.id);
          const { error: saveError } = await supabase.from("scans").insert(scanPayload);
          let saved = !saveError;

          if (saveError) {
            console.warn("[Scan] Extended scan save failed, retrying with legacy scan fields:", saveError);
            const { error: legacySaveError } = await supabase.from("scans").insert(toLegacyScanPayload(scanPayload));
            saved = !legacySaveError;

            if (legacySaveError) {
              console.error("[Scan] Save failed:", legacySaveError);
            }
          }

          if (saved) {
            setSavedToHistory(true);
            vibrate([12, 24, 18]);
          }
        } else if (!isPremium) {
          recordGuestScan();
          setGuestScansUsed(getGuestScanCount());
        }
      } else if (!isSignedIn && !isPremium) {
        recordGuestScan();
        setGuestScansUsed(getGuestScanCount());
      }

      setScanSuccess(true);
      keepLoadingForNavigation = true;
      vibrate([18, 30, 35]);
      window.setTimeout(() => router.push(`/product/${product.barcode}`), 720);
    } catch {
      sessionStorage.setItem(
        `skaren-error:${cleanBarcode}`,
        JSON.stringify({
          message: "Something went wrong. Please try again.",
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
          className="relative flex flex-col items-center justify-center overflow-hidden px-5 pb-6 pt-4"
          style={{ height: "46vh", background: "linear-gradient(135deg, #f0ece0 0%, #fff 45%, #eaf3e8 100%)" }}
        >
          {/* Ambient glow blobs */}
          <div style={{ position: "absolute", top: -20, left: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(74,140,92,.2)", filter: "blur(30px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(244,162,97,.15)", filter: "blur(25px)", pointerEvents: "none" }} />

          {/* Viewfinder frame */}
          <div className="relative mb-3" style={{ width: "160px", height: "140px" }}>
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 rounded-tl-xl" style={{ borderTop: "3px solid rgba(45,74,38,.4)", borderLeft: "3px solid rgba(45,74,38,.4)" }} />
            <div className="absolute top-0 right-0 w-8 h-8 rounded-tr-xl" style={{ borderTop: "3px solid rgba(45,74,38,.4)", borderRight: "3px solid rgba(45,74,38,.4)" }} />
            <div className="absolute bottom-0 left-0 w-8 h-8 rounded-bl-xl" style={{ borderBottom: "3px solid rgba(45,74,38,.4)", borderLeft: "3px solid rgba(45,74,38,.4)" }} />
            <div className="absolute bottom-0 right-0 w-8 h-8 rounded-br-xl" style={{ borderBottom: "3px solid rgba(45,74,38,.4)", borderRight: "3px solid rgba(45,74,38,.4)" }} />
            {/* Scanner line */}
            <div className="absolute left-4 right-4 top-1/2" style={{ height: 2, background: "#4a8c5c", opacity: 0.6 }} />
            {/* Hidden BarcodeScanner still listens for scans */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-0 pointer-events-none">
              <BarcodeScanner autoStart disabled={loading} onDetected={(detectedBarcode) => void analyzeBarcode(detectedBarcode)} />
            </div>
          </div>
          <p className="text-[20px] font-black" style={{ fontFamily: "Satoshi, sans-serif", color: "#2d4a26" }}>
            {t('scan_title', lang)}
          </p>
          <p className="mt-0.5 text-[12px]" style={{ color: "#9a8e7e" }}>{t('scan_subtitle', lang)}</p>
          {/* Tap to scan button */}
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              const scanner = document.querySelector('video');
              if (scanner) scanner.click();
            }}
            className="mt-4 flex items-center gap-2 rounded-full px-5 py-2.5 text-[12px] font-bold"
            style={{ background: "#2d4a26", color: "#dceedd" }}
          >
            <ScanBarcode className="h-4 w-4" />
            {t('scan_tap_camera', lang)}
          </button>
        </div>
        {/* Bottom section */}
        <div className="flex-1 overflow-hidden px-5 pb-24 pt-4">
          {/* Divider */}
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#e0d8cc]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#9a8e7e]">{t('scan_enter_manually', lang)}</span>
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
              {scanSuccess ? "Product found" : loading ? t('loading', lang) : t('scan_analyze', lang)}
            </button>
            {error ? (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div>
            ) : null}
          </form>
          {/* Search products row — premium feature */}
          <div className="mt-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#e0d8cc]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#9a8e7e]">{t('scan_or_explore', lang)}</span>
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
              <p className="text-[14px] font-bold text-[#2d4a26]">{t('scan_search_products', lang)}</p>
              <p className="text-[11px] text-[#9a8e7e]">{isPremium ? t('scan_find_without_scanning', lang) : t('pro_feature', lang)}</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b0a090" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </Link>
          {/* Status */}
          <div className="mt-3 flex justify-center">
            {isSignedIn ? (
              <span className="rounded-full bg-[#eaf3de] px-4 py-2 text-[11px] font-bold text-[#2d4a26]">
                {t('scan_signed_in', lang)}
              </span>
            ) : (
              <p className="text-center text-[11px] text-[#9a8e7e]">
                Free scans: {Math.min(guestScansUsed, freeGuestScanLimit)}/{freeGuestScanLimit} this month
                {" · "}
                <Link href="/login?next=%2Fscan" className="font-bold text-[#2d4a26] underline underline-offset-2">
                  Log in
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
