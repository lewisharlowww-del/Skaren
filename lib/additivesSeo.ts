import { ENUMBERS, type ENumber } from "@/lib/enumbers";
import {
  categoryLabel,
  safetyLabel,
  translateDescription,
  translateNotes,
  type Lang,
} from "@/lib/additivesI18n";

/**
 * SEO layer over the E-number database.
 *
 * Powers the programmatic /additives + /tilsetningsstoffer pages, which target
 * high-volume, low-competition searches like "E211", "sodium benzoate safe",
 * "tilsetningsstoffer liste". Each E-number becomes its own statically
 * generated, crawlable page with real content and structured data.
 */

export type AdditiveEntry = ENumber & { slug: string };

const numeric = (code: string) => parseInt(code.replace(/[^0-9]/g, ""), 10);

/** All additives, sorted by numeric E-number then suffix (E150, E150a, ...). */
export function getAllAdditives(): AdditiveEntry[] {
  return Object.values(ENUMBERS)
    .map((e) => ({ ...e, slug: e.code.toLowerCase() }))
    .sort((a, b) => numeric(a.code) - numeric(b.code) || a.code.localeCompare(b.code));
}

/** Resolve a URL slug (e.g. "e211") to an additive entry. */
export function getAdditiveBySlug(slug: string): AdditiveEntry | null {
  const key = slug.trim().toLowerCase();
  const entry = Object.values(ENUMBERS).find((e) => e.code.toLowerCase() === key);
  return entry ? { ...entry, slug: entry.code.toLowerCase() } : null;
}

/** A few nearby additives for internal linking (helps crawl + SEO). */
export function getRelatedAdditives(entry: AdditiveEntry, count = 6): AdditiveEntry[] {
  const all = getAllAdditives();
  const sameCategory = all.filter(
    (e) => e.category === entry.category && e.code !== entry.code
  );
  const pool = sameCategory.length >= count ? sameCategory : all.filter((e) => e.code !== entry.code);
  return pool.slice(0, count);
}

// ── Localized text builders ───────────────────────────────────────────────────

export function localizedCategory(entry: AdditiveEntry, lang: Lang): string {
  return categoryLabel(entry.category, lang);
}

export function localizedSafety(entry: AdditiveEntry, lang: Lang): string {
  return safetyLabel(entry.safety, lang);
}

export function localizedDescription(entry: AdditiveEntry, lang: Lang): string {
  return translateDescription(entry.description, lang, entry.code);
}

export function localizedNotes(entry: AdditiveEntry, lang: Lang): string | null {
  return entry.notes ? translateNotes(entry.notes, lang) : null;
}

/** Self-contained, search-friendly meta description (≤300 chars). */
export function additiveMetaDescription(entry: AdditiveEntry, lang: Lang): string {
  const cat = localizedCategory(entry, lang).toLowerCase();
  const desc = localizedDescription(entry, lang);
  const safety = localizedSafety(entry, lang).toLowerCase();
  if (lang === "no") {
    const vegan = entry.vegan === undefined ? "" : entry.vegan ? " Vegansk." : " Ikke vegansk.";
    return `${entry.code} (${entry.name}) er et ${cat}-tilsetningsstoff. ${desc}. Skaren vurderer det som «${safety}».${vegan} Se sikkerhet, bruk og hva det betyr på matvaremerkingen.`.slice(
      0,
      300
    );
  }
  const vegan = entry.vegan === undefined ? "" : entry.vegan ? " It is vegan." : " It is not vegan.";
  return `${entry.code} (${entry.name}) is a ${cat} additive. ${desc}. Skaren rates it "${safety}".${vegan} See its safety rating, uses, and what it means on a food label.`.slice(
    0,
    300
  );
}

/** Longer intro paragraph rendered in the page body. */
export function additiveIntro(entry: AdditiveEntry, lang: Lang): string {
  const cat = localizedCategory(entry, lang).toLowerCase();
  const desc = localizedDescription(entry, lang);
  const safety = localizedSafety(entry, lang).toLowerCase();
  const notes = localizedNotes(entry, lang);
  if (lang === "no") {
    const vegan =
      entry.vegan === undefined
        ? ""
        : entry.vegan
          ? " Det er egnet for veganere."
          : " Det er ikke egnet for veganere, siden det er animalsk.";
    return `${entry.code}, også kjent som ${entry.name}, er et tilsetningsstoff i kategorien ${cat}. ${desc}. Skaren vurderer det som «${safety}».${vegan}${notes ? ` ${notes}.` : ""}`;
  }
  const vegan =
    entry.vegan === undefined
      ? ""
      : entry.vegan
        ? " It is suitable for vegans."
        : " It is not suitable for vegans, as it is animal-derived.";
  return `${entry.code}, also known as ${entry.name}, is a food additive in the ${cat} category. ${desc}. Skaren rates it "${safety}".${vegan}${notes ? ` ${notes}.` : ""}`;
}
