/**
 * Coarse category buckets.
 *
 * Kassalapp's taxonomy is deep and inconsistent: the same cheese can sit under
 * "Meieri > Ost > Skiveost" or just "Ost". Matching those paths against each
 * other with string containment fails almost always, which is why the swap
 * engine returned nothing. A bucket is the fix: a small, stable key that both
 * the scanned product and every candidate resolve to independently.
 *
 * Coarse beats precise here. "cheese-yellow" is a useful shelf; "cheddar" is
 * not — it would only ever find other cheddars, which is not an alternative.
 *
 * Order matters: the first matching pattern wins, so narrow buckets are listed
 * before the broad ones they would otherwise fall into (chocolate-milk before
 * milk, plant-milk before milk).
 */

export type Bucket = string;

/** [bucket key, pattern, optional exclusion] — first match wins. */
const RULES: Array<[Bucket, RegExp, RegExp?]> = [
  // ── Dairy ───────────────────────────────────────────────────────────────
  ["cheese-yellow",    /gulost|skiveost|cheddar|jarlsberg|norvegia|edamer|gouda|synn(o|ø)ve/],
  ["cheese-white",     /hvitost|fetaost|\bfeta\b|mozzarella|ricotta|chevre|brie|camembert/],
  ["cheese-cream",     /kremost|smøreost|philadelphia|snøfrisk|pr(i|í)m/],
  ["cheese-brown",     /brunost|gudbrandsdalsost|fl(o|ø)temysost/],
  ["cheese-grated",    /revet ost|revet cheddar|parmesan|grana/],
  ["yoghurt",          /yoghurt|skyr|kesam|cottage/],
  ["milk-plant",       /havremelk|mandelmelk|soyamelk|plantedrikk|oatly|barista/],
  ["milk-chocolate",   /sjokolademelk|kakaomelk|litago/],
  ["milk",             /\bmelk\b|lettmelk|helmelk|skummet/],
  ["cream",            /\bfl(o|ø)te\b|kremfl(o|ø)te|matfl(o|ø)te|rømme|creme fraiche/],
  ["butter-spread",    /\bsm(o|ø)r\b|margarin|brelett|vita|melange/],

  // ── Bread & baking ──────────────────────────────────────────────────────
  ["crispbread",       /knekkebr(o|ø)d|flatbr(o|ø)d|wasa|husman/],
  ["bread",            /\bbr(o|ø)d\b|loff|rundstykk|baguett|pitabr(o|ø)d|tortilla|lomper/],
  ["cereal",           /frokostblanding|cornflakes|m(u|ü)sli|granola|havregryn|weetabix/],
  ["crackers",         /kjeks|cracker|salt(kjeks|stang)/],

  // ── Protein ─────────────────────────────────────────────────────────────
  // Sweet spreads sit above cold-cuts on purpose: a jar of Nutella is filed
  // under "Søtpålegg", and the broad /pålegg/ cold-cuts rule would otherwise
  // swallow it. chocolate-spread is its own shelf (nobody swaps Nutella for
  // strawberry jam); each label below is also a real Kassalapp search term.
  ["chocolate-spread", /nugatti|nutella|sjokoladep(a|å)legg|hasseln(o|ø)ttkrem/],
  ["spread-sweet",     /syltet(o|ø)y|marmelade|honning|peanøttsm(o|ø)r/],
  ["sausage",          /p(o|ø)lse|wienerp(o|ø)lse|grillp(o|ø)lse|chorizo|salami/],
  ["cold-cuts",        /p(a|å)legg|skinke|servelat|leverpostei|salamip(a|å)legg|kjøttp(a|å)legg/],
  ["mince",            /kj(o|ø)ttdeig|karbonadedeig|farse|kj(o|ø)ttkaker/],
  ["chicken",          /kylling|kalkun/],
  ["red-meat",         /storfe|svin|biff|kotelett|lam\b|entrec(o|ô)te|indrefilet/],
  ["fish-fresh",       /laks|torsk|sei\b|(o|ø)rret|makrell(?!.*boks)|fiskefilet/],
  ["fish-canned",      /(makrell|sardin|tunfisk|sild).*(boks|tomat|olje)|kaviar/],
  ["fish-processed",   /fiskepudding|fiskekake|fiskepinne|surimi|krabbestang/],
  ["egg",              /\begg\b|eggehvite/],
  ["legumes",          /kikerter|linser|b(o|ø)nner|hummus|tofu|falafel/],

  // ── Pantry ──────────────────────────────────────────────────────────────
  ["oil",              /olivenolje|rapsolje|solsikkeolje|matolje|kokosolje/],
  ["pasta",            /pasta|spaghetti|makaroni|penne|fusilli|lasagneplat/],
  ["rice-grain",       /\bris\b|jasminris|basmati|couscous|bulgur|quinoa/],
  ["sauce-tomato",     /pastasaus|tomatsaus|passata|hermetiske tomater|tomatpur(e|é)/],
  ["sauce-cold",       /ketchup|majones|remulade|dressing|aioli|sennep|bearnaise/],
  ["soup-stock",       /suppe|buljong|fond\b|kraft\b/],
  ["ready-meal",       /ferdigrett|middagsrett|lasagne|pizza|wok\b|gryte\b/],

  // ── Snacks & sweets ─────────────────────────────────────────────────────
  ["crisps",           /potetgull|chips|nachos|ostepop|snacks/],
  ["nuts",             /n(o|ø)tter|mandler|cashew|peanøtter(?!.*sm(o|ø)r)|pistasj/],
  ["chocolate",        /sjokolade|kvikk lunsj|melkesjokolade|m(o|ø)rk sjokolade/],
  ["candy",            /godteri|seigmenn|drops|lakris|gel(e|é)|smågodt/],
  ["biscuits",         /kaker|boller|vafler|muffins|s(o|ø)te kjeks/],
  ["ice-cream",        /iskrem|\bis\b|softis|pinneis/],

  // ── Drinks ──────────────────────────────────────────────────────────────
  ["soda",             /brus|cola|solo|sprite|fanta|urge|energidrikk/],
  ["juice",            /juice|jus\b|nektar|smoothie/],
  ["water",            /vann\b|mineralvann|farris|kildevann/],
  ["coffee",           /kaffe|espresso|filtermalt|kaffekapsl/],
  ["tea",              /\bte\b|tepose|urtete/],

  // ── Produce & frozen ────────────────────────────────────────────────────
  ["vegetables",       /gr(o|ø)nnsak|gulr(o|ø)tter|brokkoli|paprika|salat|tomater(?!.*hermet)/],
  ["fruit",            /frukt|epler|bananer|appelsin|b(æ|ae)r|druer/],
  ["frozen-veg",       /fryst|frossen.*(gr(o|ø)nnsak|b(æ|ae)r)|ertert/],
  ["potato",           /potet(?!gull)|pommes frites|potetm(o|s)/],

  // ── Baby & special ──────────────────────────────────────────────────────
  ["baby-food",        /barnemat|grøt.*baby|smoothie.*baby|ella's|nestl(e|é)/],
  ["protein-products", /proteinbar|proteinpulver|proteinshake|\bwhey\b/]
];

/** Everything we can learn about a product's shelf, lowercased into one string. */
function haystack(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

/**
 * Resolve a product to a bucket key, or null when nothing matches.
 * Null is not a failure — it triggers the token-overlap fallback in
 * sameShelf(), which still finds sensible neighbours on unusual shelves.
 */
export function bucketOf(...parts: Array<string | null | undefined>): Bucket | null {
  const text = haystack(parts);
  if (!text) return null;
  for (const [key, pattern, exclude] of RULES) {
    if (pattern.test(text) && !(exclude && exclude.test(text))) return key;
  }
  return null;
}

const STOPWORDS = new Set([
  "og", "med", "uten", "fra", "til", "i", "på", "av", "the", "no",
  "kg", "g", "gr", "ml", "cl", "l", "stk", "pk", "pakke", "boks",
  "ny", "nye", "økologisk", "premium", "extra", "ekstra", "original"
]);

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[0-9]+([.,][0-9]+)?\s*(kg|g|gr|ml|cl|l|stk|%)/g, " ")
      .split(/[^a-zà-ÿæøå]+/i)
      .filter((word) => word.length >= 4 && !STOPWORDS.has(word))
  );
}

/**
 * Are these two products on the same shelf?
 *
 * Preferred path: both resolve to the same bucket. Fallback: meaningful token
 * overlap between category paths — deliberately loose, because the hard filters
 * downstream (score, worst metric) do the real quality work. A too-strict shelf
 * test is invisible; it just makes the feature look broken.
 */
export function sameShelf(
  scanned: { categories?: string | null; name?: string | null },
  candidate: { categories?: string[] | null; name?: string | null }
): boolean {
  const candidateCategories = (candidate.categories ?? []).join(" ");
  const a = bucketOf(scanned.categories, scanned.name);
  const b = bucketOf(candidateCategories, candidate.name);

  if (a && b) return a === b;
  if (a && !b) return false; // scanned shelf is known; candidate is not on it

  // Neither bucketed: fall back to category-token overlap.
  const scannedTokens = tokens(scanned.categories ?? "");
  const candidateTokens = tokens(candidateCategories);
  if (!scannedTokens.size || !candidateTokens.size) return false;
  for (const token of Array.from(candidateTokens)) if (scannedTokens.has(token)) return true;
  return false;
}

/**
 * Human-readable shelf name for the UI sentence
 * ("Looked at 30 yellow cheeses"). Keep these short and plain.
 */
export const BUCKET_LABELS: Record<string, { no: string; en: string }> = {
  "cheese-yellow": { no: "gulost", en: "yellow cheese" },
  "cheese-white": { no: "hvitost", en: "white cheese" },
  "cheese-cream": { no: "kremost", en: "cream cheese" },
  "cheese-brown": { no: "brunost", en: "brown cheese" },
  "cheese-grated": { no: "revet ost", en: "grated cheese" },
  yoghurt: { no: "yoghurt", en: "yoghurt" },
  "milk-plant": { no: "plantedrikk", en: "plant milk" },
  "milk-chocolate": { no: "sjokolademelk", en: "chocolate milk" },
  milk: { no: "melk", en: "milk" },
  cream: { no: "fløte", en: "cream" },
  "butter-spread": { no: "smør og margarin", en: "butter and spreads" },
  crispbread: { no: "knekkebrød", en: "crispbread" },
  bread: { no: "brød", en: "bread" },
  cereal: { no: "frokostblanding", en: "cereal" },
  crackers: { no: "kjeks", en: "crackers" },
  sausage: { no: "pølser", en: "sausages" },
  "cold-cuts": { no: "pålegg", en: "cold cuts" },
  mince: { no: "kjøttdeig", en: "mince" },
  chicken: { no: "kylling", en: "chicken" },
  "red-meat": { no: "rødt kjøtt", en: "red meat" },
  "fish-fresh": { no: "fersk fisk", en: "fresh fish" },
  "fish-canned": { no: "fisk på boks", en: "canned fish" },
  "fish-processed": { no: "fiskemat", en: "processed fish" },
  egg: { no: "egg", en: "eggs" },
  legumes: { no: "belgfrukter", en: "legumes" },
  oil: { no: "matolje", en: "cooking oil" },
  pasta: { no: "pasta", en: "pasta" },
  "rice-grain": { no: "ris og korn", en: "rice and grains" },
  "sauce-tomato": { no: "tomatsaus", en: "tomato sauce" },
  "sauce-cold": { no: "kalde sauser", en: "cold sauces" },
  "soup-stock": { no: "suppe og buljong", en: "soup and stock" },
  "ready-meal": { no: "ferdigretter", en: "ready meals" },
  "chocolate-spread": { no: "sjokoladepålegg", en: "chocolate spread" },
  "spread-sweet": { no: "syltetøy", en: "jam and honey" },
  crisps: { no: "potetgull", en: "crisps" },
  nuts: { no: "nøtter", en: "nuts" },
  chocolate: { no: "sjokolade", en: "chocolate" },
  candy: { no: "godteri", en: "sweets" },
  biscuits: { no: "kaker og kjeks", en: "cakes and biscuits" },
  "ice-cream": { no: "iskrem", en: "ice cream" },
  soda: { no: "brus", en: "soft drinks" },
  juice: { no: "juice", en: "juice" },
  water: { no: "vann", en: "water" },
  coffee: { no: "kaffe", en: "coffee" },
  tea: { no: "te", en: "tea" },
  vegetables: { no: "grønnsaker", en: "vegetables" },
  fruit: { no: "frukt", en: "fruit" },
  "frozen-veg": { no: "fryste grønnsaker", en: "frozen vegetables" },
  potato: { no: "poteter", en: "potatoes" },
  "baby-food": { no: "barnemat", en: "baby food" },
  "protein-products": { no: "proteinprodukter", en: "protein products" }
};

export function shelfLabel(bucket: Bucket | null, lang: "no" | "en"): string | null {
  if (!bucket) return null;
  return BUCKET_LABELS[bucket]?.[lang] ?? null;
}
