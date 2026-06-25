import type { SupabaseClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { checkPremiumStatus, initRevenueCat } from "@/lib/revenuecat";

/**
 * Checks the current user's premium status from the Supabase `profiles` table.
 * Returns false if the user is not signed in, has no profile row, or on any error.
 */
export async function getUserPremiumStatus(supabase: SupabaseClient): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;

      await initRevenueCat(user.id);
      const rcPremium = await checkPremiumStatus();
      if (rcPremium) return true;

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
      data: { user },
    } = await supabase.auth.getUser();
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
