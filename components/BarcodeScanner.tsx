"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, ScanLine, Settings, X } from "lucide-react";
import { Capacitor } from "@capacitor/core";
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

/**
 * Force an iOS WKWebView <video> to actually start playing.
 *
 * html5-qrcode binds the camera MediaStream and calls video.play() but ignores
 * the returned promise. On a cold launch iOS rejects that initial play() (the
 * WebView is not yet the active responder), leaving the element paused and the
 * viewfinder BLACK even though the stream is live. We re-issue play() with a
 * few retries until the element is genuinely playing.
 */
async function ensureVideoPlaying(video: HTMLVideoElement): Promise<void> {
  // Required for inline playback on iOS; harmless elsewhere.
  video.muted = true;
  video.setAttribute("muted", "true");
  video.setAttribute("playsinline", "true");
  (video as HTMLVideoElement & { playsInline: boolean }).playsInline = true;

  const delays = [0, 200, 500, 1000, 1600];
  for (const delay of delays) {
    if (delay > 0) await new Promise((r) => window.setTimeout(r, delay));
    // Playing if not paused and frames are advancing.
    if (!video.paused && video.readyState >= 2) {
      forceVideoRepaint(video);
      return;
    }
    try {
      await video.play();
      if (!video.paused) {
        forceVideoRepaint(video);
        return;
      }
    } catch (err) {
    }
  }
}

/**
 * Force the WebKit compositor to repaint a MediaStream <video>.
 *
 * On iOS a getUserMedia <video> can play() successfully yet stay BLACK because
 * its compositing layer is not repainted until something invalidates it — which
 * is exactly what backgrounding/foregrounding the app does, and why the manual
 * app-switch "fixes" the camera. We reproduce that invalidation by nudging the
 * element's transform/opacity across a few animation frames, which forces a
 * fresh GPU composite without restarting the stream. We repeat it a handful of
 * times over ~2.5s because the moment the layer becomes paintable varies.
 */
function forceVideoRepaint(video: HTMLVideoElement): void {
  const apply = (t: string, o: string) => {
    video.style.transform = t;
    video.style.opacity = o;
  };
  const kick = () => {
    requestAnimationFrame(() => {
      apply("translateZ(0) scale(1.0001)", "0.999");
      requestAnimationFrame(() => {
        apply("translateZ(0) scale(1)", "1");
      });
    });
  };
  [0, 150, 400, 800, 1500, 2500].forEach((d) => window.setTimeout(kick, d));
}

export function BarcodeScanner({ disabled = false, autoStart = false, hideControls = false, onDetected }: BarcodeScannerProps) {
  const { lang } = useLang();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const detectedRef = useRef(false);
  // Mirror scanning/starting state in refs so the start/stop/restart logic can
  // read the *current* value without being trapped by React's stale closures.
  const isScanningRef = useRef(false);
  const isStartingRef = useRef(false);
  // Mirror errorKind too so the retry loop can read the latest value.
  const errorKindRef = useRef<CameraErrorKind>("none");
  // Cleanup for the current video-track mute watcher + its pending restart timer.
  const trackWatchCleanupRef = useRef<() => void>(() => {});
  const muteRestartTimerRef = useRef(0);
  // Set by the camera controller so startScanner's track watcher can request a
  // restart when iOS delivers a muted (black) track.
  const requestRestartRef = useRef<(reason: string) => void>(() => {});
  const [isStarting, setIsStarting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [errorKind, setErrorKindState] = useState<CameraErrorKind>("none");
  // True once the automatic start has been attempted. Until then we don't show
  // the "tap to start" fallback, so a successful auto-start never flashes it.
  const [autoStartAttempted, setAutoStartAttempted] = useState(false);

  const isNative = Capacitor.isNativePlatform();



  const setErrorKind = useCallback((value: CameraErrorKind) => {
    errorKindRef.current = value;
    setErrorKindState(value);
  }, []);

  const setStarting = useCallback((value: boolean) => {
    isStartingRef.current = value;
    setIsStarting(value);
  }, []);

  const setScanning = useCallback((value: boolean) => {
    isScanningRef.current = value;
    setIsScanning(value);
  }, []);

  const stopScanner = useCallback(async () => {
    // Tear down any track-mute watcher from the previous session.
    trackWatchCleanupRef.current();
    trackWatchCleanupRef.current = () => {};
    window.clearTimeout(muteRestartTimerRef.current);

    const scanner = scannerRef.current;

    if (scanner?.isScanning) {
      await scanner.stop();
    }

    scanner?.clear();
    scannerRef.current = null;
    setScanning(false);
    setStarting(false);
  }, [setScanning, setStarting]);

  // Watch a live video track for the iOS "muted" (suspended/black) state. iOS
  // can hand back a muted track during the cold-launch lifecycle storm even
  // though getUserMedia resolved. If it stays muted past a short grace window,
  // ask the lifecycle effect to perform a full clean restart (the same thing a
  // manual app background/foreground does). unmute within the window cancels.
  const attachTrackWatch = useCallback((track: MediaStreamTrack) => {
    trackWatchCleanupRef.current();

    const scheduleMuteRestart = () => {
      window.clearTimeout(muteRestartTimerRef.current);
      muteRestartTimerRef.current = window.setTimeout(() => {
        if (track.muted && document.visibilityState === "visible") {
          requestRestartRef.current("muted track");
        }
      }, 900);
    };

    const onMute = () => {
      scheduleMuteRestart();
    };
    const onUnmute = () => {
      window.clearTimeout(muteRestartTimerRef.current);
    };
    const onEnded = () => {
      if (document.visibilityState === "visible") requestRestartRef.current("track ended");
    };

    track.addEventListener("mute", onMute);
    track.addEventListener("unmute", onUnmute);
    track.addEventListener("ended", onEnded);

    // If it arrived already muted, start the grace timer immediately.
    if (track.muted) scheduleMuteRestart();

    trackWatchCleanupRef.current = () => {
      track.removeEventListener("mute", onMute);
      track.removeEventListener("unmute", onUnmute);
      track.removeEventListener("ended", onEnded);
      window.clearTimeout(muteRestartTimerRef.current);
    };
  }, []);

  const startScanner = useCallback(async (fromGesture = false) => {
    // Already running is "success" for the retry loop; already starting is a
    // no-op so we report not-yet-running.
    if (isScanningRef.current) return true;
    if (disabled || isStartingRef.current) return false;
    // Don't try while the page/app is hidden: iOS rejects camera capture with
    // CoreMedia err -12710 when not foreground. document.visibilityState is the
    // reliable foreground signal (the native isActive events are noisy and emit
    // spurious false right after launch). A real tap always means visible.
    if (!fromGesture && typeof document !== "undefined" && document.visibilityState === "hidden") {
      return false;
    }

    setErrorKind("none");
    setStarting(true);
    detectedRef.current = false;
    // Only buzz for an explicit tap; the cold-launch retry loop must stay silent.
    if (fromGesture) vibrate(18);

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

      // Watch the live video track for iOS suspending capture. During the cold-
      // launch lifecycle storm the track can be delivered "muted" (black frame)
      // even though start() resolved. The track fires mute/unmute events; if it
      // stays muted briefly, force a clean restart (what the app-switch did).
      try {
        const video = document.querySelector<HTMLVideoElement>(`#${scannerElementId} video`);
        const track = (video?.srcObject as MediaStream | null)?.getVideoTracks?.()[0];
        if (track) {
          attachTrackWatch(track);
        }
        // CRITICAL iOS FIX: html5-qrcode calls video.play() but ignores the
        // returned promise. On a cold launch iOS rejects that play() (the
        // WebView isn't the active responder yet), so the <video> stays paused
        // and BLACK even though getUserMedia succeeded and the track is live.
        // We explicitly (re)play it with a few retries until it actually runs.
        if (video) void ensureVideoPlaying(video);
      } catch (watchErr) {
      }
      return true;
    } catch (caught) {
      scannerRef.current?.clear();
      scannerRef.current = null;
      setScanning(false);
      const kind = classifyCameraError(caught);
      // On iOS the first (gesture-less) getUserMedia attempt is rejected with a
      // NotAllowedError even though the user never denied anything. Treat a
      // "blocked" result from a non-gesture attempt as "needs a tap" rather than
      // a hard denial, so we show the tap target instead of the Settings
      // dead-end. A failure from an actual tap is a genuine denial.
      if (kind === "blocked" && !fromGesture) {
        setErrorKind("none");
      } else {
        setErrorKind(kind);
      }
      return false;
    } finally {
      setStarting(false);
    }
  }, [attachTrackWatch, disabled, hideControls, onDetected, setErrorKind, setScanning, setStarting, stopScanner]);

  function openAppSettings() {
    if (isNative) {
      // Deep-link straight to this app's settings page (iOS & Android).
      window.open("app-settings:", "_self");
      return;
    }
    // On web there is no settings deep link; retry is the best we can offer.
    void startScanner(true);
  }

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, [stopScanner]);

  // ───────────────────────────────────────────────────────────────────────
  // Single camera controller.
  //
  // Hard-won lesson from on-device logs: starting the camera DURING the iOS
  // launch lifecycle storm (rapid active<->inactive / visible<->hidden) yields a
  // stream where getUserMedia + play() "succeed" but no frames ever arrive
  // (readyState=0, videoWidth=0) — a black viewfinder. A single manual restart
  // a few seconds later fixes it, because by then the app is calm.
  //
  // So this one effect is the ONLY thing that starts/stops the camera. It:
  //   1. waits for the lifecycle to be QUIET (no churn for `quietMs`),
  //   2. starts the camera exactly once,
  //   3. verifies real frames flow; if still black, does ONE serialized restart
  //      (bounded), each preceded by another quiet-settle.
  // No other timers, retry loops, or listeners race it.
  useEffect(() => {
    if (!autoStart || disabled) return;

    let cancelled = false;
    let quietTimer = 0;
    let verifyTimer = 0;
    let busy = false; // a start/restart sequence is in flight
    let attempts = 0;
    const maxAttempts = 6;
    const quietMs = 900; // lifecycle must be silent this long before we start

    const log = (m: string) => {
      if (process.env.NODE_ENV !== "production") console.log(`[scanner] ${m}`);
    };

    const isPainting = () => {
      const v = document.querySelector<HTMLVideoElement>(`#${scannerElementId} video`);
      const track = (v?.srcObject as MediaStream | null)?.getVideoTracks?.()[0];
      return !!v && !v.paused && v.readyState >= 2 && v.videoWidth > 0 && track?.muted === false;
    };

    // (Re)start the camera once, then verify frames actually flow.
    const startOnceAndVerify = async () => {
      if (cancelled || busy) return;
      if (document.visibilityState !== "visible") return;
      if (isScanningRef.current && isPainting()) return; // already healthy
      if (attempts >= maxAttempts) {
        log("giving up auto-start; tap fallback owns it");
        setAutoStartAttempted(true);
        return;
      }
      busy = true;
      attempts += 1;
      log(`start sequence #${attempts}`);

      await stopScanner();
      if (cancelled) { busy = false; return; }
      await startScanner();
      setAutoStartAttempted(true);
      busy = false;

      // Give the pipeline up to ~2.5s to deliver frames; if still black, the
      // app likely wasn't fully ready — settle again and retry once.
      window.clearTimeout(verifyTimer);
      verifyTimer = window.setTimeout(() => {
        if (cancelled) return;
        if (document.visibilityState !== "visible") return;
        if (isScanningRef.current && !isPainting()) {
          log("still black after start -> scheduling another settle+restart");
          scheduleStart();
        }
      }, 2500);
    };

    // Wait for the lifecycle to be quiet for `quietMs`, then start once.
    const scheduleStart = () => {
      window.clearTimeout(quietTimer);
      quietTimer = window.setTimeout(() => {
        void startOnceAndVerify();
      }, quietMs);
    };

    // Any lifecycle event resets the quiet timer (so we only start once calm).
    const onLifecycle = (label: string) => {
      log(`lifecycle: ${label} (visibility=${document.visibilityState})`);
      if (document.visibilityState === "visible") {
        // If the camera is already painting, a transient event shouldn't disturb
        // it. Otherwise, (re)arm the settle timer.
        if (!(isScanningRef.current && isPainting())) scheduleStart();
      } else {
        // Truly hidden: stop after a grace period so a launch blip doesn't kill
        // a healthy camera.
        window.clearTimeout(quietTimer);
        window.clearTimeout(verifyTimer);
        window.setTimeout(() => {
          if (cancelled) return;
          if (document.visibilityState !== "visible") {
            log("confirmed hidden -> stopping camera");
            void stopScanner();
          }
        }, 700);
      }
    };

    const onVis = () => onLifecycle("visibilitychange");
    document.addEventListener("visibilitychange", onVis);

    // Watchdog also lets the muted-track watcher request a restart.
    requestRestartRef.current = () => {
      if (!cancelled && document.visibilityState === "visible") scheduleStart();
    };

    // Kick off the first settle.
    scheduleStart();

    return () => {
      cancelled = true;
      window.clearTimeout(quietTimer);
      window.clearTimeout(verifyTimer);
      requestRestartRef.current = () => {};
      document.removeEventListener("visibilitychange", onVis);
      void stopScanner();
    };
  }, [autoStart, disabled, startScanner, stopScanner]);

  const showBlockedOverlay = errorKind === "blocked";
  // Fallback tap target for the iOS first-launch gesture requirement. Only
  // appears after the automatic attempt has failed to get the camera running,
  // and disappears for good once scanning starts (i.e. after permission is
  // granted), so returning users never see it.
  const showTapToStartOverlay =
    hideControls &&
    autoStartAttempted &&
    !isStarting &&
    !isScanning &&
    errorKind !== "blocked";

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
                  onClick={() => void startScanner(true)}
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

        {/* First-launch tap target — satisfies the iOS WKWebView rule that the
            very first camera request must come from a user gesture. Shown only
            after an automatic attempt failed to start the stream, and never
            again once permission has been granted. */}
        {showTapToStartOverlay ? (
          <button
            type="button"
            onClick={() => void startScanner(true)}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-[#1a2617]/35 text-white backdrop-blur-[2px]"
            aria-label={t("scan_tap_camera", lang)}
          >
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white/16 shadow-[0_8px_26px_rgba(0,0,0,0.22)] ring-1 ring-white/25">
              {isStarting ? <Spinner size={22} /> : <Camera className="h-8 w-8" />}
            </span>
            <span className="rounded-full bg-white/14 px-5 py-2.5 text-[14px] font-black tracking-wide shadow-[0_8px_26px_rgba(0,0,0,0.18)] backdrop-blur-md">
              {t("scan_tap_camera", lang)}
            </span>
          </button>
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
            onClick={() => void startScanner(true)}
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
