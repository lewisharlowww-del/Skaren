import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";

/**
 * Bridge to the native iOS barcode scanner plugin (NativeBarcodeScanner.swift).
 *
 * On iOS this uses Apple's hardware AVCaptureMetadataOutput for instant,
 * native-speed barcode detection (the same engine as the system Camera app),
 * rendering the camera behind a transparent WKWebView so our custom viewfinder
 * overlay still shows on top.
 *
 * On web / Android the plugin is unavailable, so callers fall back to the
 * html5-qrcode JS scanner.
 */
export interface NativeBarcodePlugin {
  isSupported(): Promise<{ supported: boolean }>;
  checkPermission(): Promise<{ granted: boolean; status: string }>;
  requestPermission(): Promise<{ granted: boolean; status: string }>;
  startScan(): Promise<void>;
  stopScan(): Promise<void>;
  addListener(
    eventName: "barcodeScanned",
    listenerFunc: (data: { barcode: string; format: string }) => void
  ): Promise<PluginListenerHandle>;
  removeAllListeners(): Promise<void>;
}

const NativeBarcode = registerPlugin<NativeBarcodePlugin>("NativeBarcode");

/**
 * Whether the native scanner is available on this platform. Only true inside
 * the native iOS app where the Swift plugin is registered.
 */
export function isNativeScannerAvailable(): boolean {
  return Capacitor.getPlatform() === "ios" && Capacitor.isPluginAvailable("NativeBarcode");
}

export { NativeBarcode };
