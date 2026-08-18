/**
 * Skaren Score · category buckets
 *
 * A bucket is a set of products a shopper would consider interchangeable while
 * standing in one place. Coarse beats precise: ~60 buckets cover a Norwegian
 * supermarket. These rules are HAND-WRITTEN, not machine-learned — the left
 * side is a substring found in the catalogue's own category/name fields, the
 * right side is our bucket key.
 *
 * Two rules that are easy to get wrong:
 *  - Split when the shelf splits. Yellow cheese and brown cheese are different
 *    buckets (nobody swaps one for the other); cheddar and Norvegia are the
 *    same bucket (everybody does).
 *  - Never split by fat level. If 10% and 26% cheese were separate buckets, the
 *    low-fat option could never win — and telling the shopper it exists is the
 *    whole point.
 */

export type CatalogueProduct = {
  name?: string | null;
  category?: string | null;
  subCategory?: string | null;
  /** v2 (audit D3) — ingredients + additive count, for the processed-protein
   *  guard. A "plain" bucket assumes there is nothing to read; a breaded,
   *  seasoned or additive-carrying product breaks that assumption and is moved
   *  to its processed sibling. Optional: callers without them skip the guard. */
  ingredients?: string | null;
  additiveCount?: number | null;
};

// ── Name overrides (audit D3) ─────────────────────────────────────────────
// Kassalapp's taxonomy mixes shelf LOCATION with product TYPE — biscuits, crisps
// and candy all share a "Snacks" parent, baby food sits under the food it
// imitates. So a single catalogue-category match sends the wrong products to the
// nearest snack-ish bucket. These patterns are tested against the NAME ONLY and
// win over every category rule: if the product is literally called "kjeks" it is
// a biscuit, whatever aisle the catalogue filed it under. Order matters here too.
export const NAME_OVERRIDES: Array<[RegExp, string]> = [
  // Baby food announces itself in the name (age band), never in a nutrient.
  [/\b\d{1,2}\s*[-–]\s*\d{1,2}\s*(mnd|m[åa]ned|[åa]r)\b|\b\d{1,2}\s*mnd\b|\bfra\s*\d{1,2}\s*(mnd|m[åa]ned)|velling|barnegr[øo]t|barnemat/i, "baby-food"],
  // Sweets miscategorised under Snacks/Sjokolade.
  [/vingummi|seigmenn|seigmann|lakris|vingum|gelégodt|gele\s*godt|pastiller|smågodt|smagodt|skum(?:bananer|nisser)|bilar\b/i, "candy"],
  // Biscuits miscategorised under Snacks.
  [/\bkjeks\b|digestive|marie\b|kakemenn|pepperkake/i, "biscuits"],
  // Potato/pasta salads are a condiment/deli item, not sour cream.
  [/potetsalat|pastasalat|salatmix\s*med|coleslaw/i, "condiment"],
  // Chocolate bars/wafers sometimes filed under Snacks/Kjeks.
  [/kvikk\s*lunsj|sjokolade(?:bar|plate)|toblerone|firkl[øo]ver/i, "chocolate"],
];

// ── Processed-protein guard (audit D3) ─────────────────────────────────────
// A product in a PLAIN bucket (chicken, fish, mince…) that carries more than a
// couple of ingredients, or any additive, is not plain — it is breaded,
// marinated or emulsified. Plain mode reads no ingredient list, so leaving it
// there hides real processing behind a whole-food ceiling. Route it to a
// processed sibling instead. Keyed by the plain bucket → its processed home.
const PLAIN_TO_PROCESSED: Record<string, string> = {
  poultry: "ready-meal",
  fish: "fish-cakes",
  salmon: "ready-meal",
  shellfish: "ready-meal",
  "red-meat": "ready-meal",
  "minced-meat": "ready-meal",
};
const PLAIN_BUCKETS = new Set(Object.keys(PLAIN_TO_PROCESSED));

/** Count the comma/parenthesis-separated components of an ingredient string.
 *  A whole food has one or two ("Chicken breast", "Salmon, salt"); breaded or
 *  marinated products list many. */
function ingredientCount(ingredients: string | null | undefined): number {
  if (!ingredients) return 0;
  const cleaned = ingredients.replace(/\([^)]*\)/g, ""); // drop sub-lists
  return cleaned.split(/[,;]/).map((s) => s.trim()).filter(Boolean).length;
}

/** Apply the processed-protein guard: a plain bucket with >3 ingredients or any
 *  additive is moved to its processed sibling. Pure; returns the same bucket
 *  when the guard does not apply. */
export function applyProcessedGuard(bucket: string, p: CatalogueProduct): string {
  if (!PLAIN_BUCKETS.has(bucket)) return bucket;
  const many = ingredientCount(p.ingredients) > 3;
  const hasAdditive = (p.additiveCount ?? 0) > 0;
  return many || hasAdditive ? PLAIN_TO_PROCESSED[bucket] : bucket;
}

// Order matters: the first matching rule wins, so more specific patterns come
// before the broader ones that would otherwise swallow them (fresh cheese
// before yellow/white cheese; energy drink before soft drink; etc.).
export const BUCKET_RULES: Array<[RegExp, string]> = [
  // ── Dairy ────────────────────────────────────────────────────────────
  [/kremost|cottage|fersk\s*ost|philadelphia|snofrisk|snøfrisk/i, "cheese-fresh"],
  [/brunost|brún?ost|prim|gudbrandsdalsost|geitost/i, "cheese-brown"],
  [/gulost|cheddar|jarlsberg|norvegia|gouda|edamer|skivet\s*ost/i, "cheese-yellow"],
  [/hvitost|brie|camembert|mozzarella|feta|parmesan|blåmuggost|blamuggost/i, "cheese-white"],
  [/yoghurt|skyr|kesam|kefir/i, "yoghurt"],
  [/r[øo]mme|creme\s*fraiche|crème\s*fra[îi]che/i, "sour-cream"],
  [/fl[øo]te|kremfl[øo]te|matfl[øo]te/i, "cream"],
  [/sm[øo]r|margarin|brelett/i, "butter-spread"],
  [/plantedrikk|havredrikk|mandeldrikk|soyadrikk|oatly/i, "plant-drink"],
  [/melk(?!esjokolade)/i, "milk"],

  // ── Fats & oils ──────────────────────────────────────────────────────
  [/olivenolje|rapsolje|solsikkeolje|matolje|kokosolje/i, "oil"],

  // ── Bakery & grains ──────────────────────────────────────────────────
  [/kn[ae]kkebr[øo]d|krisp|wasa/i, "crispbread"],
  [/br[øo]d|rundstykker|baguette|loff|toast/i, "bread"],
  [/tortilla|wrap|lomper|lefse|pitabr[øo]d/i, "flatbread"],
  [/frokostblanding|m[üu]sli|havregryn|cornflakes|granola/i, "cereal"],
  [/pasta|spaghetti|makaroni|penne|lasagneplater/i, "pasta"],
  [/\bris\b|jasminris|basmati|risotto/i, "rice"],
  [/mel\b|hvetemel|sammalt|bakepulver/i, "baking"],

  // ── Snacks & sweets ──────────────────────────────────────────────────
  [/potetgull|chips|snacks|ostepop|nachos/i, "crisps"],
  [/melkesjokolade|sjokolade|kvikk\s*lunsj|toblerone|freia/i, "chocolate"],
  [/godteri|seigmenn|vingummi|lakris|pastiller|smågodt|smagodt/i, "candy"],
  [/kjeks|biscuit|digestive|cookie/i, "biscuits"],
  [/n[øo]tter|peanøtter|cashew|mandler|pistasj/i, "nuts"],
  [/energibar|proteinbar|sjokoladebar/i, "snack-bar"],
  [/iskrem|is\b|saftis|softis/i, "ice-cream"],

  // ── Meat, fish, protein ──────────────────────────────────────────────
  [/leverpostei|p[åa]legg.*postei|kaviar/i, "pate"],
  [/spekem?at|salami|fenalår|spekeskinke|serranoskinke/i, "cured-meat"],
  [/p[øo]lse|wienerp[øo]lse|grillp[øo]lse|kj[øo]ttp[øo]lse/i, "sausage"],
  [/kj[øo]ttdeig|karbonadedeig|farse/i, "minced-meat"],
  [/kylling|kalkun|kyllingfilet/i, "poultry"],
  [/bacon|skinke|kokt\s*skinke/i, "ham-bacon"],
  [/biff|entrec[ôo]te|storfe|okse|svinekj[øo]tt|koteletter/i, "red-meat"],
  [/laks|[øo]rret|røkelaks/i, "salmon"],
  [/torsk|sei|hyse|fiskefilet|makrell|sild|tunfisk/i, "fish"],
  [/fiskekaker|fiskeboller|fiskepudding|fiskepinner/i, "fish-cakes"],
  [/reker|scampi|blåskjell/i, "shellfish"],
  [/tofu|falafel|vegetardeig|kj[øo]tterstatning|quorn/i, "meat-alt"],

  // ── Fruit, veg, pantry ───────────────────────────────────────────────
  [/frossen.*b[æa]r|frosne\s*b[æa]r|frossenb[æa]r/i, "frozen-fruit"],
  [/frossen.*gr[øo]nn|frosne\s*gr[øo]nn|wok|frossengr[øo]nn/i, "frozen-veg"],
  [/t[øo]rket|rosiner|aprikos|dadler/i, "dried-fruit"],
  [/hermetiske?\s*(tomat|bønner|mais|kikert)|bønner|kikerter|linser/i, "legumes-canned"],
  [/syltet[øo]y|marmelade|honning|nugatti|nutella|sjokoladep[åa]legg|hasseln[øo]ttkrem/i, "jam-honey"],
  [/pean[øo]ttsm[øo]r|nøttesmør/i, "nut-butter"],
  [/ketchup|sennep|majones|dressing|remulade/i, "condiment"],
  [/pastasaus|tomatsaus|salsa|pesto/i, "cooking-sauce"],
  [/suppe|buljong/i, "soup"],
  [/krydder|pepper|karri|paprikapulver|spisskummen/i, "spice"],
  [/sukker|farin|melis/i, "sugar"],
  [/salt\b/i, "salt"],

  // ── Drinks ───────────────────────────────────────────────────────────
  [/energidrikk|red\s*bull|monster|battery/i, "energy-drink"],
  [/brus|cola|sprite|fanta|solo/i, "soft-drink"],
  [/saft|squash|leskedrikk/i, "cordial"],
  [/juice|jus|smoothie/i, "juice"],
  [/\bvann\b|farris|imsdal|kildevann/i, "water"],
  [/kaffe|espresso|kaffekapsler/i, "coffee"],
  [/\bte\b|urtete/i, "tea"],
  [/[øo]l\b|pils|lager/i, "beer"],
  [/vin\b|r[øo]dvin|hvitvin/i, "wine"],

  // ── Prepared & misc ──────────────────────────────────────────────────
  [/frossenpizza|pizza/i, "pizza"],
  [/ferdigmiddag|ferdigrett|middagsrett|lasagne|gryte/i, "ready-meal"],
  [/barnemat|barnegr[øo]t|smoothie.*baby|velling/i, "baby-food"],
  [/egg\b/i, "eggs"],
];

/**
 * The bucket for a catalogue product (audit D3). Resolution order, most trusted
 * first, so a product's own NAME wins over the aisle the catalogue filed it in:
 *
 *   1. Name overrides — "kjeks" is a biscuit whatever the category says.
 *   2. Bucket rules against the NAME — the product names itself ("Jarlsberg").
 *   3. Bucket rules against the CATEGORY — the shelf, when the name is silent.
 *   4. Processed-protein guard — a "plain" bucket with a real ingredient list
 *      or any additive is not plain; move it to its processed sibling.
 *
 * Returns "unbucketed" when nothing matches — scored in limited-data mode
 * (never guessed into the nearest snack bucket), read by hand to grow the rules.
 */
export function bucketOf(p: CatalogueProduct): string {
  const name = (p.name ?? "").trim();
  const category = [p.category, p.subCategory].filter(Boolean).join(" ").trim();
  if (!name && !category) return "unbucketed";

  let bucket = "unbucketed";

  // 1 · name overrides win over everything.
  for (const [re, key] of NAME_OVERRIDES) {
    if (name && re.test(name)) { bucket = key; break; }
  }

  // 2 · rules against the name (the product naming itself).
  if (bucket === "unbucketed" && name) {
    for (const [re, key] of BUCKET_RULES) if (re.test(name)) { bucket = key; break; }
  }

  // 3 · rules against the catalogue category (the shelf).
  if (bucket === "unbucketed" && category) {
    for (const [re, key] of BUCKET_RULES) if (re.test(category)) { bucket = key; break; }
  }

  if (bucket === "unbucketed") return bucket;

  // 4 · processed-protein guard.
  return applyProcessedGuard(bucket, p);
}
