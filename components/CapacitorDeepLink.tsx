"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Handles OAuth deep links on iOS (no.skaren.app://).
 *
 * Supports both flows:
 *  - Implicit: tokens in hash fragment (#access_token=...&refresh_token=...)
 *  - PKCE:     code in query params (?code=...)
 *
 * browserFinished is kept as a fallback ONLY — if appUrlOpen already
 * navigated, we skip it to prevent the double-load bug.
 */
export function CapacitorDeepLink() {
  // Tracks whether appUrlOpen already handled this OAuth session.
  // Prevents browserFinished from triggering a second navigation.
  const navigatedRef = useRef(false);

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
              console.log("[DeepLink] session OK → /account");
              document.cookie = "sb-skaren-auth-token=true; path=/; max-age=604800; SameSite=Lax";
              navigatedRef.current = true;
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
              console.log("[DeepLink] session OK → /account");
              document.cookie = "sb-skaren-auth-token=true; path=/; max-age=604800; SameSite=Lax";
              navigatedRef.current = true;
              window.location.replace("/account");
            }
          }
        }
      }

      // Primary: custom URL scheme deep link
      const urlHandle = await App.addListener("appUrlOpen", ({ url }) => {
        console.log("[DeepLink] appUrlOpen:", url.slice(0, 80));
        if (!url.startsWith("no.skaren.app://")) return;
        void handleCallback(url);
      });
      cleanups.push(() => urlHandle.remove());

      // Fallback: only if appUrlOpen did NOT already handle this session.
      // Handles edge cases where the deep link fires after the browser closes.
      const browserHandle = await Browser.addListener(
        "browserFinished",
        async () => {
          console.log("[DeepLink] browserFinished (navigated already:", navigatedRef.current, ")");
          if (navigatedRef.current) {
            navigatedRef.current = false; // reset for next sign-in
            return;
          }
          if (!supabase) return;
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            console.log("[DeepLink] fallback — session found → /account");
            document.cookie =
              "sb-skaren-auth-token=true; path=/; max-age=604800; SameSite=Lax";
            window.location.replace("/account");
          }
        }
      );
      cleanups.push(() => browserHandle.remove());
    }

    void setup();
    return () => cleanups.forEach((fn) => fn());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
