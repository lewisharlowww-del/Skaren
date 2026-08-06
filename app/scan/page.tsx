"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Crown, Search } from "lucide-react";
import { isNativeScannerAvailable } from "@/lib/nativeScanner";
import { BottomNav } from "@/components/BottomNav";
import { Merk } from "@/components/Merk";
import { Spinner } from "@/components/Spinner";
import { useUser } from "@/hooks/useUser";
import { eanState } from "@/lib/ean";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/language-context";
import { vibrate } from "@/lib/haptics";
import { cacheProductLocally } from "@/lib/localProducts";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { usePremium } from "@/hooks/usePremium";
import type { ProductResult } from "@/lib/types";

// The web scanner pulls in html5-qrcode (~3.3 MB of source), and the native
// scanner is only used inside the Capacitor app. Load both on demand so the
// scan page's initial bundle stays small; the camera UI only appears after the
// page has mounted anyway. ssr:false because both need browser camera APIs.
const BarcodeScanner = dynamic(
  () => import("@/components/BarcodeScanner").then((mod) => mod.BarcodeScanner),
  { ssr: false }
);
const NativeBarcodeScanner = dynamic(
  () => import("@/components/NativeBarcodeScanner").then((mod) => mod.NativeBarcodeScanner),
  { ssr: false }
);

const BRACKET = "3px solid var(--sk-brand-forest)";

/** Four corner brackets, each rounded on its OUTER corner only. */
const CORNERS: Array<{
  key: string;
  pos: React.CSSProperties;
  radius: string;
  edges: React.CSSProperties;
}> = [
  { key: "tl", pos: { left: 0, top: 0 }, radius: "14px 0 0 0", edges: { borderLeft: BRACKET, borderTop: BRACKET } },
  { key: "tr", pos: { right: 0, top: 0 }, radius: "0 14px 0 0", edges: { borderRight: BRACKET, borderTop: BRACKET } },
  { key: "bl", pos: { left: 0, bottom: 0 }, radius: "0 0 0 14px", edges: { borderLeft: BRACKET, borderBottom: BRACKET } },
  { key: "br", pos: { right: 0, bottom: 0 }, radius: "0 0 14px 0", edges: { borderRight: BRACKET, borderBottom: BRACKET } }
];

/**
 * The three-second read.
 *
 * Three beats only, in result-page order, and no count is revealed early — the
 * verdict is never foreshadowed. A 1.4s floor keeps the read looking real; the
 * last beat resolves when the request actually lands, so it can never claim to
 * have finished work it hasn't done.
 */
function ScanLoadingOverlay({ scanSuccess }: { scanSuccess: boolean }) {
  const { lang } = useLang();
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setBeat(1), 600),
      window.setTimeout(() => setBeat(2), 1400)
    ];
    return () => timers.forEach(window.clearTimeout);
  }, []);

  const steps = [
    t("scan_step_found", lang),
    t("scan_step_additives", lang),
    t("scan_step_nutrition", lang)
  ];
  // The final beat only ticks when the product is actually in hand.
  const resolved = scanSuccess ? 3 : beat;

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center px-8"
      style={{ background: "#14120C" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <Merk expression="scanning" size={150} limbs={false} aria-label="Merk" />

      <ul className="mt-8 flex w-full max-w-[280px] flex-col gap-3">
        {steps.map((step, index) => {
          const done = index < resolved;
          const active = index === resolved;
          return (
            <li
              key={step}
              className="flex items-center gap-3"
              style={{
                fontFamily: "var(--sk-font-ui)",
                fontSize: 14.5,
                color: done || active ? "rgba(240,236,224,.9)" : "rgba(240,236,224,.32)",
                transition: "color 220ms ease-out"
              }}
            >
              <span
                aria-hidden
                className="grid h-4 w-4 flex-shrink-0 place-items-center"
                style={{ color: done ? "#8FBF9F" : "rgba(240,236,224,.32)" }}
              >
                {done ? "✓" : active ? "⟳" : "·"}
              </span>
              {step}
            </li>
          );
        })}
      </ul>

      {/* His barcode, never a spinner. */}
      <div className="mt-9 flex h-4 items-end gap-[3px]" aria-hidden>
        {[62, 100, 44, 88, 55, 96, 38].map((height, index) => (
          <span
            key={index}
            style={{
              width: 3,
              height: `${height}%`,
              borderRadius: 1,
              background: "#8FBF9F",
              opacity: 0.28 + (index % 3) * 0.24,
              animation: `sk-pulse 1.1s ease-in-out ${index * 90}ms infinite`
            }}
          />
        ))}
      </div>
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
  const { isPremium } = usePremium();
  // Use the native iOS AVFoundation scanner when available (hardware-accelerated,
  // instant); fall back to the html5-qrcode JS scanner on web/Android.
  const [useNativeScanner, setUseNativeScanner] = useState(false);

  useEffect(() => {
    setUseNativeScanner(isNativeScannerAvailable());
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
        body: JSON.stringify({ barcode: cleanBarcode, lang })
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

  const manualState = eanState(barcode);

  return (
    <>
      <BottomNav />
      <AnimatePresence>
        {loading ? <ScanLoadingOverlay scanSuccess={scanSuccess} /> : null}
      </AnimatePresence>
      {/* A camera screen is always dark — #14120C in both themes. */}
      <main
        className={`flex h-screen flex-col ${useNativeScanner ? "sk-native-cam-host" : ""}`}
        style={{ background: useNativeScanner ? "transparent" : "#14120C" }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between px-[22px] pt-safe" style={{ paddingTop: "max(20px, env(safe-area-inset-top))" }}>
          <span
            style={{
              fontFamily: "var(--sk-font-data)",
              fontSize: 10.5,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(246,243,236,.55)"
            }}
          >
            {t("nav_scan", lang)}
          </span>
          {user ? (
            <span style={{ fontSize: 11.5, color: "rgba(246,243,236,.42)" }}>
              {t("scan_signed_in", lang)}
            </span>
          ) : (
            <Link href="/login?next=%2Fscan" style={{ fontSize: 11.5, color: "rgba(143,191,159,.9)" }}>
              {t("scan_log_in", lang)}
            </Link>
          )}
        </div>

        {/* Viewfinder — camera feed inside static brackets, one sweeping line.
            Fills the available column: wider (px-5) and taller (the flex-1
            parent gives it the height), so there's no dead space. */}
        <div className="flex flex-1 items-stretch justify-center px-5 py-3">
          <div
            className="relative w-full overflow-hidden"
            style={{ borderRadius: 24, background: "rgba(246,243,236,.04)" }}
          >
            <div className="absolute inset-0">
              {useNativeScanner ? (
                <NativeBarcodeScanner
                  disabled={loading}
                  onDetected={(detectedBarcode) => void analyzeBarcode(detectedBarcode)}
                />
              ) : (
                <BarcodeScanner
                  autoStart
                  hideControls
                  disabled={loading}
                  onDetected={(detectedBarcode) => void analyzeBarcode(detectedBarcode)}
                />
              )}
            </div>

            {/* Corner brackets: 34px, 3px forest, radius on the outer corner only */}
            <div className="pointer-events-none absolute inset-0">
              {CORNERS.map((corner) => (
                <span
                  key={corner.key}
                  className="absolute"
                  style={{
                    ...corner.pos,
                    width: 34,
                    height: 34,
                    borderRadius: corner.radius,
                    ...corner.edges
                  }}
                />
              ))}
              <span
                className="sk-scan-line absolute"
                style={{
                  left: 14,
                  right: 14,
                  top: 0,
                  height: 2,
                  background: "#8FBF9F",
                  boxShadow: "0 0 16px 3px rgba(143,191,159,.5)",
                  ["--sk-sweep-distance" as string]: "100%"
                }}
              />
            </div>
          </div>
        </div>

        {/* Instruction — Merk's voice, not an instruction manual */}
        <p
          className="px-[26px] text-center"
          style={{ fontFamily: "var(--sk-font-ui)", fontSize: 14.5, lineHeight: 1.45, color: "rgba(246,243,236,.82)" }}
        >
          {t("scan_hold_steady", lang)}
        </p>

        {/* Merk waits at the bottom edge, only his upper body in frame. The top
            is masked to a soft fade so his rounded head-corners never read as a
            hard clipped edge, and he sits low enough that the scan-line and
            folded corner stay out of the crop. */}
        <div
          className="relative mt-1 h-[64px] overflow-hidden"
          aria-hidden
          style={{
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0, rgba(0,0,0,0.5) 30px, #000 46px)",
            maskImage: "linear-gradient(to bottom, transparent 0, rgba(0,0,0,0.5) 30px, #000 46px)",
          }}
        >
          <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: -118 }}>
            <Merk expression="scanning" size={172} limbs={false} />
          </div>
        </div>

        {/* Manual fallbacks — both always visible, no menu */}
        <div className="relative z-10 px-5 pb-3" style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}>
          <form onSubmit={handleAnalyze}>
            <div
              className="flex items-center gap-[11px]"
              style={{
                background: "rgba(246,243,236,.09)",
                border: `1px solid ${manualState === "invalid" ? "var(--sk-score-weak)" : "rgba(246,243,236,.16)"}`,
                borderRadius: 16,
                padding: "13px 15px",
                minHeight: "var(--sk-min-tap)"
              }}
            >
              <span className="flex h-[15px] flex-shrink-0 items-end gap-[1.5px]" aria-hidden>
                {[70, 100, 50, 88, 62].map((height, index) => (
                  <span key={index} style={{ width: 2, height: `${height}%`, background: "rgba(246,243,236,.6)" }} />
                ))}
              </span>
              <label className="flex-1">
                <span className="sr-only">{t("scan_enter_barcode", lang)}</span>
                <input
                  className="w-full bg-transparent outline-none"
                  style={{
                    fontFamily: "var(--sk-font-ui)",
                    fontVariantNumeric: "tabular-nums",
                    fontSize: 14,
                    color: "#F6F3EC"
                  }}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder={t("scan_enter_barcode", lang)}
                  value={barcode}
                  onChange={(event) => setBarcode(event.target.value)}
                />
                <span style={{ display: "block", fontSize: 11.5, color: "rgba(246,243,236,.5)", marginTop: 1 }}>
                  {t("scan_enter_barcode_hint", lang)}
                </span>
              </label>
              <button
                type="submit"
                disabled={loading || manualState === "invalid" || manualState === "empty"}
                className="focus-ring grid flex-shrink-0 place-items-center rounded-full disabled:opacity-35"
                style={{ width: 34, height: 34, color: "#8FBF9F" }}
                aria-label={t("scan_analyze", lang)}
              >
                {loading ? <Spinner size={16} /> : <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </form>

          {/* Checksum feedback: caught locally, before a doomed lookup goes out */}
          {manualState === "invalid" ? (
            <p style={{ marginTop: 7, fontSize: 11.5, color: "var(--sk-score-weak)" }}>
              {t("scan_checksum_invalid", lang)}
            </p>
          ) : null}
          {error ? (
            <p style={{ marginTop: 7, fontSize: 11.5, color: "var(--sk-score-weak)" }}>{error}</p>
          ) : null}

          <div className="mt-[9px] flex items-center gap-[11px]">
            <span className="h-px flex-1" style={{ background: "rgba(246,243,236,.13)" }} />
            <span style={{ fontSize: 11.5, color: "rgba(246,243,236,.42)" }}>{t("scan_or", lang)}</span>
            <span className="h-px flex-1" style={{ background: "rgba(246,243,236,.13)" }} />
          </div>

          <Link
            href={isPremium ? "/search" : "/pricing"}
            className="focus-ring mt-[9px] flex items-center gap-[11px]"
            style={{
              border: "1px solid rgba(246,243,236,.16)",
              borderRadius: 16,
              padding: "12px 15px",
              minHeight: "var(--sk-min-tap)"
            }}
          >
            <Search className="h-4 w-4 flex-shrink-0" style={{ color: "rgba(246,243,236,.6)" }} />
            <span className="flex-1" style={{ fontFamily: "var(--sk-font-ui)", fontSize: 14, color: "rgba(246,243,236,.6)" }}>
              {t("scan_search_by_name", lang)}
            </span>
            {!isPremium ? <Crown className="h-4 w-4" style={{ color: "#D6B366" }} aria-label={t("pro_feature", lang)} /> : null}
          </Link>
        </div>
      </main>
    </>
  );
}
