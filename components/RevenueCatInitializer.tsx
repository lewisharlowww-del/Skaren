"use client";

import { useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { configurePurchases, initRevenueCat } from "@/lib/revenuecat";

export function RevenueCatInitializer() {
  const { user, loading } = useUser();

  // Configure the RevenueCat SDK as early as possible, before we even know the
  // user. This warms the native connection so the first premium check resolves
  // quickly instead of paying configure + logIn latency inline.
  useEffect(() => {
    void configurePurchases().catch((error) => {
      console.warn("[RevenueCat] Early configure failed:", error);
    });
  }, []);

  useEffect(() => {
    if (loading || !user) return;

    void initRevenueCat(user.id).catch((error) => {
      console.warn("[RevenueCat] Initialization failed:", error);
    });
  }, [loading, user]);

  return null;
}
