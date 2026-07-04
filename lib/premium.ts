import type { SupabaseClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { checkPremiumStatus, initRevenueCat } from "@/lib/revenuecat";

// Last-known premium status, cached on-device. Reading this is instant, so the
// UI can optimistically show Pro on launch instead of flashing the free state
// for the 3-5s the live RevenueCat/Supabase check takes to resolve.
const PREMIUM_CACHE_KEY = "skaren_is_premium";

/** Reads the cached premium flag. Safe on the server (returns false). */
export function getCachedPremiumStatus(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PREMIUM_CACHE_KEY) === "true";
  } catch {
    return false;
  }
}

/** Persists the latest premium flag so the next launch can show it instantly. */
export function setCachedPremiumStatus(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREMIUM_CACHE_KEY, value ? "true" : "false");
  } catch {
    // localStorage can be unavailable (private mode / disabled). Non-fatal.
  }
}

/**
 * Checks the current user's premium status from the Supabase `profiles` table.
 * Returns false if the user is not signed in, has no profile row, or on any error.
 *
 * The result is cached on-device via {@link setCachedPremiumStatus} so callers
 * can render the last-known status immediately on the next launch.
 */
export async function getUserPremiumStatus(supabase: SupabaseClient): Promise<boolean> {
  const premium = await resolveUserPremiumStatus(supabase);
  setCachedPremiumStatus(premium);
  return premium;
}

async function resolveUserPremiumStatus(supabase: SupabaseClient): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      // Read the user from the local session (instant) instead of getUser()
      // (a blocking network round-trip) so the premium check does not stall.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return false;

      await initRevenueCat(user.id);
      const rcPremium = await checkPremiumStatus();
      if (rcPremium) {
        // Keep the server-readable profile flag in sync so API routes can
        // authorize premium-only features like product search. Fire-and-forget:
        // this write must not delay reporting the user as Pro.
        void supabase
          .from("profiles")
          .update({ is_premium: true })
          .eq("id", user.id);
        return true;
      }

      // Fall back to the Supabase is_premium flag only as a manual admin
      // override (e.g. comps/support grants set directly in the DB). The purchase
      // flow no longer writes this flag, so RevenueCat is the single source of
      // truth and premium correctly expires/transfers when a subscription ends.
      const { data } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .single();
      return Boolean((data as { is_premium?: boolean } | null)?.is_premium);
    } catch {
      return false;
    }
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return false;

    const { data, error } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .single();

    if (error || !data) return false;
    return Boolean((data as { is_premium?: boolean }).is_premium);
  } catch {
    return false;
  }
}
