import { supabase } from "@/lib/supabase";
import { logoutRevenueCat } from "@/lib/revenuecat";

const AUTH_COOKIE = "sb-skaren-auth-token";

/**
 * Single sign-out path for the whole app.
 *
 * Order matters: reset RevenueCat to anonymous *before* tearing down the Supabase
 * session so the previous user's entitlements stop being reported on this device,
 * then clear the Supabase session and the auth cookie.
 *
 * RevenueCat logout is best-effort and never blocks the Supabase sign-out.
 */
export async function signOutEverywhere() {
  try {
    await logoutRevenueCat();
  } catch (error) {
    console.warn("[Auth] RevenueCat logout failed during sign-out", error);
  }

  await supabase?.auth.signOut();

  if (typeof document !== "undefined") {
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
}
