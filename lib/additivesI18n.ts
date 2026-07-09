import type { SafetyRating } from "@/lib/enumbers";

/**
 * EN/NO localization for the additive SEO pages.
 *
 * Norwegian is the priority market, so all fixed strings (categories, safety
 * labels, notes, headings, FAQ) are hand-translated. The 339 one-line English
 * descriptions are machine-translated with a domain-tuned phrase dictionary in
 * translateDescription(); they should be reviewed by a native speaker, but read
 * cleanly for the common patterns in this dataset.
 */

export type Lang = "en" | "no";

// ── Category names ────────────────────────────────────────────────────────────
const CATEGORY_NO: Record<string, string> = {
  Acid: "Syre",
  "Anti-caking Agent": "Antiklumpemiddel",
  "Anti-foaming Agent": "Skumdempende middel",
  Antioxidant: "Antioksidant",
  Colour: "Fargestoff",
  Emulsifier: "Emulgator",
  Enzyme: "Enzym",
  "Firming Agent": "Fastningsmiddel",
  "Flavour Enhancer": "Smaksforsterker",
  "Glazing Agent": "Overflatemiddel",
  Humectant: "Fuktighetsbevarende middel",
  "Improving Agent": "Melbehandlingsmiddel",
  "Packaging Gas": "Pakkegass",
  Preservative: "Konserveringsmiddel",
  "Raising Agent": "Hevemiddel",
  Stabiliser: "Stabilisator",
  Sweetener: "Søtningsstoff",
  Thickener: "Fortykningsmiddel",
};

export function categoryLabel(category: string, lang: Lang): string {
  if (lang === "en") return category;
  return CATEGORY_NO[category] ?? category;
}

// ── Safety labels ─────────────────────────────────────────────────────────────
const SAFETY_LABEL: Record<Lang, Record<SafetyRating, string>> = {
  en: { safe: "Safe", moderate: "Use in moderation", avoid: "Best avoided" },
  no: { safe: "Trygt", moderate: "Bruk med måte", avoid: "Bør unngås" },
};

export function safetyLabel(safety: SafetyRating, lang: Lang): string {
  return SAFETY_LABEL[lang][safety];
}

// ── Notes (small finite set in the dataset) ───────────────────────────────────
const NOTES_NO: Record<string, string> = {
  "Avoid combining with Vitamin C (E300)": "Unngå å kombinere med vitamin C (E300)",
  "Banned in EU food products": "Forbudt i matvarer i EU",
  "Banned in some countries": "Forbudt i enkelte land",
  "Linked to colorectal cancer risk": "Knyttet til økt risiko for tarmkreft",
  "Not suitable for people with phenylketonuria (PKU)":
    "Ikke egnet for personer med fenylketonuri (PKU)",
  "Possible carcinogen": "Mulig kreftfremkallende",
  "Releases formaldehyde": "Frigjør formaldehyd",
  "Requires warning label in EU": "Krever advarselsmerking i EU",
};

export function translateNotes(notes: string, lang: Lang): string {
  if (lang === "en") return notes;
  return NOTES_NO[notes] ?? notes;
}

// ── Description translation (domain phrase dictionary) ─────────────────────────
// Ordered longest-first so multi-word phrases win over their sub-words.
const PHRASES: Array<[RegExp, string]> = [
  [/Natural yellow pigment from turmeric/gi, "Naturlig gult pigment fra gurkemeie"],
  [/Synthetic yellow dye/gi, "Syntetisk gult fargestoff"],
  [/Synthetic orange dye/gi, "Syntetisk oransje fargestoff"],
  [/Synthetic red dye/gi, "Syntetisk rødt fargestoff"],
  [/Synthetic blue dye/gi, "Syntetisk blått fargestoff"],
  [/Synthetic green dye/gi, "Syntetisk grønt fargestoff"],
  [/artificial sweetener/gi, "kunstig søtningsstoff"],
  [/Artificial sweetener/gi, "Kunstig søtningsstoff"],
  [/natural preservative/gi, "naturlig konserveringsmiddel"],
  [/Natural preservative/gi, "Naturlig konserveringsmiddel"],
  [/may cause hyperactivity in children/gi, "kan gi hyperaktivitet hos barn"],
  [/linked to hyperactivity in children/gi, "knyttet til hyperaktivitet hos barn"],
  [/linked to hyperactivity/gi, "knyttet til hyperaktivitet"],
  [/may cause allergic reactions/gi, "kan gi allergiske reaksjoner"],
  [/may cause digestive issues/gi, "kan gi fordøyelsesplager"],
  [/generally recognised as safe/gi, "regnes generelt som trygt"],
  [/generally considered safe/gi, "regnes generelt som trygt"],
  [/requires warning label in EU/gi, "krever advarselsmerking i EU"],
  [/banned in the USA/gi, "forbudt i USA"],
  [/banned in some countries/gi, "forbudt i enkelte land"],
  [/derived from insects/gi, "utvunnet fra insekter"],
  [/from insects/gi, "fra insekter"],
  [/not vegan/gi, "ikke vegansk"],
  [/flavour enhancer/gi, "smaksforsterker"],
  [/Flavour enhancer/gi, "Smaksforsterker"],
  [/preservative/gi, "konserveringsmiddel"],
  [/Preservative/gi, "Konserveringsmiddel"],
  [/antioxidant/gi, "antioksidant"],
  [/Antioxidant/gi, "Antioksidant"],
  [/emulsifier/gi, "emulgator"],
  [/Emulsifier/gi, "Emulgator"],
  [/thickener/gi, "fortykningsmiddel"],
  [/Thickener/gi, "Fortykningsmiddel"],
  [/stabiliser/gi, "stabilisator"],
  [/Stabiliser/gi, "Stabilisator"],
  [/sweetener/gi, "søtningsstoff"],
  [/Sweetener/gi, "søtningsstoff"],
  [/raising agent/gi, "hevemiddel"],
  [/Raising agent/gi, "Hevemiddel"],
  [/colourant/gi, "fargestoff"],
  [/colour/gi, "farge"],
  [/Colour/gi, "Farge"],
  [/Natural/gi, "Naturlig"],
  [/natural/gi, "naturlig"],
  [/Synthetic/gi, "Syntetisk"],
  [/synthetic/gi, "syntetisk"],
  [/derived from/gi, "utvunnet fra"],
  [/from plants/gi, "fra planter"],
  [/vegan/gi, "vegansk"],
];

/**
 * Best-effort Norwegian rendering of an English additive description. Falls back
 * to leaving untranslated fragments in place, which is acceptable for less
 * common additives. High-traffic additives get hand-written NO copy via
 * DESCRIPTION_NO below, which always takes priority.
 */
export function translateDescription(description: string, lang: Lang, code?: string): string {
  if (lang === "en") return description;
  if (code && DESCRIPTION_NO[code]) return DESCRIPTION_NO[code];
  let out = description;
  for (const [re, sub] of PHRASES) out = out.replace(re, sub);
  return out;
}

// Hand-written Norwegian for the most-searched additives. Extend freely.
const DESCRIPTION_NO: Record<string, string> = {
  E102: "Syntetisk gult fargestoff (tartrazin), kan gi hyperaktivitet hos barn",
  E120: "Rødt fargestoff utvunnet fra insekter, ikke vegansk",
  E211: "Konserveringsmiddel (natriumbenzoat), knyttet til hyperaktivitet; unngå sammen med vitamin C",
  E250: "Konserveringsmiddel i bearbeidet kjøtt (natriumnitritt), knyttet til kreftrisiko",
  E251: "Konserveringsmiddel (natriumnitrat) brukt i spekemat og bearbeidet kjøtt",
  E621: "Smaksforsterker (MSG, mononatriumglutamat); noen rapporterer følsomhet",
  E627: "Smaksforsterker (dinatriumguanylat), unngå ved følsomhet for MSG",
  E951: "Kunstig søtningsstoff (aspartam), omdiskutert; ikke egnet ved PKU",
  E950: "Kunstig søtningsstoff (acesulfam K), sikkerheten er omdiskutert",
  E955: "Kunstig søtningsstoff (sukralose), kan påvirke tarmfloraen",
  E471: "Emulgator (mono- og diglyserider), ofte utvunnet fra animalsk fett",
  E407: "Fortykningsmiddel fra tang (karragenan), kan gi fordøyelsesplager",
  E300: "Antioksidant (vitamin C), naturlig og gunstig",
  E330: "Naturlig syre (sitronsyre) som finnes i sitrusfrukter",
  E322: "Emulgator (lecitin) fra soya eller egg, regnes generelt som trygt",
  E100: "Naturlig gult pigment fra gurkemeie (kurkumin)",
};

// ── Page copy (headings, intros, FAQ) ─────────────────────────────────────────
export const COPY = {
  en: {
    indexTitle: "Food Additives & E-Numbers Explained",
    indexDescription:
      "Look up any E-number or food additive to see its name, category, safety rating, and what it means on a food label. Skaren's free database covers 300+ additives.",
    indexH1: "E-Numbers & Food Additives",
    indexLede:
      "Search any E-number to understand what it is, whether it is safe, and what it does in your food. Free and based on Skaren's additive database.",
    searchAll: "Browse all additives",
    filterSafe: "Safe",
    filterModerate: "Moderation",
    filterAvoid: "Avoid",
    category: "Category",
    safety: "Safety",
    vegan: "Vegan",
    notVegan: "Not vegan",
    veganYes: "Yes",
    veganNo: "No",
    whatIs: (code: string) => `What is ${code}?`,
    isItSafe: (code: string, name: string) => `Is ${code} (${name}) safe?`,
    relatedTitle: "Other additives",
    ctaTitle: "Scan your groceries with Skaren",
    ctaBody:
      "Skaren instantly flags additives like this when you scan a product barcode, with clear health and eco grades.",
    ctaButton: "Get Skaren free",
    backToIndex: "All E-numbers",
    lastUpdated: "Reference data, reviewed regularly.",
    disclaimer:
      "Information is for general guidance only and is not medical or dietary advice.",
  },
  no: {
    indexTitle: "Tilsetningsstoffer og E-numre forklart",
    indexDescription:
      "Slå opp et hvilket som helst E-nummer eller tilsetningsstoff og se navn, kategori, sikkerhetsvurdering og hva det betyr på matvaremerkingen. Skarens gratis database dekker over 300 tilsetningsstoffer.",
    indexH1: "E-numre og tilsetningsstoffer",
    indexLede:
      "Søk opp et E-nummer for å forstå hva det er, om det er trygt, og hva det gjør i maten. Gratis og basert på Skarens database over tilsetningsstoffer.",
    searchAll: "Se alle tilsetningsstoffer",
    filterSafe: "Trygt",
    filterModerate: "Med måte",
    filterAvoid: "Unngå",
    category: "Kategori",
    safety: "Sikkerhet",
    vegan: "Vegansk",
    notVegan: "Ikke vegansk",
    veganYes: "Ja",
    veganNo: "Nei",
    whatIs: (code: string) => `Hva er ${code}?`,
    isItSafe: (code: string, name: string) => `Er ${code} (${name}) trygt?`,
    relatedTitle: "Andre tilsetningsstoffer",
    ctaTitle: "Skann matvarene dine med Skaren",
    ctaBody:
      "Skaren varsler umiddelbart om tilsetningsstoffer som dette når du skanner strekkoden på et produkt, med tydelige helse- og økokarakterer.",
    ctaButton: "Last ned Skaren gratis",
    backToIndex: "Alle E-numre",
    lastUpdated: "Referansedata, gjennomgås jevnlig.",
    disclaimer:
      "Informasjonen er kun ment som generell veiledning og er ikke medisinske eller kostholdsmessige råd.",
  },
} as const;
