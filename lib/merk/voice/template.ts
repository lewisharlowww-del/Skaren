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

// A readable category name for the "for a X" clause. The bucket key is a slug
// or "cat:1423"; strip the prefix and de-slug it. Not perfect, but honest.
function categoryPhrase(brief: ProductBrief, lang: Lang): string {
  const raw = brief.category.replace(/^cat:/, "").replace(/-/g, " ").trim();
  if (!raw || raw === "uncategorised") return lang === "nb" ? "denne hyllen" : "this shelf";
  return raw;
}

function num(value: number, lang: Lang): string {
  return lang === "nb" ? String(value).replace(".", ",") : String(value);
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
  let headline: string;
  if (top) {
    const band = BAND_WORD[lang][top.vsCategory];
    const nutrient = NUTRIENT_WORD[lang][top.nutrient];
    headline = nb ? `${cap(band)} ${nutrient} for ${cat}` : `${cap(band)} ${nutrient} for a ${cat}`;
  } else if (brief.categoryN < 12) {
    headline = nb ? "Lite å sammenligne med ennå" : "Not much to compare it against yet";
  } else {
    headline = nb ? `Vanlig for ${cat}` : `Typical for a ${cat}`;
  }

  // verdict — the leading fact, then additive count.
  let verdict: string;
  if (top) {
    const nutrient = NUTRIENT_WORD[lang][top.nutrient];
    const value = `${num(top.value, lang)} ${top.unit}`;
    const factEn = `${value} ${nutrient} per 100 g, ${BAND_WORD.en[top.vsCategory]} for a ${cat}.`;
    const factNb = `${value} ${nutrient} per 100 g, ${BAND_WORD.nb[top.vsCategory]} for ${cat}.`;
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
  } else {
    verdict = nb
      ? `Bare ${brief.categoryN} produkter i denne kategorien så langt.`
      : `Only ${brief.categoryN} products in this category so far.`;
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
  if (brief.categoryN < 12) {
    wouldMerkBuy = nb
      ? "Jeg kjenner ikke denne hyllen godt nok ennå. Det jeg ser, ser vanlig ut. Spør meg igjen når vi har skannet flere av disse."
      : "I don't know this shelf well enough yet. What I can see looks ordinary. Ask me again when we've scanned more of these.";
  } else if (topIsConcern && top) {
    const nutrient = NUTRIENT_WORD[lang][top.nutrient];
    wouldMerkBuy = nb
      ? `Grei for en gangs skyld, ikke for fast plass i kjøleskapet. ${num(top.value, lang)} ${top.unit} ${nutrient} per 100 g er ${BAND_WORD.nb[top.vsCategory]} for ${cat}. Er det en ukentlig vane, finnes det en med mindre.`
      : `Fine for the occasion, not for the weekly shelf. At ${num(top.value, lang)} ${top.unit} ${nutrient} per 100 g it sits ${BAND_WORD.en[top.vsCategory]} for a ${cat}. If it's a weekly habit, there's one with less.`;
  } else {
    wouldMerkBuy = nb
      ? `Ja, uten å tenke for mye på det. Det ser ryddig ut for ${cat}, og lite skiller seg ut på feil måte.`
      : `Yes, without thinking too hard about it. It reads clean for a ${cat}, and nothing here stands out the wrong way.`;
  }

  return {
    headline: clip(headline, SLOT_LIMITS.headline),
    verdict: clip(verdict, SLOT_LIMITS.verdict),
    additiveNote: additiveNote ? clip(additiveNote, SLOT_LIMITS.additiveNote) : null,
    wouldMerkBuy: clip(wouldMerkBuy, SLOT_LIMITS.wouldMerkBuy),
  };
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
