"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, Loader2, ScanBarcode } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { PhoneFrame } from "@/components/PhoneFrame";
import { vibrate } from "@/lib/haptics";
import { cacheProductLocally } from "@/lib/localProducts";
import { toScanPayload } from "@/lib/openfoodfacts";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { ProductResult } from "@/lib/types";

const freeGuestScanLimit = 5;
const loadingMessages = ["Reading barcode...", "Checking ingredients...", "Building Skaren grade...", "Analyzing nutrition..."];

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

        <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-forest">{scanSuccess ? "Found product" : "Skaren scan"}</p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-ink">
          {scanSuccess ? "Opening product report" : loadingMessages[messageIndex]}
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-soil-600">
          Barcode {barcode || "detected"} is being turned into a clean Skaren grade.
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
              className="motion-scan-success mt-4 inline-flex items-center gap-2 rounded-full bg-leaf-100 px-4 py-2 text-sm font-black text-forest"
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
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [savedToHistory, setSavedToHistory] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isSupporter, setIsSupporter] = useState(false);
  const [guestScansUsed, setGuestScansUsed] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
      if (active) {
        setIsSignedIn(Boolean(data.user));
      }

      const { data: sessionData } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
      if (sessionData.session?.access_token) {
        const response = await fetch("/api/stripe/premium-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session.access_token}`
          }
        }).catch(() => null);
        const premiumStatus = (await response?.json().catch(() => null)) as { premium?: boolean } | null;
        if (active) setIsSupporter(Boolean(premiumStatus?.premium));
      } else if (active) {
        setIsSupporter(false);
      }
    }

    loadSession();
    setGuestScansUsed(getGuestScanCount());

    const listener = supabase?.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session?.user));
      setIsSupporter(false);
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

    const isGuestAtLimit = !isSignedIn && !isSupporter && getGuestScanCount() >= freeGuestScanLimit;

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
        } else if (!isSupporter) {
          recordGuestScan();
          setGuestScansUsed(getGuestScanCount());
        }
      } else if (!isSignedIn && !isSupporter) {
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
      <AppHeader />
      <AnimatePresence>
        {loading ? <ScanLoadingOverlay barcode={barcode} scanSuccess={scanSuccess} saved={savedToHistory} /> : null}
      </AnimatePresence>
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-[430px] gap-4 px-4 pb-36 pt-3 sm:max-w-6xl sm:py-8 md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-8">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 130, damping: 24 }}
          className="order-2 md:order-1"
        >
          <div className="mb-3 hidden h-12 w-12 place-items-center rounded-[1.2rem] bg-forest text-cream shadow-glass sm:mb-6 sm:grid sm:h-16 sm:w-16 sm:rounded-[1.4rem]">
            <ScanBarcode className="h-7 w-7" />
          </div>
          <h1 className="font-display max-w-xl text-[1.75rem] font-black leading-tight tracking-[-0.045em] text-ink sm:text-6xl">Scan a barcode</h1>
          <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-soil-600 sm:mt-5 sm:text-lg sm:leading-8">
            Use your phone camera to scan a barcode, or enter it manually when camera access is not available.
          </p>
          <div className="glass-card mt-3 flex max-w-xl gap-3 rounded-[1.25rem] p-3 text-sm leading-6 text-soil-600 sm:mt-8 sm:rounded-[1.7rem] sm:p-4">
            <Info className="mt-0.5 h-5 w-5 flex-none text-forest" />
            <p>Scan with your account to save history, badges, and dashboard stats.</p>
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 22, delay: 0.08 }}
          className="order-1 mx-auto w-full max-w-[23rem] md:order-2 md:max-w-[22rem]"
        >
        <PhoneFrame className="rounded-[1.8rem] border-2 sm:rounded-[2.25rem] sm:border-[3px]" contentClassName="min-h-0 px-4 pb-5 pt-5 sm:min-h-[34rem] sm:px-7 sm:pb-8 sm:pt-10">
          <div className="flex flex-col">
            <div className="text-center sm:block">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-forest sm:text-sm sm:normal-case sm:tracking-normal sm:text-soil-600">Camera ready</p>
              <h2 className="font-display mt-1 text-[1.45rem] font-black tracking-[-0.04em] text-ink sm:mt-2 sm:text-3xl">Analyze Product</h2>
            </div>
            <div className="my-3 sm:my-6">
              <BarcodeScanner autoStart disabled={loading} onDetected={(detectedBarcode) => void analyzeBarcode(detectedBarcode)} />
            </div>

            <form onSubmit={handleAnalyze} className="space-y-4">
              <label className="block text-sm font-bold text-ink">
                Barcode
                <input
                  className="focus-ring mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-4 text-center text-lg font-bold"
                  inputMode="numeric"
                  placeholder="3017620422003"
                  value={barcode}
                  onChange={(event) => setBarcode(event.target.value)}
                  autoComplete="off"
                  required
                />
              </label>
              <button
                disabled={loading}
                className="focus-ring tap-feedback sticky bottom-24 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-4 font-black text-white shadow-phone hover:-translate-y-0.5 hover:bg-forest disabled:bg-soil-600 sm:static"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {scanSuccess ? (
                    <motion.span
                      key="success"
                      initial={{ opacity: 0, scale: 0.86 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ type: "spring", stiffness: 360, damping: 24 }}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </motion.span>
                  ) : loading ? (
                    <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </motion.span>
                  ) : (
                    <motion.span key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <ScanBarcode className="h-5 w-5" />
                    </motion.span>
                  )}
                </AnimatePresence>
                {scanSuccess ? "Product found" : loading ? "Analyzing..." : "Analyze Product"}
              </button>
              {error ? <p className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</p> : null}
            </form>
            {isSignedIn ? (
              <p className="mt-5 rounded-2xl bg-leaf-50 px-4 py-3 text-center text-sm font-bold text-forest">
                Signed in. Scans will be saved to your history.
              </p>
            ) : (
              <div className="mt-5 rounded-2xl bg-soil-50 px-4 py-3 text-center text-sm text-soil-600">
                <p className="font-bold text-soil-700">
                  Free guest scans: {Math.min(guestScansUsed, freeGuestScanLimit)}/{freeGuestScanLimit} this month
                </p>
                <p className="mt-1">
                  Want unlimited scans and saved history?{" "}
                  <Link className="font-bold text-ink underline decoration-lime-400 decoration-2 underline-offset-4" href="/login?next=%2Fscan">
                    Log in or upgrade
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>
        </PhoneFrame>
        </motion.div>
      </main>
    </>
  );
}
