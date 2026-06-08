"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ScanLine, X } from "lucide-react";
import { Spinner } from "@/components/Spinner";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { vibrate } from "@/lib/haptics";

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

export function BarcodeScanner({ disabled = false, autoStart = false, hideControls = false, onDetected }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const detectedRef = useRef(false);
  const autoStartedRef = useRef(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");

  async function stopScanner() {
    const scanner = scannerRef.current;

    if (scanner?.isScanning) {
      await scanner.stop();
    }

    scanner?.clear();
    scannerRef.current = null;
    setIsScanning(false);
    setIsStarting(false);
  }

  async function startScanner() {
    if (disabled || isStarting || isScanning) return;

    setCameraError("");
    setIsStarting(true);
    detectedRef.current = false;
    vibrate(18);

    try {
      const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
      const isSecureCameraContext = window.isSecureContext || isLocalhost;

      if (!isSecureCameraContext) {
        throw new Error("Camera scanning needs HTTPS on phones. Use manual barcode entry here, or test camera scanning from a secure preview link.");
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera scanning is not available in this browser. You can still enter the barcode manually.");
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

      setIsScanning(true);
    } catch (caught) {
      scannerRef.current?.clear();
      scannerRef.current = null;
      setIsScanning(false);

      const message = caught instanceof Error ? caught.message : "";
      const permissionDenied = message.toLowerCase().includes("permission") || message.toLowerCase().includes("notallowed");
      const needsHttps = message.toLowerCase().includes("https") || message.toLowerCase().includes("secure");

      setCameraError(
        needsHttps
          ? "Camera scanning needs HTTPS on phones. Manual barcode entry works here, or use a secure preview link for camera testing."
          : permissionDenied
          ? "Camera permission was blocked. Allow camera access in your browser settings or enter the barcode manually."
          : "We could not open the camera. Try better lighting, switch browsers, or enter the barcode manually."
      );
    } finally {
      setIsStarting(false);
    }
  }

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, []);

  useEffect(() => {
    if (!autoStart || disabled || autoStartedRef.current) return;

    autoStartedRef.current = true;
    const timer = window.setTimeout(() => {
      void startScanner();
    }, 350);

    return () => window.clearTimeout(timer);
    // startScanner reads the latest component state; this effect should only run once for auto-start.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, disabled]);

  return (
    <div className={hideControls ? "h-full w-full" : "space-y-3"}>
      {/* Force the library's injected video to fill and cover the container */}
      {hideControls && (
        <style>{`#${scannerElementId} { position: relative; } #${scannerElementId} video { object-fit: cover !important; width: 100% !important; height: 100% !important; }`}</style>
      )}
      <div className={`relative bg-black ${hideControls ? "h-full w-full" : "overflow-hidden rounded-[2rem] bg-lime-50"}`}>
        <div id={scannerElementId} className={`${hideControls ? "h-full w-full" : "min-h-56 w-full"} ${isScanning ? "bg-black" : ""}`} />

        {!hideControls && !isScanning ? (
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
            onClick={startScanner}
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

      {!hideControls && cameraError ? <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">{cameraError}</p> : null}
    </div>
  );
}
