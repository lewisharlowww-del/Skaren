/**
 * Skaren Score v2 · ingredient signals (spec §4)
 *
 * The ingredient list is the most honest thing on the pack — it is ordered by
 * weight, legally so. Eight signals, each a bounded integer, summed and capped
 * at ±12 so no single string match can swing a score. Matching is done on a
 * curated Norwegian + English term list per signal, never on free-text guessing,
 * and every match STORES the exact word it found, so the breakdown sheet can
 * quote it. A signal that cannot cite its trigger is a bug.
 */

export type IngredientSignal = {
  /** Stable id for the UI + tests. */
  id:
    | "short-list"
    | "nothing-added"
    | "wholegrain-first"
    | "single-origin"
    | "sugar-leads"
    | "sweeteners"
    | "palm-oil"
    | "long-list";
  label: string;
  points: number;
  /** The exact substring that triggered it, for the breakdown sheet. Position
   *  signals (sugar-leads) cite the word AND where it was found. */
  cite: string;
};

export type IngredientSignalResult = {
  items: IngredientSignal[];
  /** Sum of all signal points, clamped to ±12. */
  total: number;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// ── Term lists (Norwegian + English), curated per signal ──────────────────
const WHOLEGRAIN = [
  "sammalt", "fullkorn", "grovt", "hele havregryn", "rug", "byggmel",
  "wholegrain", "whole grain", "wholemeal", "whole wheat", "oats", "rye",
];
const SUGAR_TERMS = [
  "sukker", "glukose", "glukosesirup", "fruktose", "invertsukker", "sirup",
  "honning", "melis", "dekstrose", "maltodekstrin",
  "sugar", "glucose", "glucose syrup", "fructose", "invert sugar", "syrup",
  "honey", "dextrose", "maltodextrin", "corn syrup",
];
const SWEETENERS = [
  "aspartam", "sukralose", "acesulfam", "sorbitol", "xylitol", "steviol",
  "stevia", "maltitol", "isomalt", "sakkarin", "neotam",
  "aspartame", "sucralose", "acesulfame", "saccharin", "steviol glycosides",
];
const PALM = ["palmeolje", "palmefett", "palmeolein", "palm oil", "palm fat", "palm kernel"];
// Single-origin whole foods: a one-item list of a recognisable raw food.
const SINGLE_ORIGIN = [
  "oliven", "melk", "tomat", "agurk", "gulrot", "eple", "banan", "poteter",
  "kikerter", "linser", "mandler", "olives", "milk", "tomato", "cucumber",
  "carrot", "apple", "banana", "potatoes", "chickpeas", "lentils", "almonds",
];
const ADDITIVE_MARK = /e\s?-?\d{3,4}[a-z]?/i;
const FLAVOUR_TERMS = ["aroma", "smaksforsterker", "flavouring", "flavour", "flavoring", "flavor"];

/** Split an ingredient list into ordered, trimmed, lowercased items. Handles
 *  nested parentheses (does not split inside them) and both comma separators. */
export function splitIngredients(raw: string): string[] {
  if (!raw) return [];
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of raw) {
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth = Math.max(0, depth - 1);
    if ((ch === "," || ch === ";") && depth === 0) {
      if (cur.trim()) out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out.map((s) => s.toLowerCase()).filter((s) => s.length > 1);
}

function findTerm(haystack: string, terms: string[]): string | null {
  for (const term of terms) if (haystack.includes(term)) return term;
  return null;
}

/**
 * Read the eight ingredient signals off a raw ingredient string. Returns the
 * cited items and their clamped total. An empty/absent list returns no signals
 * (the caller decides whether that means limited-data).
 */
export function ingredientSignals(rawIngredients: string | null | undefined): IngredientSignalResult {
  const items: IngredientSignal[] = [];
  const list = splitIngredients(rawIngredients ?? "");
  if (list.length === 0) return { items, total: 0 };

  const joined = list.join(" , ");
  const first = list[0] ?? "";
  const firstTwo = list.slice(0, 2).join(" , ");

  // + Short list — 5 ingredients or fewer.
  if (list.length <= 5) {
    items.push({ id: "short-list", label: "Short ingredient list", points: 4, cite: `${list.length} ingredients` });
  }

  // + Nothing added — no E-numbers and no flavourings named.
  const hasENumber = ADDITIVE_MARK.test(joined);
  const flavour = findTerm(joined, FLAVOUR_TERMS);
  if (!hasENumber && !flavour) {
    items.push({ id: "nothing-added", label: "Nothing added", points: 5, cite: "no additives or flavourings" });
  }

  // + Wholegrain first — first ingredient matches a wholegrain term.
  const wholegrain = findTerm(first, WHOLEGRAIN);
  if (wholegrain) {
    items.push({ id: "wholegrain-first", label: "Wholegrain first", points: 4, cite: wholegrain });
  }

  // + Named single origin — exactly one ingredient, a recognisable raw food.
  if (list.length === 1) {
    const origin = findTerm(first, SINGLE_ORIGIN) ?? first;
    items.push({ id: "single-origin", label: "Single ingredient", points: 3, cite: origin });
  }

  // − Sugar leads — a sugar term in the first two positions.
  const sugarLead = findTerm(firstTwo, SUGAR_TERMS);
  if (sugarLead) {
    const pos = findTerm(first, SUGAR_TERMS) ? "first" : "second";
    items.push({ id: "sugar-leads", label: "Sugar leads", points: -6, cite: `${sugarLead} (${pos})` });
  }

  // − Sweeteners — any intense sweetener present.
  const sweetener = findTerm(joined, SWEETENERS);
  if (sweetener) {
    items.push({ id: "sweeteners", label: "Sweetener", points: -4, cite: sweetener });
  }

  // − Palm oil — palm named anywhere.
  const palm = findTerm(joined, PALM);
  if (palm) {
    items.push({ id: "palm-oil", label: "Palm oil", points: -3, cite: palm });
  }

  // − Long list — more than 15 ingredients.
  if (list.length > 15) {
    items.push({ id: "long-list", label: "Long ingredient list", points: -4, cite: `${list.length} ingredients` });
  }

  const total = clamp(items.reduce((sum, i) => sum + i.points, 0), -12, 12);
  return { items, total };
}
