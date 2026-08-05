import { createClient } from "@supabase/supabase-js";
import type { MerkVerdict, ProductInsight } from "@/lib/types";

// Merk's verdict is language-specific, so we cache one verdict per language
// under a single product row rather than a flat value.
type MerkVerdictByLang = Partial<Record<"no" | "en", MerkVerdict>>;

type CachedAiAnalysis = {
  aiSummary: Array<string | ProductInsight>;
  merkVerdict: MerkVerdictByLang;
  aiCachedAt: string;
};

type ProductCacheRow = {
  barcode: string;
  ai_summary: unknown;
  ai_merk_verdict: unknown;
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

function isProductInsight(value: unknown): value is ProductInsight {
  if (!value || typeof value !== "object") return false;
  const insight = value as { type?: unknown; text?: unknown };
  return (
    (insight.type === "positive" || insight.type === "warning" || insight.type === "info") &&
    typeof insight.text === "string"
  );
}

function isInsightArray(value: unknown): value is Array<string | ProductInsight> {
  return Array.isArray(value) && value.every((item) => typeof item === "string" || isProductInsight(item));
}

const MERK_FACE_VALUES = new Set([
  "happy", "curious", "surprised", "unsure", "confident",
  "celebration", "concern", "thinking", "scanning",
]);

function isMerkVerdict(value: unknown): value is MerkVerdict {
  if (!value || typeof value !== "object") return false;
  const v = value as { expression?: unknown; headline?: unknown; text?: unknown };
  return (
    typeof v.expression === "string" && MERK_FACE_VALUES.has(v.expression) &&
    typeof v.headline === "string" && v.headline.trim().length > 0 &&
    typeof v.text === "string" && v.text.trim().length > 0
  );
}

// Coerce whatever JSON is in the row into a clean per-language verdict map,
// dropping anything malformed so a bad cache row can never crash a scan.
function parseVerdictMap(value: unknown): MerkVerdictByLang {
  if (!value || typeof value !== "object") return {};
  const out: MerkVerdictByLang = {};
  for (const lang of ["no", "en"] as const) {
    const candidate = (value as Record<string, unknown>)[lang];
    if (isMerkVerdict(candidate)) {
      out[lang] = { ...candidate, source: "ai" };
    }
  }
  return out;
}

export async function getCachedAiAnalysis(barcode: string): Promise<CachedAiAnalysis | null> {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("product_cache")
    .select("barcode, ai_summary, ai_merk_verdict, ai_cached_at")
    .eq("barcode", barcode)
    .maybeSingle<ProductCacheRow>();

  if (error || !data?.ai_cached_at) return null;

  const cachedAt = new Date(data.ai_cached_at).getTime();
  if (!Number.isFinite(cachedAt) || Date.now() - cachedAt > maxCacheAgeMs) return null;

  const aiSummary = isInsightArray(data.ai_summary) ? data.ai_summary : [];
  const merkVerdict = parseVerdictMap(data.ai_merk_verdict);

  // Nothing usable cached — treat as a miss so a premium scan regenerates.
  if (aiSummary.length === 0 && Object.keys(merkVerdict).length === 0) return null;

  return {
    aiSummary,
    merkVerdict,
    aiCachedAt: data.ai_cached_at
  };
}

export async function saveCachedAiAnalysis({
  barcode,
  aiSummary,
  merkVerdict
}: {
  barcode: string;
  aiSummary: Array<string | ProductInsight>;
  merkVerdict?: MerkVerdictByLang;
}) {
  const supabase = getServerSupabase();
  if (!supabase) return;

  await supabase
    .from("product_cache")
    .upsert(
      {
        barcode,
        ai_summary: aiSummary,
        ai_merk_verdict: merkVerdict ?? {},
        ai_cached_at: new Date().toISOString()
      },
      { onConflict: "barcode" }
    );
}
