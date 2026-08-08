/**
 * Merk voice engine · brief-hash caching (section 7)
 *
 * A product's facts change perhaps twice a year, so its copy should be
 * generated about that often, not on every scan. The cache key is a stable hash
 * of the brief plus the language: same brief, same language → serve the stored
 * text, zero calls. Invalidate only when the brief hash changes — a
 * reformulation, a new category median, a rescore. Nothing else.
 */

import { createHash } from "crypto";
import type { ProductBrief } from "@/lib/merk/voice/brief";
import { MERK_VOICE_VERSION } from "@/lib/merk/voice/prompt";

// A canonical, order-stable serialisation of the brief. Object key order does
// not change the hash; only the facts do.
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) out[key] = canonical(obj[key]);
    return out;
  }
  return value;
}

/**
 * Stable cache key for one brief in one language. Includes the voice version so
 * a prompt or few-shot change (a "logo" change) invalidates every cached line.
 */
export function briefCacheKey(brief: ProductBrief, language: "en" | "nb"): string {
  const payload = JSON.stringify(canonical(brief));
  const hash = createHash("sha256").update(payload).digest("hex").slice(0, 16);
  return `merk:v${MERK_VOICE_VERSION}:${language}:${hash}`;
}
