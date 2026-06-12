"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Handles OAuth deep links on iOS (no.skaren.app://).
 *
 * After the OAuth redirect fires appUrlOpen, we:
 *  1. Set the Supabase session from the tokens in the URL
 *  2. Close the SFSafariViewController (Browser.close) — without this
 *     it stays open showing a blank page because it can't render a
 *     custom URL scheme
 *  3. Navigate the underlying WebView to /account
 */
export function CapacitorDeepLink() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    async function setup() {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      const { App } = await import("@capacitor/app");
      const { Browser } = await import("@capacitor/browser");

      async function handleCallback(url: string) {
        if (!supabase) return;

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
              await Browser.close(); // dismiss the SFSafariViewController overlay
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
