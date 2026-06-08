import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Checks the current user's premium status from the Supabase `profiles` table.
 * Returns false if the user is not signed in, has no profile row, or on any error.
 */
export async function getUserPremiumStatus(supabase: SupabaseClient): Promise<boolean> {
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
