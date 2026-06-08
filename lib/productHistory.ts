import { toScanPayload } from "@/lib/openfoodfacts";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { ProductResult } from "@/lib/types";

const searchHistoryPrefix = "skaren:search-history:";

export function markSearchProductForHistory(barcode: string) {
  window.sessionStorage.setItem(
    `${searchHistoryPrefix}${barcode}`,
    new Date().toISOString()
  );
}

export function consumeSearchProductHistoryMarker(barcode: string) {
  const key = `${searchHistoryPrefix}${barcode}`;
  const marker = window.sessionStorage.getItem(key);
  if (marker) window.sessionStorage.removeItem(key);
  return Boolean(marker);
}

function toLegacyScanPayload(payload: ReturnType<typeof toScanPayload>) {
  // Only strip the grade columns that may not exist on older DB schemas.
  // Additive count columns are now present and should always be saved.
  const { skaren_grade, health_grade, environmental_grade, ...legacyPayload } = payload;
  return legacyPayload;
}

export async function saveProductToHistory(product: ProductResult) {
  if (!isSupabaseConfigured || !supabase) return false;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;

  const payload = toScanPayload(product, userData.user.id);

  // Insert the new scan record
  const { error } = await supabase.from("scans").insert(payload);
  if (error) {
    const { error: legacyError } = await supabase
      .from("scans")
      .insert(toLegacyScanPayload(payload));

    if (legacyError) {
      console.error("[History] Product view could not be saved:", legacyError);
      return false;
    }
  }

  // Sync health_grade on any previous scan records for this product that have
  // a stale grade (e.g. saved before the scoring formula was updated).
  if (payload.health_grade) {
    await supabase
      .from("scans")
      .update({
        health_grade: payload.health_grade,
        additives_total: payload.additives_total,
        additives_to_avoid: payload.additives_to_avoid,
        additives_moderate: payload.additives_moderate,
      })
      .eq("user_id", userData.user.id)
      .eq("barcode", payload.barcode)
      .neq("health_grade", payload.health_grade);
  }

  return true;
}
