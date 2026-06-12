"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Listens for custom-scheme deep links on iOS (no.skaren.app://)
 * and routes the OAuth callback into Next.js navigation.
 *
 * When Browser.open() completes an OAuth flow, iOS fires appUrlOpen with:
 *   no.skaren.app://auth/callback?code=XXXX&next=%2Faccount
 * We strip the custom scheme, extract the query params, and push the
 * existing /auth/callback handler which calls exchangeCodeForSession().
 */
export function CapacitorDeepLink() {
  const router = useRouter();

  useEffect(() => {
    let removeListener: (() => void) | undefined;

    async function setup() {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      const { App } = await import("@capacitor/app");

      const handle = await App.addListener("appUrlOpen", ({ url }) => {
        // Only handle our own scheme
        if (!url.startsWith("no.skaren.app://")) return;

        const qStart = url.indexOf("?");
        const search = qStart >= 0 ? url.slice(qStart) : "";
        const params = new URLSearchParams(search);

        const code = params.get("code");
        const rawNext = params.get("next") ?? "/dashboard";
        const next = rawNext.startsWith("/") && !rawNext.startsWith("//")
          ? rawNext
          : "/dashboard";

        if (code) {
          router.replace(
            `/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`
          );
        } else {
          // Fallback — session may already be set via implicit grant
          router.replace(`/auth/callback?next=${encodeURIComponent(next)}`);
        }
      });

      removeListener = () => handle.remove();
    }

    void setup();

    return () => {
      removeListener?.();
    };
  }, [router]);

  return null;
}
