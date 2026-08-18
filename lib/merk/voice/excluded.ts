/**
 * Merk voice · excluded-shelf lines (audit D6)
 *
 * Some shelves have no score because a per-100 g figure is meaningless there —
 * nobody eats 100 g of cinnamon, water has no macros, ground coffee is brewed
 * away to almost nothing. On those shelves the score is a deliberate blank, and
 * Merk must NOT be asked to comment on nutrition: the run caught him saying
 * "0 g sugar per 100 g, water rating stays steady", "if sugar is the job this
 * fits", "a processed coffee drink". Embarrassing, and a wasted model call.
 *
 * So an excluded bucket short-circuits BEFORE the model: a fixed, hand-written
 * verdict and buy-note per bucket, and the card renders only the ingredient and
 * additive sections. "Water. Nothing to compare here." is a complete answer.
 */

import type { MerkVerdict, ProductResult } from "@/lib/types";
import type { MerkCopy } from "@/lib/merk/voice/copy";

type FixedLine = { en: { headline: string; verdict: string; buy: string }; nb: { headline: string; verdict: string; buy: string } };

// One entry per excluded bucket (buckets.ts mode === "excluded").
const LINES: Record<string, FixedLine> = {
  water: {
    en: { headline: "Water", verdict: "Water. There is nothing on a water label a score would help you compare.", buy: "Any water is water. Pick the one you like cold." },
    nb: { headline: "Vann", verdict: "Vann. Det står ingenting på en vannetikett som en score kan hjelpe deg å sammenligne.", buy: "Vann er vann. Ta den du liker kald." },
  },
  coffee: {
    en: { headline: "Coffee", verdict: "Ground coffee. The per-100 g figures are for the dry powder, not the cup, so a score would mislead.", buy: "Choose on roast and taste, not on a label number." },
    nb: { headline: "Kaffe", verdict: "Malt kaffe. Tallene per 100 g gjelder tørt pulver, ikke koppen, så en score ville villede.", buy: "Velg på brenning og smak, ikke på et etikett-tall." },
  },
  tea: {
    en: { headline: "Tea", verdict: "Tea. The label describes the dry leaf, not the cup, so there is nothing here a score compares fairly.", buy: "Pick the blend you enjoy. The numbers brew away." },
    nb: { headline: "Te", verdict: "Te. Etiketten beskriver det tørre bladet, ikke koppen, så det er lite en score kan sammenligne rettferdig.", buy: "Velg blandingen du liker. Tallene forsvinner i koppen." },
  },
  spice: {
    en: { headline: "Spice", verdict: "A spice. You use a pinch, so the per-100 g figures never reach your plate — a score would be noise.", buy: "Buy it for the dish you are cooking, not for its label." },
    nb: { headline: "Krydder", verdict: "Et krydder. Du bruker en klype, så tallene per 100 g når aldri tallerkenen — en score ville vært støy.", buy: "Kjøp det til retten du lager, ikke for etiketten." },
  },
  sugar: {
    en: { headline: "Sugar", verdict: "Sugar. It is the one ingredient, so there is no shelf to rank it against — the score sits out here.", buy: "Buy what a recipe calls for. This is the ingredient, not the meal." },
    nb: { headline: "Sukker", verdict: "Sukker. Det er den ene ingrediensen, så det finnes ingen hylle å rangere det mot — scoren står over her.", buy: "Kjøp det en oppskrift ber om. Dette er ingrediensen, ikke måltidet." },
  },
  salt: {
    en: { headline: "Salt", verdict: "Salt. One ingredient, used by the pinch, so a per-100 g score would tell you nothing useful.", buy: "Any salt seasons a dish. Buy the grind you cook with." },
    nb: { headline: "Salt", verdict: "Salt. Én ingrediens, brukt i klyper, så en score per 100 g ville ikke fortalt deg noe nyttig.", buy: "Alt salt krydrer en rett. Kjøp den malingen du lager mat med." },
  },
  beer: {
    en: { headline: "Beer", verdict: "Beer. Skaren does not score alcohol — that is a choice about the drink, not a number about the label.", buy: "This is a taste choice, not one a score should make for you." },
    nb: { headline: "Øl", verdict: "Øl. Skaren scorer ikke alkohol — det er et valg om drikken, ikke et tall om etiketten.", buy: "Dette er et smaksvalg, ikke ett en score bør ta for deg." },
  },
  wine: {
    en: { headline: "Wine", verdict: "Wine. Skaren does not score alcohol — the choice here is about taste, not a label figure.", buy: "Pick it for the meal and the mood, not for a number." },
    nb: { headline: "Vin", verdict: "Vin. Skaren scorer ikke alkohol — valget her handler om smak, ikke et etikett-tall.", buy: "Velg den til måltidet og stemningen, ikke for et tall." },
  },
};

const FALLBACK: FixedLine = {
  en: { headline: "Nothing to compare", verdict: "There is nothing on this label a score would compare fairly, so Skaren sits this one out.", buy: "Choose it on taste and use. A number would not help here." },
  nb: { headline: "Ingenting å sammenligne", verdict: "Det er ingenting på denne etiketten en score kan sammenligne rettferdig, så Skaren står over.", buy: "Velg den på smak og bruk. Et tall ville ikke hjelpe her." },
};

/** The fixed verdict for an excluded bucket. `lang` is the app's "no"|"en". */
export function excludedVerdict(bucket: string, lang: "no" | "en"): MerkVerdict {
  const l = LINES[bucket] ?? FALLBACK;
  const t = lang === "no" ? l.nb : l.en;
  return { expression: "thinking", headline: t.headline, text: t.verdict, source: "static" };
}

/** The fixed four-slot copy for an excluded bucket. `lang` is the voice "en"|"nb". */
export function excludedCopy(bucket: string, lang: "en" | "nb"): MerkCopy {
  const l = LINES[bucket] ?? FALLBACK;
  const t = lang === "nb" ? l.nb : l.en;
  return { headline: t.headline, verdict: t.verdict, additiveNote: null, wouldMerkBuy: t.buy };
}

/** Whether NOVA may be shown for a product (audit D6, second bug). NOVA is only
 *  honest when the source supplied a group; bottled water printing "NOVA 3" is a
 *  fabrication. Returns the group only when it is a real 1..4. */
export function displayNova(product: Pick<ProductResult, "novaGroup">): 1 | 2 | 3 | 4 | null {
  const n = product.novaGroup;
  return n === 1 || n === 2 || n === 3 || n === 4 ? n : null;
}
