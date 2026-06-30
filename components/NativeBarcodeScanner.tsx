"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, Settings } from "lucide-react";
import type { PluginListenerHandle } from "@capacitor/core";
import { Spinner } from "@/components/Spinner";
import { vibrate } from "@/lib/haptics";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/language-context";
import { NativeBarcode } from "@/lib/nativeScanner";

type Props = {
  disabled?: boolean;
  onDetected: (barcode: string) => void;
};

type NativeState = "starting" | "scanning" | "blocked" | "error";

const PASSTHROUGH_CLASS = "sk-native-cam-active";

/**
 * Force WebKit to recomposite the (now transparent) document so the native
 * camera preview sitting behind the WKWebView becomes visible immediately,
 * instead of only after the user navigates to another tab and back.
 *
 * Switching tabs "fixes" the black/invisible camera precisely because the
 * remount forces WebKit to repaint the transparent DOM. Flipping the
 * passthrough class alone changes the styles but doesn't always invalidate the
 * already-composited opaque backing layer. We reproduce that invalidation by
 * toggling a GPU-compositing hint on <html> across a few animation frames,
 * which forces a fresh composite without any visible flicker. Repeated over a
 * short window because the layer can take a beat to become paintable on a cold
 * launch (mirrors the native `forceWebViewRecomposite`).
 */
function forceWebViewRepaint(): void {
  const root = document.documentElement;
  const kick = () => {
    requestAnimationFrame(() => {
      root.style.transform = "translateZ(0)";
      requestAnimationFrame(() => {
        root.style.transform = "";
      });
    });
  };
  [0, 120, 300, 600, 1100].forEach((d) => window.setTimeout(kick, d));
}

/**
 * iOS-only scanner backed by the native AVFoundation plugin.
 *
 * The native camera preview is inserted behind the WKWebView, so for it to be
 * visible we make the DOM transparent in the camera region (via a root class
 * that the plugin/CSS cooperate on). The decorative viewfinder overlay lives in
 * the parent scan page and renders on top of the camera.
 */
export function NativeBarcodeScanner({ disabled = false, onDetected }: Props) {
  const { lang } = useLang();
  const [state, setState] = useState<NativeState>("starting");
  const detectedRef = useRef(false);
  const listenerRef = useRef<PluginListenerHandle | null>(null);
  const startedRef = useRef(false);
  // Keep the latest onDetected without retriggering the start/stop effect.
  const onDetectedRef = useRef(onDetected);
  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    if (disabled) return;
    let cancelled = false;

    const setPassthrough = (on: boolean) => {
      document.documentElement.classList.toggle(PASSTHROUGH_CLASS, on);
      if (on) forceWebViewRepaint();
    };

    async function start() {
      if (startedRef.current || cancelled) return;
      startedRef.current = true;
      detectedRef.current = false;
      setState("starting");

      try {
        const perm = await NativeBarcode.checkPermission();
        let granted = perm.granted;
        if (!granted && perm.status === "prompt") {
          const req = await NativeBarcode.requestPermission();
          granted = req.granted;
        }
        if (cancelled) return;
        if (!granted) {
          setState("blocked");
          startedRef.current = false;
          return;
        }

        listenerRef.current = await NativeBarcode.addListener("barcodeScanned", (data) => {
          if (detectedRef.current || cancelled) return;
          const clean = data.barcode?.trim();
          if (!clean) return;
          detectedRef.current = true;
          vibrate([18, 28, 28]);
          const cb = onDetectedRef.current;
          void stop().finally(() => cb(clean));
        });

        setPassthrough(true);
        await NativeBarcode.startScan();
        if (cancelled) {
          void stop();
          return;
        }
        setState("scanning");
      } catch {
        startedRef.current = false;
        if (!cancelled) setState("error");
        setPassthrough(false);
      }
    }

    async function stop() {
      setPassthrough(false);
      try {
        await listenerRef.current?.remove();
      } catch {
        /* ignore */
      }
      listenerRef.current = null;
      try {
        await NativeBarcode.stopScan();
      } catch {
        /* ignore */
      }
      startedRef.current = false;
    }

    void start();

    // Pause/resume with app foreground state — but only act on real transitions,
    // not the noisy events seen at launch.
    const onVisible = () => {
      if (cancelled || disabled) return;
      if (document.visibilityState === "visible") {
        if (!detectedRef.current && !startedRef.current) void start();
      } else {
        void stop();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void stop();
    };
    // Intentionally NOT depending on onDetected (captured via ref) so the camera
    // isn't torn down and restarted on every parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  async function retry() {
    startedRef.current = false;
    detectedRef.current = false;
    try {
      const req = await NativeBarcode.requestPermission();
      if (req.granted) {
        // Re-run the effect's start by toggling state; simplest is a reload of scan.
        window.location.reload();
      } else {
        window.open("app-settings:", "_self");
      }
    } catch {
      window.open("app-settings:", "_self");
    }
  }

  // The element is transparent so the camera (behind the webview) shows through.
  return (
    <div className="h-full w-full bg-transparent">
      {state === "starting" ? (
        <div className="absolute inset-0 grid place-items-center">
          <Spinner size={26} />
        </div>
      ) : null}

      {state === "blocked" ? (
        <div className="absolute inset-0 z-20 grid place-items-center bg-[#1a2617]/92 px-6 text-center backdrop-blur-sm">
          <div className="max-w-xs">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/12 text-white">
              <Camera className="h-8 w-8" />
            </div>
            <p className="mt-4 text-[17px] font-black text-white">{t("camera_blocked_title", lang)}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-white/80">{t("camera_blocked_body", lang)}</p>
            <p className="mt-3 inline-block rounded-lg bg-white/12 px-3 py-1.5 text-[12px] font-semibold text-white/90">
              {t("camera_settings_path", lang)}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => window.open("app-settings:", "_self")}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-[14px] font-bold text-[#1a2617]"
              >
                <Settings className="h-4 w-4" />
                {t("camera_open_settings", lang)}
              </button>
              <button
                type="button"
                onClick={() => void retry()}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-5 py-3 text-[14px] font-bold text-white"
              >
                <RotateCcw className="h-4 w-4" />
                {t("camera_try_again", lang)}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {state === "error" ? (
        <button
          type="button"
          onClick={() => void retry()}
          className="absolute inset-0 z-20 grid place-items-center bg-[#1a2617]/70 text-white"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-white/14 px-5 py-3 text-sm font-bold backdrop-blur-md">
            <RotateCcw className="h-4 w-4" />
            {t("camera_try_again", lang)}
          </span>
        </button>
      ) : null}
    </div>
  );
}
