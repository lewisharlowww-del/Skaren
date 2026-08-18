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

// Absence talk (§13). The verdict and the buy note must never speak about
// missing data or deflect the reader to check it themselves — a missing figure
// belongs to the coverage line the UI renders under the score, not to Merk.
const ABSENCE_TALK =
  /\b(not listed|no data|missing|isn'?t listed|check it yourself|see for yourself|can'?t say|cannot say|mangler|ikke oppgitt|ikke listet|sjekk selv|se selv)\b/i;

// Stock closing line (audit D7). "…there's one with less salt" appeared on ~30
// of 50 cards — a template pretending to be a sentence. A recommendation that
// resolves to the same stock deflection every time is a validator failure, not
// a style choice: name the actual product or say nothing.
const STOCK_CLOSER =
  /there'?s one with (less|lower|more)|det finnes en med (mindre|lavere|mer)|there'?s a (better|less salty) one|se en (bedre|mildere)/i;

// The §13 overlap ceiling. Above this, the verdict and buy note are telling the
// same story — the separation contract is broken and the pair must be retried.
export const MAX_SLOT_OVERLAP = 0.4;

/** Content-word Jaccard overlap between two strings (§13). Words of four or
 *  more letters only, so function words ("the", "with") do not inflate it. The
 *  denominator is the SMALLER set, so a short slot fully contained in a long one
 *  scores 1.0 — a restatement, however padded, is caught. */
export function slotOverlap(a: string, b: string): number {
  const words = (s: string) =>
    new Set((s.toLowerCase().match(/[a-z\u00e6\u00f8\u00e5]{4,}/gi) ?? []));
  const A = words(a);
  const B = words(b);
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const w of Array.from(A)) if (B.has(w)) shared++;
  return shared / Math.min(A.size, B.size);
}

export type Validation =
  | { ok: true; copy: MerkCopy }
  | { ok: false; reason: string; detail?: string };

const fail = (reason: string, detail?: string): Validation => ({ ok: false, reason, detail });
const ok = (copy: MerkCopy): Validation => ({ ok: true, copy });

/** Pull every number-looking token out of a string, normalised so "2,1" and
 *  "2.1" compare equal and a trailing unit does not stick. E-numbers (E250,
 *  E-250, E471a) are additive identifiers, not figures, so they are stripped
 *  first — their digits must not be mistaken for an invented number. */
export function numbersIn(text: string): string[] {
  const withoutECodes = text.replace(/\bE-?\d{3,4}[a-z]?\b/gi, " ");
  const matches = withoutECodes.match(/\d+(?:[.,]\d+)?/g) ?? [];
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

  // At most ONE number in the verdict slot (§2 "one number, allowed once").
  // The verdict is not the table read aloud; more than one figure means it is
  // reciting the panel below it.
  if (copy.verdict) {
    const verdictNumbers = numbersIn(copy.verdict).filter((n) => n !== "100");
    if (verdictNumbers.length > 1) return fail("verdict-too-many-numbers", verdictNumbers.join(","));
  }

  // Absence talk (§13). Neither the verdict nor the buy note may speak about a
  // missing figure or deflect the reader — that belongs to the coverage line.
  if (ABSENCE_TALK.test(`${copy.verdict} ${copy.wouldMerkBuy}`)) {
    return fail("absence-talk");
  }

  // Stock closing line (audit D7). The "there's one with less X" deflection is a
  // template masquerading as advice; ban it in either slot.
  if (STOCK_CLOSER.test(`${copy.verdict} ${copy.wouldMerkBuy}`)) {
    return fail("stock-closer");
  }

  // The separation contract (§13). The verdict answers "how good"; the buy note
  // answers "when". If they share too many content words they are telling the
  // same story, and the pair must be regenerated.
  if (slotOverlap(copy.verdict, copy.wouldMerkBuy) > MAX_SLOT_OVERLAP) {
    return fail("slot-overlap");
  }

  return ok(copy);
}
