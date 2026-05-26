"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, Loader2, ScanBarcode } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { PhoneFrame } from "@/components/PhoneFrame";
import { cacheProductLocally } from "@/lib/localProducts";
import { toScanPayload } from "@/lib/openfoodfacts";
import { getStoredSupportStatus } from "@/lib/premium";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { ProductResult } from "@/lib/types";

const freeGuestScanLimit = 5;

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

export default function ScanPage() {
  const router = useRouter();
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [guestScansUsed, setGuestScansUsed] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
      if (active) {
        setIsSignedIn(Boolean(data.user));
        setUserEmail(data.user?.email ?? null);
      }
    }

    loadSession();
    setGuestScansUsed(getGuestScanCount());

    const listener = supabase?.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session?.user));
      setUserEmail(session?.user.email ?? null);
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

    const isPremium = Boolean(userEmail) && getStoredSupportStatus(userEmail).isSupporter;
    const isGuestAtLimit = !isSignedIn && !isPremium && getGuestScanCount() >= freeGuestScanLimit;

    if (isGuestAtLimit) {
      setError("Free guest scanning includes 5 scans per month. Log in and support Skaren to unlock unlimited scans.");
      return;
    }

    setLoading(true);
    setScanSuccess(false);
    setError("");
    setBarcode(cleanBarcode);

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
          await supabase.from("scans").insert(toScanPayload(product, userData.user.id));
        } else if (!isPremium) {
          recordGuestScan();
          setGuestScansUsed(getGuestScanCount());
        }
      } else if (!isSignedIn && !isPremium) {
        recordGuestScan();
        setGuestScansUsed(getGuestScanCount());
      }

      setScanSuccess(true);
      window.setTimeout(() => router.push(`/product/${product.barcode}`), 320);
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
      setLoading(false);
    }
  }

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await analyzeBarcode(barcode);
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-[430px] gap-4 px-4 pb-36 pt-4 sm:max-w-6xl sm:py-8 md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-8">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 130, damping: 24 }}
        >
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-[1.2rem] bg-forest text-cream shadow-glass sm:mb-6 sm:h-16 sm:w-16 sm:rounded-[1.4rem]">
            <ScanBarcode className="h-7 w-7" />
          </div>
          <h1 className="font-display max-w-xl text-[2.4rem] font-black leading-[0.96] tracking-[-0.055em] text-ink sm:text-6xl">Scan a barcode</h1>
          <p className="mt-3 max-w-xl text-base font-semibold leading-7 text-soil-600 sm:mt-5 sm:text-lg sm:leading-8">
            Use your phone camera to scan a barcode, or enter it manually when camera access is not available.
          </p>
          <div className="glass-card mt-4 flex max-w-xl gap-3 rounded-[1.5rem] p-4 text-sm leading-6 text-soil-600 sm:mt-8 sm:rounded-[1.7rem]">
            <Info className="mt-0.5 h-5 w-5 flex-none text-forest" />
            <p>Scan with your account to save history, badges, and dashboard stats.</p>
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 22, delay: 0.08 }}
          className="mx-auto w-full max-w-[23rem] md:max-w-[22rem]"
        >
        <PhoneFrame>
          <div className="flex min-h-[27rem] flex-col">
            <div className="text-center">
              <p className="text-sm font-bold text-soil-600">Skaren barcode</p>
              <h2 className="font-display mt-2 text-[1.75rem] font-black tracking-[-0.04em] text-ink sm:text-3xl">Analyze Product</h2>
            </div>
            <div className="my-4 sm:my-6">
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
