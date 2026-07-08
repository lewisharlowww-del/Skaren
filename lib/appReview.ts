import { Capacitor } from "@capacitor/core";

/**
 * Native in-app rating prompt (App Store / Play Store).
 *
 * ASO note: rating *volume* and *velocity* directly influence store ranking and
 * conversion. Apple's SKStoreReviewController (wrapped by this plugin) shows a
 * throttled system dialog — Apple decides whether to actually display it and
 * caps it to ~3 times per year per user. So our job is only to *ask at a good
 * moment*: after the user has had a clearly positive experience (a few
 * successful scans), never on first launch, and never more than once per app
 * version.
 */

const SCAN_COUNT_KEY = "skaren:scan-count";
const LAST_PROMPT_VERSION_KEY = "skaren:review-prompted-version";
// Ask after this many successful scans. Early enough to catch engaged users,
// late enough that they've seen real value.
const SCANS_BEFORE_PROMPT = 3;

function appVersion(): string {
  // Bump this when you want to allow re-prompting on a major release.
  return "1";
}

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode / SSR) — non-fatal */
  }
}

/**
 * Call once after each *successful* scan/product view. When the user crosses
 * the scan threshold for the first time on this app version, it requests the
 * native review dialog. Safe to call on web (no-op) and safe to call often.
 */
export async function recordScanAndMaybePromptReview(): Promise<void> {
  if (typeof window === "undefined") return;

  const count = Number(safeGet(SCAN_COUNT_KEY) ?? "0") + 1;
  safeSet(SCAN_COUNT_KEY, String(count));

  if (count < SCANS_BEFORE_PROMPT) return;

  // Only ask once per app version so we never nag.
  if (safeGet(LAST_PROMPT_VERSION_KEY) === appVersion()) return;

  await requestReview();
}

/**
 * Directly request the native review dialog. No-op on web. Marks the current
 * version as prompted so we don't ask again.
 */
export async function requestReview(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { InAppReview } = await import("@capacitor-community/in-app-review");
    await InAppReview.requestReview();
    safeSet(LAST_PROMPT_VERSION_KEY, appVersion());
  } catch (error) {
    // Plugin missing or the OS declined — never surface this to the user.
    console.warn("[Review] requestReview failed:", error);
  }
}
