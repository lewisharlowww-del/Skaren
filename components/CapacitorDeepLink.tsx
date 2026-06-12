"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Listens for custom-scheme deep links on iOS (no.skaren.app://)
 * and routes the OAuth callback into Next.js navigation.
 *
 * Also listens for browserFinished as a fallback — if the redirect URL
 * was already handled natively before appUrlOpen fires, we check for
 * an existing session and navigate to /account.
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

      // Primary: handle custom URL scheme deep link
      const urlHandle = await App.addListener("appUrlOpen", ({ url }) => {
        console.log("[DeepLink] appUrlOpen:", url);
        if (!url.startsWith("no.skaren.app://")) return;

        const qStart = url.indexOf("?");
        const search = qStart >= 0 ? url.slice(qStart) : "";
        const params = new URLSearchParams(search);
        const code = params.get("code");

        if (code) {
          router.replace(
            `/auth/callback?code=${encodeURIComponent(code)}&next=%2Faccount`
          );
        } else {
          router.replace("/auth/callback?next=%2Faccount");
        }
      });
      cleanups.push(() => urlHandle.remove());

      // Fallback: when the in-app browser closes, check if a session exists
      const browserHandle = await Browser.addListener("browserFinished", async () => {
        console.log("[DeepLink] browserFinished — checking session");
        if (!supabase) return;
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          console.log("[DeepLink] session found after browser close, navigating");
          document.cookie = "sb-skaren-auth-token=true; path=/; max-age=604800; SameSite=Lax";
          router.replace("/account");
        }
      });
      cleanups.push(() => browserHandle.remove());
    }

    void setup();

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [router]);

  return null;
}
