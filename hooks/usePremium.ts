"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  getCachedPremiumStatus,
  getUserPremiumStatus,
  hasCachedPremiumStatus
} from "@/lib/premium";

interface UsePremiumResult {
  /** Best-known premium status. Starts from the on-device cache (instant). */
  isPremium: boolean;
  /**
   * True until the first live verification for this mount completes. UIs that
   * want to avoid any flicker can render from `isPremium` immediately and ignore
   * this; gated screens that must not briefly grant/deny access can wait on it.
   */
  checking: boolean;
  /** True once a premium decision has been cached on-device at least once. */
  hasCachedStatus: boolean;
  /** Force a fresh live verification (e.g. after a server 403). */
  refresh: () => Promise<boolean>;
}

/**
 * Premium status with zero launch flicker.
 *
 * Reads the last-known status from localStorage synchronously so a returning Pro
 * user sees Pro immediately, then verifies against RevenueCat/Supabase in the
 * background and reconciles. Also re-checks on auth changes and when the app
 * returns to the foreground (subscriptions can change while backgrounded).
 */
export function usePremium(): UsePremiumResult {
  const [isPremium, setIsPremium] = useState<boolean>(getCachedPremiumStatus);
  const cachedOnceRef = useRef<boolean>(hasCachedPremiumStatus());
  // If we already have a cached decision, don't block gated screens on a live
  // re-check — trust the cache and revalidate quietly. Only the very first ever
  // check (no cache) sets checking=true.
  const [checking, setChecking] = useState(!cachedOnceRef.current);
  const activeRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!supabase) {
      if (activeRef.current) setChecking(false);
      return false;
    }
    try {
      const premium = await getUserPremiumStatus(supabase);
      if (activeRef.current) setIsPremium(premium);
      return premium;
    } finally {
      if (activeRef.current) setChecking(false);
    }
  }, []);

  useEffect(() => {
    activeRef.current = true;

    void refresh();

    const listener = supabase?.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setIsPremium(false);
        return;
      }
      void refresh();
    });

    // Subscriptions can start/expire while the app is backgrounded, so re-verify
    // whenever it returns to the foreground.
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      activeRef.current = false;
      listener?.data.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  return { isPremium, checking, hasCachedStatus: cachedOnceRef.current, refresh };
}
