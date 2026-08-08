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
};

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
  [/syltet[øo]y|marmelade|honning/i, "jam-honey"],
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
 * The bucket for a catalogue product. Searches category, subCategory and name
 * (in that priority order, joined) against the rules. Returns "unbucketed" when
 * nothing matches — those are scored in limited-data mode (section 7) and read
 * by hand to grow the rule set (build order step 1).
 */
export function bucketOf(p: CatalogueProduct): string {
  const hay = [p.category, p.subCategory, p.name].filter(Boolean).join(" ");
  if (!hay.trim()) return "unbucketed";
  for (const [re, key] of BUCKET_RULES) if (re.test(hay)) return key;
  return "unbucketed";
}
