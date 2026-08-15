/**
 * Merk voice engine · bucket presentation (briefing v2, §2)
 *
 * Two hand-set tables, one entry per shelf bucket:
 *   - a human NOUN per language — because a bucket key ("cheese-yellow") or a
 *     catalogue token ("spesialpolser") must never appear in Merk's copy;
 *   - PORTION metadata — how the product is eaten. This unlocks the one thing
 *     the buy-note can say that the per-100 g table cannot: that nobody eats
 *     100 g of chorizo, so the numbers read harsher than the plate does.
 *
 * These are brand assets, set by hand. When a bucket is missing here, the copy
 * simply says less — it never invents a noun or a portion.
 */

import type { PortionRole } from "@/lib/merk/voice/brief";

export type BucketPresentation = {
  noun: { en: string; nb: string };
  portionRole: PortionRole;
  /** A concrete serving, per language. Keep it plain: "a slice", "en skive". */
  typicalPortion: { en: string; nb: string };
};

// Keyed by the score buckets (lib/merk/categories.ts). Not every bucket needs an
// entry; the absent ones fall through to "no portion insight, no noun".
export const BUCKET_PRESENTATION: Record<string, BucketPresentation> = {
  "cheese-yellow": { noun: { en: "yellow cheese", nb: "gulost" }, portionRole: "component", typicalPortion: { en: "a slice", nb: "en skive" } },
  "cheese-white": { noun: { en: "white cheese", nb: "hvitost" }, portionRole: "component", typicalPortion: { en: "a slice", nb: "en skive" } },
  "cheese-fresh": { noun: { en: "cream cheese", nb: "kremost" }, portionRole: "component", typicalPortion: { en: "a spread", nb: "et pålegg" } },
  "cheese-brown": { noun: { en: "brown cheese", nb: "brunost" }, portionRole: "component", typicalPortion: { en: "a slice", nb: "en skive" } },
  yoghurt: { noun: { en: "yoghurt", nb: "yoghurt" }, portionRole: "whole-meal", typicalPortion: { en: "a bowl", nb: "en skål" } },
  milk: { noun: { en: "milk", nb: "melk" }, portionRole: "component", typicalPortion: { en: "a glass", nb: "et glass" } },
  "plant-drink": { noun: { en: "plant milk", nb: "plantedrikk" }, portionRole: "component", typicalPortion: { en: "a glass", nb: "et glass" } },
  cream: { noun: { en: "cream", nb: "fløte" }, portionRole: "ingredient", typicalPortion: { en: "a splash", nb: "en skvett" } },
  "sour-cream": { noun: { en: "sour cream", nb: "rømme" }, portionRole: "component", typicalPortion: { en: "a spoon", nb: "en skje" } },
  "butter-spread": { noun: { en: "butter or spread", nb: "smør eller margarin" }, portionRole: "ingredient", typicalPortion: { en: "a scrape", nb: "et tynt lag" } },
  oil: { noun: { en: "cooking oil", nb: "matolje" }, portionRole: "ingredient", typicalPortion: { en: "a spoon", nb: "en skje" } },
  bread: { noun: { en: "bread", nb: "brød" }, portionRole: "whole-meal", typicalPortion: { en: "a couple of slices", nb: "et par skiver" } },
  flatbread: { noun: { en: "flatbread", nb: "flatbrød" }, portionRole: "component", typicalPortion: { en: "one wrap", nb: "en lefse" } },
  crispbread: { noun: { en: "crispbread", nb: "knekkebrød" }, portionRole: "component", typicalPortion: { en: "a couple", nb: "et par" } },
  cereal: { noun: { en: "cereal", nb: "frokostblanding" }, portionRole: "whole-meal", typicalPortion: { en: "a bowl", nb: "en skål" } },
  pasta: { noun: { en: "pasta", nb: "pasta" }, portionRole: "whole-meal", typicalPortion: { en: "a plate", nb: "en porsjon" } },
  rice: { noun: { en: "rice", nb: "ris" }, portionRole: "component", typicalPortion: { en: "a scoop", nb: "en øse" } },
  crisps: { noun: { en: "crisps", nb: "potetgull" }, portionRole: "component", typicalPortion: { en: "a handful", nb: "en håndfull" } },
  chocolate: { noun: { en: "chocolate", nb: "sjokolade" }, portionRole: "component", typicalPortion: { en: "a couple of squares", nb: "et par ruter" } },
  candy: { noun: { en: "sweets", nb: "godteri" }, portionRole: "component", typicalPortion: { en: "a small handful", nb: "en liten håndfull" } },
  biscuits: { noun: { en: "biscuits", nb: "kjeks" }, portionRole: "component", typicalPortion: { en: "a couple", nb: "et par" } },
  nuts: { noun: { en: "nuts", nb: "nøtter" }, portionRole: "component", typicalPortion: { en: "a handful", nb: "en håndfull" } },
  "snack-bar": { noun: { en: "snack bar", nb: "barer" }, portionRole: "whole-meal", typicalPortion: { en: "one bar", nb: "én bar" } },
  "ice-cream": { noun: { en: "ice cream", nb: "iskrem" }, portionRole: "component", typicalPortion: { en: "a scoop or two", nb: "en kule eller to" } },
  pate: { noun: { en: "pâté", nb: "leverpostei" }, portionRole: "ingredient", typicalPortion: { en: "a spread", nb: "et pålegg" } },
  "cured-meat": { noun: { en: "cured meat", nb: "spekemat" }, portionRole: "ingredient", typicalPortion: { en: "a few slices", nb: "noen skiver" } },
  sausage: { noun: { en: "sausage", nb: "pølser" }, portionRole: "component", typicalPortion: { en: "one sausage", nb: "én pølse" } },
  "minced-meat": { noun: { en: "mince", nb: "kjøttdeig" }, portionRole: "component", typicalPortion: { en: "a portion", nb: "en porsjon" } },
  poultry: { noun: { en: "chicken", nb: "kylling" }, portionRole: "component", typicalPortion: { en: "a fillet", nb: "et filet" } },
  "ham-bacon": { noun: { en: "ham or bacon", nb: "skinke eller bacon" }, portionRole: "ingredient", typicalPortion: { en: "a few slices", nb: "noen skiver" } },
  "red-meat": { noun: { en: "red meat", nb: "rødt kjøtt" }, portionRole: "component", typicalPortion: { en: "a portion", nb: "en porsjon" } },
  salmon: { noun: { en: "salmon", nb: "laks" }, portionRole: "component", typicalPortion: { en: "a fillet", nb: "et stykke" } },
  fish: { noun: { en: "fish", nb: "fisk" }, portionRole: "component", typicalPortion: { en: "a fillet", nb: "et stykke" } },
  "fish-cakes": { noun: { en: "fish cakes", nb: "fiskemat" }, portionRole: "component", typicalPortion: { en: "a couple", nb: "et par" } },
  eggs: { noun: { en: "eggs", nb: "egg" }, portionRole: "component", typicalPortion: { en: "a couple", nb: "et par" } },
  "meat-alt": { noun: { en: "meat substitute", nb: "kjøtterstatning" }, portionRole: "component", typicalPortion: { en: "a portion", nb: "en porsjon" } },
  "legumes-canned": { noun: { en: "beans", nb: "bønner" }, portionRole: "component", typicalPortion: { en: "half a tin", nb: "en halv boks" } },
  condiment: { noun: { en: "condiment", nb: "tilbehør" }, portionRole: "ingredient", typicalPortion: { en: "a spoon", nb: "en skje" } },
  "cooking-sauce": { noun: { en: "cooking sauce", nb: "saus" }, portionRole: "ingredient", typicalPortion: { en: "a ladle", nb: "en øse" } },
  soup: { noun: { en: "soup", nb: "suppe" }, portionRole: "whole-meal", typicalPortion: { en: "a bowl", nb: "en skål" } },
  spice: { noun: { en: "spice", nb: "krydder" }, portionRole: "ingredient", typicalPortion: { en: "a pinch", nb: "en klype" } },
  sugar: { noun: { en: "sugar", nb: "sukker" }, portionRole: "ingredient", typicalPortion: { en: "a spoon", nb: "en skje" } },
  "jam-honey": { noun: { en: "jam or honey", nb: "syltetøy eller honning" }, portionRole: "ingredient", typicalPortion: { en: "a spread", nb: "et pålegg" } },
  "nut-butter": { noun: { en: "nut butter", nb: "nøttesmør" }, portionRole: "ingredient", typicalPortion: { en: "a spread", nb: "et pålegg" } },
  "energy-drink": { noun: { en: "energy drink", nb: "energidrikk" }, portionRole: "whole-meal", typicalPortion: { en: "one can", nb: "én boks" } },
  "soft-drink": { noun: { en: "soft drink", nb: "brus" }, portionRole: "whole-meal", typicalPortion: { en: "a glass", nb: "et glass" } },
  cordial: { noun: { en: "cordial", nb: "saft" }, portionRole: "component", typicalPortion: { en: "a glass", nb: "et glass" } },
  juice: { noun: { en: "juice", nb: "juice" }, portionRole: "component", typicalPortion: { en: "a glass", nb: "et glass" } },
  "baby-food": { noun: { en: "baby food", nb: "barnemat" }, portionRole: "whole-meal", typicalPortion: { en: "one pouch", nb: "én pose" } },
  "dried-fruit": { noun: { en: "dried fruit", nb: "tørket frukt" }, portionRole: "component", typicalPortion: { en: "a small handful", nb: "en liten håndfull" } },
  "frozen-fruit": { noun: { en: "frozen fruit", nb: "frosne bær" }, portionRole: "component", typicalPortion: { en: "a handful", nb: "en håndfull" } },
};

export function bucketPresentation(bucket: string): BucketPresentation | null {
  return BUCKET_PRESENTATION[bucket] ?? null;
}
