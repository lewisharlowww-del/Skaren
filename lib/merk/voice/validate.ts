/**
 * Merk voice engine · the validator (section 6, enforcement)
 *
 * The prompt is guidance. This is enforcement. Run it on every response,
 * server-side, before the text ever reaches a phone. On failure the caller
 * retries once at a lower temperature; on a second failure it falls back to the
 * template line and logs the brief. Never show unvalidated text, and never show
 * an error — Merk always says something.
 */

import type { ProductBrief } from "@/lib/merk/voice/brief";
import { numbersInBrief } from "@/lib/merk/voice/brief";
import type { MerkCopy } from "@/lib/merk/voice/copy";
import { SLOT_LIMITS } from "@/lib/merk/voice/copy";

const BANNED_TERMS = [
  "dangerous", "toxic", "harmful", "avoid", "unhealthy", "should not",
  "cancer", "disease", "diet", "weight loss", "detox",
  "farlig", "giftig", "usunn", "unng\u00e5", "slanke",
];

const BANNED = new RegExp(BANNED_TERMS.map((w) => "\\b" + w + "\\b").join("|"), "i");

// Exclamation is a hard no. Emoji is detected separately by codepoint so we
// avoid the /u regex flag (unavailable when targeting es5).
const EXCLAMATION = /!/;

function hasEmoji(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const code = text.codePointAt(i);
    if (code == null) continue;
    // Misc symbols + dingbats, and the astral pictographic blocks.
    if (code >= 0x2600 && code <= 0x27bf) return true;
    if (code >= 0x1f300 && code <= 0x1faff) return true;
    if (code > 0xffff) i++; // skip the low surrogate of an astral pair
  }
  return false;
}

// Comparison words that MUST carry their category to avoid a misleading claim.
const COMPARISON =
  /\b(more|less|higher|lower|highest|lowest|saltiest|most|least|best|worst|mest|minst|mer|mindre|h\u00f8yere|lavere)\b/i;

export type Validation =
  | { ok: true; copy: MerkCopy }
  | { ok: false; reason: string; detail?: string };

const fail = (reason: string, detail?: string): Validation => ({ ok: false, reason, detail });
const ok = (copy: MerkCopy): Validation => ({ ok: true, copy });

/** Pull every number-looking token out of a string, normalised so "2,1" and
 *  "2.1" compare equal and a trailing unit does not stick. */
export function numbersIn(text: string): string[] {
  const matches = text.match(/\d+(?:[.,]\d+)?/g) ?? [];
  return matches.map((m) => m.replace(",", "."));
}

// Does the text name the product's category (the bucket, de-slugged) or a
// generic shelf phrase? A comparison is allowed only when it does.
function mentionsCategory(text: string, brief: ProductBrief): boolean {
  const lower = text.toLowerCase();
  if (/\b(shelf|hylle|category|kategori|here|her)\b/.test(lower)) return true;
  const words = brief.category
    .replace(/^cat:/, "")
    .split(/[-\s]+/)
    .filter((w) => w.length >= 3);
  return words.some((w) => lower.includes(w.toLowerCase()));
}

/**
 * Validate one response against its brief. Shape is guaranteed by the caller's
 * JSON schema; this enforces tone, length, numeric honesty, and comparisons.
 */
export function validate(copy: MerkCopy, brief: ProductBrief): Validation {
  const text = [copy.headline, copy.verdict, copy.additiveNote, copy.wouldMerkBuy]
    .filter(Boolean)
    .join(" ");

  if (BANNED.test(text)) return fail("banned-term");
  if (EXCLAMATION.test(text) || hasEmoji(text)) return fail("tone");

  // Length is enforced here, not in the schema (strict schema rejects maxLength).
  for (const [slot, max] of Object.entries(SLOT_LIMITS)) {
    const value = (copy as Record<string, string | null>)[slot];
    if (value && value.length > max) return fail("too-long", slot);
  }

  // Every number in the output must exist in the brief.
  const allowed = numbersInBrief(brief);
  for (const n of numbersIn(text)) {
    // Accept "100 g" and "per 100 g" boilerplate; 100 is a fixed reference.
    if (n === "100") continue;
    if (!allowed.has(n)) return fail("hallucinated-number", n);
  }

  // A comparison must carry its category.
  if (COMPARISON.test(text) && !mentionsCategory(text, brief)) {
    return fail("bare-comparison");
  }

  return ok(copy);
}
