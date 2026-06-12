"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

// sessionStorage keys used to deduplicate appUrlOpen events.
// Capacitor re-delivers the deep link URL to newly registered listeners
// after window.location.replace() — we skip it if we already processed
// the same URL within the last 10 seconds.
const SS_URL = "cap-dl-url";
const SS_TIME = "cap-dl-time";
const DEDUP_MS = 10_000;

function markHandled(url: string) {
  try {
    sessionStorage.setItem(SS_URL, url);
    sessionStorage.setItem(SS_TIME, Date.now().toString());
  } catch {}
}

function alreadyHandled(url: string): boolean {
  try {
    const last = sessionStorage.getItem(SS_URL);
    const t = parseInt(sessionStorage.getItem(SS_TIME) ?? "0", 10);
    return last === url && Date.now() - t < DEDUP_MS;
  } catch {
    return false;
  }
}

/**
 * Handles OAuth deep links on iOS (no.skaren.app://).
 *
 * After the OAuth redirect fires appUrlOpen:
 *  1. Deduplicate (Capacitor re-fires the same URL on newly registered listeners)
 *  2. Set the Supabase session from the tokens in the URL
 *  3. Close the SFSafariViewController overlay (Browser.close)
 *  4. Navigate the underlying WebView to /account
 */
export function CapacitorDeepLink() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    async function setup() {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      // Hide the splash screen now that the WebView has rendered its first frame.
      // Without this explicit call, Capacitor falls back to the auto-hide timeout
      // and logs a warning on every launch.
      const { SplashScreen } = await import("@capacitor/splash-screen");
      SplashScreen.hide().catch(() => {});

      const { App } = await import("@capacitor/app");
      const { Browser } = await import("@capacitor/browser");

      async function handleCallback(url: string) {
        if (!supabase) return;

        if (alreadyHandled(url)) {
          console.log("[DeepLink] duplicate URL — skipping");
          return;
        }
        markHandled(url);

        // Implicit flow: tokens in hash fragment
        const hashStart = url.indexOf("#");
        if (hashStart >= 0) {
          const hash = new URLSearchParams(url.slice(hashStart + 1));
          const accessToken = hash.get("access_token");
          const refreshToken = hash.get("refresh_token");
          if (accessToken && refreshToken) {
            console.log("[DeepLink] implicit flow — setting session");
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) { console.error("[DeepLink] setSession error:", error.message); return; }
            if (data.session) {
              console.log("[DeepLink] session OK — closing browser → /account");
              document.cookie = "sb-skaren-auth-token=true; path=/; max-age=604800; SameSite=Lax";
              await Browser.close();
              window.location.replace("/account");
            }
            return;
          }
        }

        // PKCE flow: code in query params
        const qStart = url.indexOf("?");
        if (qStart >= 0) {
          const query = new URLSearchParams(url.slice(qStart + 1));
          const code = query.get("code");
          if (code) {
            console.log("[DeepLink] PKCE flow — exchanging code");
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) { console.error("[DeepLink] exchange error:", error.message); return; }
            if (data.session) {
              console.log("[DeepLink] session OK — closing browser → /account");
              document.cookie = "sb-skaren-auth-token=true; path=/; max-age=604800; SameSite=Lax";
              await Browser.close();
              window.location.replace("/account");
            }
          }
        }
      }

      const urlHandle = await App.addListener("appUrlOpen", ({ url }) => {
        console.log("[DeepLink] appUrlOpen:", url.slice(0, 80));
        if (!url.startsWith("no.skaren.app://")) return;
        void handleCallback(url);
      });
      cleanups.push(() => urlHandle.remove());
    }

    void setup();
    return () => cleanups.forEach((fn) => fn());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
