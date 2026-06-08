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
  const {
    skaren_grade,
    health_grade,
    environmental_grade,
    ...legacyPayload
  } = payload;
  return legacyPayload;
}

export async function saveProductToHistory(product: ProductResult) {
  if (!isSupabaseConfigured || !supabase) return false;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;

  const payload = toScanPayload(product, userData.user.id);
  const { error } = await supabase.from("scans").insert(payload);
  if (!error) return true;

  const { error: legacyError } = await supabase
    .from("scans")
    .insert(toLegacyScanPayload(payload));

  if (legacyError) {
    console.error("[History] Product view could not be saved:", legacyError);
    return false;
  }

  return true;
}
