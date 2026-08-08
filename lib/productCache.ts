import { createClient } from "@supabase/supabase-js";
import { MERK_VERDICT_VERSION } from "@/lib/openai";
import { MERK_VOICE_VERSION } from "@/lib/merk/voice/prompt";
import type { MerkCopy } from "@/lib/merk/voice/copy";
import type { MerkVerdict, ProductInsight } from "@/lib/types";

// Merk's verdict is language-specific, so we cache one verdict per language
// under a single product row rather than a flat value.
type MerkVerdictByLang = Partial<Record<"no" | "en", MerkVerdict>>;

// The v1 four-slot copy, cached per language. Each entry carries the brief hash
// it was written from and the voice version, so a rescore/reformulation (new
// hash) or a prompt change (new version) invalidates it without a TTL wait.
export type MerkCopyEntry = { copy: MerkCopy; briefHash: string; v: number };
type MerkCopyByLang = Partial<Record<"no" | "en", MerkCopyEntry>>;

type CachedAiAnalysis = {
  aiSummary: Array<string | ProductInsight>;
  merkVerdict: MerkVerdictByLang;
  merkCopy: MerkCopyByLang;
  aiCachedAt: string;
};

type ProductCacheRow = {
  barcode: string;
  ai_summary: unknown;
  ai_merk_verdict: unknown;
  ai_merk_copy: unknown;
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
  const v = value as { expression?: unknown; headline?: unknown; text?: unknown; v?: unknown };
  return (
    typeof v.expression === "string" && MERK_FACE_VALUES.has(v.expression) &&
    typeof v.headline === "string" && v.headline.trim().length > 0 &&
    typeof v.text === "string" && v.text.trim().length > 0 &&
    // Only accept verdicts authored by the current prompt version. Older ones
    // (e.g. v1, which recited nutrition numbers) are treated as a cache miss so
    // a fresh scan regenerates them in the new voice.
    v.v === MERK_VERDICT_VERSION
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

// A cached four-slot copy entry is only usable if it is well-formed AND authored
// by the current voice version. The brief-hash freshness check happens at read
// time in the scan route, where the current brief is known.
function isMerkCopyEntry(value: unknown): value is MerkCopyEntry {
  if (!value || typeof value !== "object") return false;
  const e = value as { copy?: unknown; briefHash?: unknown; v?: unknown };
  if (typeof e.briefHash !== "string" || e.v !== MERK_VOICE_VERSION) return false;
  const c = e.copy as Record<string, unknown> | undefined;
  if (!c || typeof c !== "object") return false;
  return (
    typeof c.headline === "string" && c.headline.trim().length > 0 &&
    typeof c.verdict === "string" && c.verdict.trim().length > 0 &&
    (c.additiveNote === null || typeof c.additiveNote === "string") &&
    typeof c.wouldMerkBuy === "string" && c.wouldMerkBuy.trim().length > 0
  );
}

function parseCopyMap(value: unknown): MerkCopyByLang {
  if (!value || typeof value !== "object") return {};
  const out: MerkCopyByLang = {};
  for (const lang of ["no", "en"] as const) {
    const candidate = (value as Record<string, unknown>)[lang];
    if (isMerkCopyEntry(candidate)) out[lang] = candidate;
  }
  return out;
}

export async function getCachedAiAnalysis(barcode: string): Promise<CachedAiAnalysis | null> {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  // Select all columns rather than naming ai_merk_copy explicitly: the column
  // may not exist yet on deployments where the migration hasn't run, and a
  // named-but-missing column makes the whole query 400. Reading it off the row
  // defensively degrades to "no copy cached" instead of failing the scan.
  const { data, error } = await supabase
    .from("product_cache")
    .select("*")
    .eq("barcode", barcode)
    .maybeSingle<ProductCacheRow>();

  if (error || !data?.ai_cached_at) return null;

  const cachedAt = new Date(data.ai_cached_at).getTime();
  if (!Number.isFinite(cachedAt) || Date.now() - cachedAt > maxCacheAgeMs) return null;

  const aiSummary = isInsightArray(data.ai_summary) ? data.ai_summary : [];
  const merkVerdict = parseVerdictMap(data.ai_merk_verdict);
  const merkCopy = parseCopyMap((data as { ai_merk_copy?: unknown }).ai_merk_copy);

  // Nothing usable cached — treat as a miss so a premium scan regenerates.
  if (
    aiSummary.length === 0 &&
    Object.keys(merkVerdict).length === 0 &&
    Object.keys(merkCopy).length === 0
  ) {
    return null;
  }

  return {
    aiSummary,
    merkVerdict,
    merkCopy,
    aiCachedAt: data.ai_cached_at
  };
}

export async function saveCachedAiAnalysis({
  barcode,
  aiSummary,
  merkVerdict,
  merkCopy
}: {
  barcode: string;
  aiSummary: Array<string | ProductInsight>;
  merkVerdict?: MerkVerdictByLang;
  merkCopy?: MerkCopyByLang;
}) {
  const supabase = getServerSupabase();
  if (!supabase) return;

  const row: Record<string, unknown> = {
    barcode,
    ai_summary: aiSummary,
    ai_merk_verdict: merkVerdict ?? {},
    ai_cached_at: new Date().toISOString()
  };
  // Only write ai_merk_copy when we have something, so deployments without the
  // column (pre-migration) still succeed on the other fields.
  if (merkCopy && Object.keys(merkCopy).length > 0) row.ai_merk_copy = merkCopy;

  const { error } = await supabase
    .from("product_cache")
    .upsert(row, { onConflict: "barcode" });

  // If the column is missing (migration not yet run), retry without it so the
  // verdict/summary still cache. The four-slot copy will simply regenerate next
  // scan until the migration lands.
  if (error && /ai_merk_copy/.test(error.message)) {
    delete row.ai_merk_copy;
    await supabase.from("product_cache").upsert(row, { onConflict: "barcode" });
  }
}
