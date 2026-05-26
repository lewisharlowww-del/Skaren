import { createClient } from "@supabase/supabase-js";

type CachedAiAnalysis = {
  aiSummary: string[];
  aiCachedAt: string;
};

type ProductCacheRow = {
  barcode: string;
  ai_summary: unknown;
  ai_cached_at: string | null;
};

const maxCacheAgeMs = 7 * 24 * 60 * 60 * 1000;

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export async function getCachedAiAnalysis(barcode: string): Promise<CachedAiAnalysis | null> {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("product_cache")
    .select("barcode, ai_summary, ai_cached_at")
    .eq("barcode", barcode)
    .maybeSingle<ProductCacheRow>();

  if (error || !data?.ai_cached_at) return null;

  const cachedAt = new Date(data.ai_cached_at).getTime();
  if (!Number.isFinite(cachedAt) || Date.now() - cachedAt > maxCacheAgeMs) return null;
  if (!isStringArray(data.ai_summary)) return null;

  return {
    aiSummary: data.ai_summary,
    aiCachedAt: data.ai_cached_at
  };
}

export async function saveCachedAiAnalysis({
  barcode,
  aiSummary
}: {
  barcode: string;
  aiSummary: string[];
}) {
  const supabase = getServerSupabase();
  if (!supabase) return;

  await supabase
    .from("product_cache")
    .upsert(
      {
        barcode,
        ai_summary: aiSummary,
        ai_cached_at: new Date().toISOString()
      },
      { onConflict: "barcode" }
    );
}
