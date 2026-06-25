"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, ScanLine, Settings, X } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Spinner } from "@/components/Spinner";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { vibrate } from "@/lib/haptics";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/language-context";

type CameraErrorKind = "none" | "blocked" | "https" | "generic";

type BarcodeScannerProps = {
  disabled?: boolean;
  autoStart?: boolean;
  /** When true, hides the start/stop buttons and camera-icon placeholder. Use when embedding inside a custom viewfinder. */
  hideControls?: boolean;
  onDetected: (barcode: string) => void;
};

const scannerElementId = "skaren-camera-reader";

const supportedFormats: Html5QrcodeSupportedFormats[] = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.ITF
];

/**
 * Classifies a getUserMedia / html5-qrcode failure. A denied permission is the
 * important case: on iOS the OS will NOT prompt again once denied, so the app
 * must show its own "enable in Settings" recovery instead of silently failing.
 */
function classifyCameraError(caught: unknown): CameraErrorKind {
  const name = (caught as { name?: string })?.name ?? "";
  const message = (caught instanceof Error ? caught.message : String(caught ?? "")).toLowerCase();

  // Insecure-context failures are about HTTPS, not permission — check first.
  if (message.includes("https") || message.includes("secure context")) {
    return "https";
  }
  if (name === "NotAllowedError" || name === "SecurityError" || message.includes("permission") || message.includes("notallowed") || message.includes("denied")) {
    return "blocked";
  }
  return "generic";
}

export function BarcodeScanner({ disabled = false, autoStart = false, hideControls = false, onDetected }: BarcodeScannerProps) {
  const { lang } = useLang();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const detectedRef = useRef(false);
  const autoStartedRef = useRef(false);
  // Mirror scanning/starting state in refs so the start/stop/restart logic can
  // read the *current* value without being trapped by React's stale closures.
  const isScanningRef = useRef(false);
  const isStartingRef = useRef(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [errorKind, setErrorKind] = useState<CameraErrorKind>("none");

  const isNative = Capacitor.isNativePlatform();

  const setStarting = useCallback((value: boolean) => {
    isStartingRef.current = value;
    setIsStarting(value);
  }, []);

  const setScanning = useCallback((value: boolean) => {
    isScanningRef.current = value;
    setIsScanning(value);
  }, []);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;

    if (scanner?.isScanning) {
      await scanner.stop();
    }

    scanner?.clear();
    scannerRef.current = null;
    setScanning(false);
    setStarting(false);
  }, [setScanning, setStarting]);

  const startScanner = useCallback(async () => {
    if (disabled || isStartingRef.current || isScanningRef.current) return;

    setErrorKind("none");
    setStarting(true);
    detectedRef.current = false;
    vibrate(18);

    try {
      const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
      const isSecureCameraContext = window.isSecureContext || isLocalhost;

      if (!isSecureCameraContext) {
        const err = new Error("Camera scanning needs HTTPS on phones.");
        err.name = "SecurityError";
        throw err;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera scanning is not available in this browser.");
      }

      const scanner = new Html5Qrcode(scannerElementId, {
        formatsToSupport: supportedFormats,
        verbose: false
      });

      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          // When hideControls is true we render our own viewfinder overlay,
          // so suppress the library's built-in shaded scan region.
          ...(hideControls
            ? {}
            : {
                qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                  const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                  const size = Math.floor(minEdge * 0.72);
                  return { width: size, height: Math.floor(size * 0.58) };
                },
                aspectRatio: 1.7777778,
              }),
          disableFlip: false
        },
        async (decodedText) => {
          if (detectedRef.current) return;

          const cleanBarcode = decodedText.trim();
          if (!cleanBarcode) return;

          detectedRef.current = true;
          vibrate([18, 28, 28]);
          await stopScanner();
          onDetected(cleanBarcode);
        },
        () => {
          // Decode misses are expected while the user aligns a barcode.
        }
      );

      setScanning(true);
    } catch (caught) {
      scannerRef.current?.clear();
      scannerRef.current = null;
      setScanning(false);
      setErrorKind(classifyCameraError(caught));
    } finally {
      setStarting(false);
    }
  }, [disabled, hideControls, onDetected, setScanning, setStarting, stopScanner]);

  function openAppSettings() {
    if (isNative) {
      // Deep-link straight to this app's settings page (iOS & Android).
      window.open("app-settings:", "_self");
      return;
    }
    // On web there is no settings deep link; retry is the best we can offer.
    void startScanner();
  }

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, [stopScanner]);

  // Auto-start on mount (web + native). Calling getUserMedia from here triggers
  // the OS permission prompt the first time. On native, Capacitor's WebView
  // delegate auto-grants the WebKit layer, so this surfaces the real iOS/Android
  // system prompt without needing a manual button.
  useEffect(() => {
    if (!autoStart || disabled || autoStartedRef.current) return;

    autoStartedRef.current = true;
    const timer = window.setTimeout(() => {
      void startScanner();
    }, isNative ? 250 : 350);

    return () => window.clearTimeout(timer);
  }, [autoStart, disabled, isNative, startScanner]);

  // Keep the camera live whenever the app/tab returns to the foreground.
  // - Normal case: iOS suspends the camera while backgrounded, so we restart it
  //   so the viewfinder is always running when the user reopens the app.
  // - Denied case: if the user previously denied and then granted in Settings,
  //   coming back re-triggers the prompt/stream automatically (no button hunt).
  useEffect(() => {
    if (!autoStart || disabled) return;

    const resume = () => {
      if (isStartingRef.current) return;
      // Tear down any stale/suspended stream first, then restart fresh.
      void stopScanner().finally(() => {
        void startScanner();
      });
    };

    let cleanup = () => {};

    if (isNative) {
      const handlePromise = App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) resume();
      });
      cleanup = () => {
        void handlePromise.then((handle) => handle.remove());
      };
    } else {
      const onVisible = () => {
        if (document.visibilityState === "visible") resume();
      };
      document.addEventListener("visibilitychange", onVisible);
      cleanup = () => document.removeEventListener("visibilitychange", onVisible);
    }

    return cleanup;
  }, [autoStart, disabled, isNative, startScanner, stopScanner]);

  const showBlockedOverlay = errorKind === "blocked";

  return (
    <div className={hideControls ? "h-full w-full" : "space-y-3"}>
      {/* Force the library's injected video to fill and cover the container */}
      {hideControls && (
        <style>{`#${scannerElementId} { position: relative; } #${scannerElementId} video { object-fit: cover !important; width: 100% !important; height: 100% !important; }`}</style>
      )}
      <div className={`relative bg-black ${hideControls ? "h-full w-full" : "overflow-hidden rounded-[2rem] bg-lime-50"}`}>
        <div id={scannerElementId} className={`${hideControls ? "h-full w-full" : "min-h-56 w-full"} ${isScanning ? "bg-black" : ""}`} />

        {/* Permission-blocked recovery overlay — shown in BOTH modes so the
            embedded scan screen no longer dead-ends after a denial. */}
        {showBlockedOverlay ? (
          <div className="absolute inset-0 z-20 grid place-items-center bg-[#1a2617]/92 px-6 text-center backdrop-blur-sm">
            <div className="max-w-xs">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/12 text-white">
                <Camera className="h-8 w-8" />
              </div>
              <p className="mt-4 text-[17px] font-black text-white">{t("camera_blocked_title", lang)}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-white/80">
                {isNative ? t("camera_blocked_body", lang) : t("camera_blocked_body_web", lang)}
              </p>
              {isNative ? (
                <p className="mt-3 inline-block rounded-lg bg-white/12 px-3 py-1.5 text-[12px] font-semibold text-white/90">
                  {t("camera_settings_path", lang)}
                </p>
              ) : null}
              <div className="mt-5 flex flex-col gap-2">
                {isNative ? (
                  <button
                    type="button"
                    onClick={openAppSettings}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-[14px] font-bold text-[#1a2617]"
                  >
                    <Settings className="h-4 w-4" />
                    {t("camera_open_settings", lang)}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void startScanner()}
                  disabled={isStarting}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-5 py-3 text-[14px] font-bold text-white disabled:opacity-60"
                >
                  {isStarting ? <Spinner size={18} /> : <RotateCcw className="h-4 w-4" />}
                  {t("camera_try_again", lang)}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {!hideControls && !isScanning && !showBlockedOverlay ? (
          <div className="absolute inset-0 grid place-items-center p-5 text-center">
            <div>
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white text-ink shadow-soft">
                <Camera className="h-9 w-9" />
              </div>
              <p className="mt-4 text-sm font-semibold text-soil-600">Use your phone camera to scan a barcode.</p>
            </div>
          </div>
        ) : !hideControls && isScanning ? (
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-28 w-56 -translate-x-1/2 -translate-y-1/2 rounded-3xl border-2 border-white shadow-[0_0_0_999px_rgba(9,9,20,0.38)]" />
            <div className="scan-line absolute left-1/2 h-1 w-52 -translate-x-1/2 rounded-full bg-leaf-300 shadow-[0_0_18px_rgba(76,175,125,0.95)]" />
            <ScanLine className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-leaf-200/80" />
          </div>
        ) : null}
      </div>

      {!hideControls && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void startScanner()}
            disabled={disabled || isStarting || isScanning}
            className="focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-5 py-4 font-bold text-white shadow-phone disabled:bg-soil-600"
          >
            {isStarting ? <Spinner size={20} /> : <Camera className="h-5 w-5" />}
            {isStarting ? "Opening camera..." : isScanning ? "Scanning..." : "Scan Product"}
          </button>

          {isScanning ? (
            <button
              type="button"
              onClick={() => void stopScanner()}
              className="focus-ring grid h-14 w-14 place-items-center rounded-full border border-black/10 bg-white text-ink"
              aria-label="Stop camera scanning"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      )}

      {!hideControls && (errorKind === "https" || errorKind === "generic") ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
          {errorKind === "https" ? t("camera_error_https", lang) : t("camera_error_generic", lang)}
        </p>
      ) : null}
    </div>
  );
}
