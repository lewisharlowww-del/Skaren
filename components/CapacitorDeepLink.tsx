"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Handles OAuth deep links on iOS (no.skaren.app://) and exchanges
 * the PKCE code for a session directly — no page navigation needed.
 *
 * Flow:
 *  1. Browser.open() → Safari View Controller
 *  2. OAuth completes → redirects to no.skaren.app://auth/callback?code=XXXX
 *  3. iOS closes SVC, fires appUrlOpen
 *  4. We call exchangeCodeForSession(code) — PKCE verifier is in localStorage
 *  5. On success, navigate to /account
 *
 * browserFinished fires as a safety net in case the redirect fires
 * before this listener is ready, or if the user signs in on a second attempt.
 */
export function CapacitorDeepLink() {
  const router = useRouter();

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    async function setup() {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      const { App } = await import("@capacitor/app");
      const { Browser } = await import("@capacitor/browser");

      async function handleCode(code: string) {
        if (!supabase) return;
        console.log("[DeepLink] exchanging code…");
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("[DeepLink] exchange error:", error.message);
          return;
        }
        if (data.session) {
          console.log("[DeepLink] session OK, navigating to /account");
          document.cookie =
            "sb-skaren-auth-token=true; path=/; max-age=604800; SameSite=Lax";
          router.replace("/account");
        }
      }

      // Primary: custom URL scheme deep link carries the PKCE code
      const urlHandle = await App.addListener("appUrlOpen", ({ url }) => {
        console.log("[DeepLink] appUrlOpen:", url);
        if (!url.startsWith("no.skaren.app://")) return;
        const params = new URLSearchParams(url.slice(url.indexOf("?") + 1));
        const code = params.get("code");
        if (code) void handleCode(code);
      });
      cleanups.push(() => urlHandle.remove());

      // Fallback: if browser closes and a session already exists, navigate
      const browserHandle = await Browser.addListener(
        "browserFinished",
        async () => {
          console.log("[DeepLink] browserFinished");
          if (!supabase) return;
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            console.log("[DeepLink] session exists after browser close");
            document.cookie =
              "sb-skaren-auth-token=true; path=/; max-age=604800; SameSite=Lax";
            router.replace("/account");
          }
        }
      );
      cleanups.push(() => browserHandle.remove());
    }

    void setup();
    return () => cleanups.forEach((fn) => fn());
  }, [router]);

  return null;
}
