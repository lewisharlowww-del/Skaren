/**
 * Merk voice engine · the template line (fallback ladder, rung 3)
 *
 * Merk must never be silent and never apologise for being slow. When the cache
 * misses and live generation does not return in time, this assembles a line
 * from the brief with no model at all. Flatter than his real voice, never
 * wrong, and indistinguishable from a terse mood.
 *
 * Build order says ship this first: it works, and it tells you whether the
 * brief holds the right facts before a single model call is made.
 */

import type { ProductBrief, BriefNutrient } from "@/lib/merk/voice/brief";
import type { MerkCopy } from "@/lib/merk/voice/copy";
import { SLOT_LIMITS } from "@/lib/merk/voice/copy";

type Lang = "en" | "nb";

const NUTRIENT_WORD: Record<Lang, Record<BriefNutrient, string>> = {
  en: { salt: "salt", satFat: "saturated fat", sugar: "sugar", protein: "protein", fibre: "fibre" },
  nb: { salt: "salt", satFat: "mettet fett", sugar: "sukker", protein: "protein", fibre: "fiber" },
};

const BAND_WORD: Record<Lang, Record<ProductBrief["drivers"][number]["vsCategory"], string>> = {
  en: { highest: "the most", high: "high", typical: "typical", low: "low", lowest: "the least" },
  nb: { highest: "mest", high: "høyt", typical: "vanlig", low: "lavt", lowest: "minst" },
};

// Processing label localised. The brief carries the English NOVA label; Merk
// speaks the shopper's language, so translate it for the copy.
const PROCESSING_WORD: Record<Lang, Record<1 | 2 | 3 | 4, string>> = {
  en: { 1: "Unprocessed", 2: "A culinary ingredient", 3: "Processed food", 4: "Ultra-processed food" },
  nb: { 1: "Ubearbeidet", 2: "En matlagingsingrediens", 3: "Bearbeidet mat", 4: "Sterkt bearbeidet mat" },
};

// A readable category name for the "for a X" clause. The bucket key is a slug
// or "cat:1423"; strip the prefix and de-slug it. Not perfect, but honest.
function categoryPhrase(brief: ProductBrief, lang: Lang): string {
  const raw = brief.category.replace(/^cat:/, "").replace(/-/g, " ").trim();
  if (!raw || raw === "uncategorised") return lang === "nb" ? "denne hyllen" : "this shelf";
  return raw;
}

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  // Never cut mid-word; trim to the last space under the limit.
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd();
}

/**
 * Assemble Merk's four slots from the brief alone. Deterministic and model-free.
 */
export function templateCopy(brief: ProductBrief, lang: Lang = "en"): MerkCopy {
  const cat = categoryPhrase(brief, lang);
  const top = brief.drivers[0] ?? null;
  const nb = lang === "nb";
  const watch = brief.additives.watch.length;

  // headline — the leading driver's band, or a data-shy line.
  // Three no-driver situations, kept distinct:
  //   thin shelf   (1..11 products): honest "not much to compare against yet"
  //   describe     (no shelf, or nutrients unreadable): state the label facts
  const thinShelf = brief.categoryN > 0 && brief.categoryN < 12;
  const describeOnly = !top && !thinShelf; // no driver and not a thin shelf

  let headline: string;
  if (top) {
    const band = BAND_WORD[lang][top.vsCategory];
    const nutrient = NUTRIENT_WORD[lang][top.nutrient];
    headline = nb ? `${cap(band)} ${nutrient} for ${cat}` : `${cap(band)} ${nutrient} for a ${cat}`;
  } else if (thinShelf) {
    headline = nb ? "Lite å sammenligne med ennå" : "Not much to compare it against yet";
  } else {
    // describeOnly — describe what we know, never compare.
    headline =
      brief.processing.nova === 4
        ? nb
          ? "Sterkt bearbeidet"
          : "Ultra-processed"
        : watch > 0
          ? nb
            ? `${watch} tilsetning${watch === 1 ? "" : "er"} å merke seg`
            : `${watch} additive${watch === 1 ? "" : "s"} to note`
          : nb
            ? "Ren ingrediensliste"
            : "A clean ingredient list";
  }

  // verdict — v2 shape: the COMPARISON, not the raw label value. At most one
  // number, and only when the number is the comparison itself. The gram figure
  // lives in the table below, so it never appears here.
  let verdict: string;
  if (top) {
    const nutrient = NUTRIENT_WORD[lang][top.nutrient];
    const band = BAND_WORD[lang][top.vsCategory];
    const factEn = `${cap(band)} ${nutrient} for a ${cat}.`;
    const factNb = `${cap(band)} ${nutrient} for ${cat}.`;
    const addEn =
      watch > 0
        ? ` ${watch} additive${watch === 1 ? "" : "s"} worth watching.`
        : brief.additives.total === 0
          ? " No additives."
          : "";
    const addNb =
      watch > 0
        ? ` ${watch} tilsetning${watch === 1 ? "" : "er"} verdt å merke seg.`
        : brief.additives.total === 0
          ? " Ingen tilsetningsstoffer."
          : "";
    verdict = (nb ? factNb + addNb : factEn + addEn).trim();
  } else if (thinShelf) {
    // Genuinely few products on the shelf — say so plainly.
    verdict = nb
      ? `Bare ${brief.categoryN} produkter i denne kategorien så langt.`
      : `Only ${brief.categoryN} products in this category so far.`;
  } else {
    // describeOnly — no shelf, or nutrients unreadable. State the label, make
    // no comparison.
    const processing = PROCESSING_WORD[lang][brief.processing.nova];
    const addEn =
      watch > 0
        ? `${watch} additive${watch === 1 ? "" : "s"} worth watching.`
        : brief.additives.total === 0
          ? "No additives on the label."
          : `${brief.additives.total} additive${brief.additives.total === 1 ? "" : "s"}, none worth watching.`;
    const addNb =
      watch > 0
        ? `${watch} tilsetning${watch === 1 ? "" : "er"} verdt å merke seg.`
        : brief.additives.total === 0
          ? "Ingen tilsetningsstoffer på etiketten."
          : `${brief.additives.total} tilsetning${brief.additives.total === 1 ? "" : "er"}, ingen verdt å merke seg.`;
    verdict = nb ? `${processing}. ${addNb}` : `${processing}. ${addEn}`;
  }

  // additiveNote — only when there is something to say.
  let additiveNote: string | null = null;
  if (brief.additives.duplicateJobs && brief.additives.duplicateJobs.length) {
    additiveNote = nb
      ? "To av tilsetningene gjør samme jobb. Det betyr vanligvis at oppskriften strekker holdbarheten."
      : "Two of these do the same job. That usually means the recipe is stretching shelf life.";
  } else if (watch > 0) {
    additiveNote = nb
      ? `${watch} tilsetning${watch === 1 ? "" : "er"} verdt å merke seg, ${brief.additives.safeCount} ufarlige.`
      : `${watch} additive${watch === 1 ? "" : "s"} worth watching, ${brief.additives.safeCount} harmless.`;
  }

  // wouldMerkBuy — conditional, never a yes/no.
  const topIsConcern = top && top.direction === "penalty" && (top.vsCategory === "high" || top.vsCategory === "highest");
  let wouldMerkBuy: string;
  if (describeOnly || thinShelf) {
    // No driver to reason about: a thin shelf, no shelf, or unreadable
    // nutrients. Be honest, promise nothing, compare nothing.
    wouldMerkBuy = nb
      ? "Jeg kjenner ikke denne hyllen godt nok ennå. Det jeg ser, ser vanlig ut. Spør meg igjen når vi har skannet flere av disse."
      : "I don't know this shelf well enough yet. What I can see looks ordinary. Ask me again when we've scanned more of these.";
  } else if (topIsConcern && top) {
    // v2 buy-note: an occasion + a portion truth when we have one, never a raw
    // per-100 g figure. §13: it must NOT restate the verdict's shelf comparison
    // (band + nutrient + category) — that story belongs to the verdict alone.
    // So the concern is only alluded to as an occasion ("for the occasion, not
    // the weekly shelf"); the portion truth carries the rest.
    const portionEn = portionLineEn(brief);
    const portionNb = portionLineNb(brief);
    wouldMerkBuy = nb
      ? `Grei for en gangs skyld, ikke for fast plass i kjøleskapet.${portionNb}`
      : `Fine for the occasion, not the weekly shelf.${portionEn}`;
  } else {
    // Clean / good: no concern to reason about. §13 — the buy note answers
    // "when", so it must NOT echo the verdict's shelf noun (${cat}). Use the
    // portion truth when the bucket carries one; otherwise a plain, shelf-free
    // yes that could only be said about something worth buying without fuss.
    const portionEn = portionSuffixEn(brief);
    const portionNb = portionSuffixNb(brief);
    wouldMerkBuy = nb
      ? `Ja, uten å tenke for mye på det.${portionNb || " Ingenting her ber deg nøle."}`
      : `Yes, without thinking too hard about it.${portionEn || " Nothing here asks you to pause."}`;
  }

  return {
    headline: clip(headline, SLOT_LIMITS.headline),
    verdict: clip(verdict, SLOT_LIMITS.verdict),
    additiveNote: additiveNote ? clip(additiveNote, SLOT_LIMITS.additiveNote) : null,
    wouldMerkBuy: clip(wouldMerkBuy, SLOT_LIMITS.wouldMerkBuy),
  };
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// The portion truth (§2): only ingredients read harsher per-100 g than on the
// plate, so only they earn the sentence. A component or whole-meal does not.
function portionLineEn(brief: ProductBrief): string {
  if (brief.portionRole !== "ingredient") return "";
  const p = brief.typicalPortion ?? "a little";
  return ` It is ${p} at a time, so it reads harder here than on the plate.`;
}
function portionLineNb(brief: ProductBrief): string {
  if (brief.portionRole !== "ingredient") return "";
  return " Det brukes litt om gangen, så tallene ser strengere ut her enn på tallerkenen.";
}

// A shelf-free portion sentence for the clean/good case (§13). Unlike the
// concern lines above, this fires for ANY portion role, because a plain "yes"
// is stronger with a concrete serving attached — and it never names the shelf.
function portionSuffixEn(brief: ProductBrief): string {
  const p = brief.typicalPortion;
  if (!p) return "";
  return ` ${cap(p)} is the everyday amount, and it sits easily there.`;
}
function portionSuffixNb(brief: ProductBrief): string {
  const p = brief.typicalPortion;
  if (!p) return "";
  return ` ${cap(p)} er den vanlige mengden, og der sitter det fint.`;
}
