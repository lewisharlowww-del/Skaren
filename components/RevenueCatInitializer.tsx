"use client";

import { useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { initRevenueCat } from "@/lib/revenuecat";

export function RevenueCatInitializer() {
  const { user, loading } = useUser();

  useEffect(() => {
    if (loading || !user) return;

    void initRevenueCat(user.id).catch((error) => {
      console.warn("[RevenueCat] Initialization failed:", error);
    });
  }, [loading, user]);

  return null;
}
