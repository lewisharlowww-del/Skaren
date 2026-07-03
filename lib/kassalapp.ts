import type { GradeLetter, KassalappNutrition, ProductResult, ProductStore, StorePrice } from "@/lib/types";
import {
  calculateHealthGrade,
  hasNokkelhullLabel,
  nutritionDataFromKassalapp
} from "@/lib/healthscore";

type KassalappStorePrice = {
  price?: number | string | null;
  store?: string | { name?: string | null; logo?: string | null; code?: string | null } | null;
  store_name?: string | null;
  name?: string | null;
  store_logo?: string | null;
  logo?: string | null;
  currency?: string | null;
};

type KassalappProduct = {
  id?: number | null;
  name?: string | null;
  vendor?: string | null;
  brand?: string | null;
  image?: string | null;
  images?: Array<string | { url?: string | null; image?: string | null; src?: string | null }> | null;
  image_url?: string | null;
  imageUrl?: string | null;
  photo?: string | null;
  thumbnail?: string | null;
  url?: string | null;
  ean?: string | number | null;
  barcode?: string | number | { ean?: string | number | null } | null;
  store_prices?: KassalappStorePrice[] | null;
  store?: { name?: string | null; code?: string | null; logo?: string | null } | null;
  current_price?: number | string | null;
  ingredients?: string | null;
  ingredient_list?: string | null;
  ingredientList?: string | null;
  category?:
    | string
    | { name?: string | null; display_name?: string | null }
    | Array<string | { name?: string | null; display_name?: string | null }>
    | null;
  category_name?: string | null;
  categories?: Array<string | { name?: string | null; display_name?: string | null }> | string | null;
  product_category?: string | null;
  nutrition?: Array<{
    code?: string | null;
    display_name?: string | null;
    amount?: number | string | null;
    unit?: string | null;
  }> | null;
  allergens?: Array<{
    code?: string | null;
    display_name?: string | null;
    contains?: string | null;
  }> | null;
  labels?: Array<{
    name?: string | null;
    display_name?: string | null;
  }> | null;
};

type KassalappResponse = KassalappProduct | {
  data?: (KassalappProduct & { products?: KassalappProduct[] | null }) | null;
  product?: KassalappProduct | null;
};

type KassalappSearchResponse = {
  data?: KassalappProduct[] | {
    data?: KassalappProduct[] | null;
    items?: KassalappProduct[] | null;
    products?: KassalappProduct[] | null;
  } | null;
  items?: KassalappProduct[] | null;
  products?: KassalappProduct[] | null;
};

export type KassalappSearchProduct = {
  barcode: string | null;
  name: string;
  brand: string;
  image: string | null;
  categories: string[];
  healthGrade: GradeLetter | null;
};

export class KassalappLookupError extends Error {
  constructor(message = "Kassalapp lookup failed.") {
    super(message);
    this.name = "KassalappLookupError";
  }
}

export class KassalappSearchError extends Error {
  constructor(
    message = "Kassalapp search failed.",
    public readonly status?: number,
    public readonly details?: string
  ) {
    super(message);
    this.name = "KassalappSearchError";
  }
}

function firstText(...values: Array<string | number | null | undefined>) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }

  return null;
}

function normalizeImageUrl(value?: string | null) {
  const image = value?.trim();
  if (!image) return null;
  if (image.startsWith("//")) return `https:${image}`;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  return null;
}

function imageFromProduct(product: KassalappProduct) {
  const firstImage = product.images?.[0];
  const imageFromList = typeof firstImage === "string"
    ? firstImage
    : firstText(firstImage?.url, firstImage?.image, firstImage?.src);

  return normalizeImageUrl(product.image)
    ?? normalizeImageUrl(product.image_url)
    ?? normalizeImageUrl(product.imageUrl)
    ?? normalizeImageUrl(product.photo)
    ?? normalizeImageUrl(product.thumbnail)
    ?? normalizeImageUrl(imageFromList);
}

function barcodeFromProduct(product: KassalappProduct) {
  const nestedBarcode =
    typeof product.barcode === "object" && product.barcode
      ? product.barcode.ean
      : product.barcode;

  return firstText(product.ean, nestedBarcode);
}

export function cleanForKassalappSearch(name: string): string {
  return name
    .replace(/\d+(?:[.,]\d+)?\s*(g|kg|ml|l|cl|stk|pk)\b/gi, "")
    .replace(/\b(small|large|extra)\b/gi, "")
    .replace(/[^A-Za-z0-9ÆØÅæøåÄÖÜäöüÉÈéè\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueSearchTerms(terms: string[]) {
  const seen = new Set<string>();

  return terms
    .map((term) => term.replace(/\s+/g, " ").trim())
    .filter((term) => {
      const key = term.toLowerCase();
      if (!term || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

const englishToNorwegianSearchTerms: Record<string, string[]> = {
  milk: ["melk"],
  "whole milk": ["helmelk"],
  "low fat milk": ["lettmelk"],
  yogurt: ["yoghurt", "yogurt"],
  yoghurt: ["yoghurt"],
  cheese: ["ost"],
  butter: ["smør"],
  cream: ["fløte"],
  chicken: ["kylling"],
  beef: ["storfe", "kjøttdeig"],
  meat: ["kjøtt"],
  mince: ["kjøttdeig"],
  salmon: ["laks"],
  fish: ["fisk"],
  bread: ["brød"],
  egg: ["egg"],
  eggs: ["egg"],
  juice: ["juice"],
  soda: ["brus"],
  water: ["vann"],
  chocolate: ["sjokolade"],
  coffee: ["kaffe"],
  tea: ["te"],
  apple: ["eple"],
  banana: ["banan"],
  orange: ["appelsin"],
  potato: ["potet"],
  tomato: ["tomat"],
  pasta: ["pasta"],
  rice: ["ris"],
  cereal: ["frokostblanding"],
  ham: ["skinke"],
  sausage: ["pølse"],
  onion: ["løk"],
  carrot: ["gulrot"],
  cucumber: ["agurk"],
  pepper: ["paprika"],
  "sour cream": ["rømme"],
  "minced meat": ["kjøttdeig"],
  "ground beef": ["kjøttdeig", "storfe"],
  shrimp: ["reker"],
  prawns: ["reker"],
  cod: ["torsk"],
  pork: ["svin"]
};

// Broad Norwegian staple queries that are really an umbrella for several
// specific product types. Kassalapp searches product names literally, and a
// carton of milk is named "Helmelk"/"Lettmelk" (its type), not "Melk" - so a
// plain "melk" search misses the Tine/Q cartons people actually buy. Fan the
// query out to the concrete subtypes so those staples surface. Keep the lists
// short: each extra term is an additional upstream request.
const norwegianStapleExpansions: Record<string, string[]> = {
  // Dairy & eggs
  melk: ["helmelk", "lettmelk", "skummet melk", "ekstra lettmelk"],
  ost: ["gulost", "hvitost", "brunost", "revet ost"],
  yoghurt: ["yoghurt naturell", "gresk yoghurt", "drikkeyoghurt"],
  fløte: ["kremfløte", "matfløte"],
  rømme: ["seterrømme", "lettrømme"],
  smør: ["meierismør", "bremykt", "meierismor"],
  egg: ["frokostegg", "egg frittgående", "økologiske egg"],

  // Bakery
  brød: ["grovbrød", "loff", "rugbrød", "kneippbrød"],
  rundstykker: ["grove rundstykker", "rundstykker fine"],

  // Meat & fish
  kylling: ["kyllingfilet", "kyllinglår", "kylling hel"],
  kjøttdeig: ["karbonadedeig", "kjøttdeig storfe"],
  fisk: ["torsk", "sei", "fiskefilet", "laks"],
  laks: ["laksefilet", "røkt laks"],
  pølse: ["grillpølse", "wienerpølse", "kjøttpølse"],
  bacon: ["bacon strimlet"],
  skinke: ["kokt skinke", "spekeskinke"],

  // Produce (Norwegian nouns are usually pluralised on the shelf)
  eple: ["epler"],
  banan: ["bananer"],
  appelsin: ["appelsiner"],
  tomat: ["tomater", "cherrytomater"],
  potet: ["poteter", "mandelpotet"],
  løk: ["gul løk", "rødløk"],
  gulrot: ["gulrøtter"],
  agurk: ["slangeagurk"],
  paprika: ["paprika rød"],

  // Pantry
  pasta: ["spaghetti", "makaroni", "fusilli"],
  ris: ["jasminris", "basmatiris", "langkornet ris"],
  juice: ["appelsinjuice", "eplejuice"],
  brus: ["cola", "brus sukkerfri"],
  kaffe: ["filtermalt kaffe", "kaffe bønner", "kokmalt kaffe"],
  te: ["te poser", "grønn te"]
};

function expandKassalappSearchQueries(query: string) {
  const cleanedQuery = cleanForKassalappSearch(query);
  const normalized = cleanedQuery.toLowerCase();
  const aliases = englishToNorwegianSearchTerms[normalized] ?? [];
  const words = normalized.split(" ").filter(Boolean);
  const translatedWords = words.map(
    (word) => englishToNorwegianSearchTerms[word]?.[0] ?? word
  );
  const translatedPhrase =
    translatedWords.some((word, index) => word !== words[index])
      ? translatedWords.join(" ")
      : "";
  const wordAliases = words.flatMap(
    (word) => englishToNorwegianSearchTerms[word] ?? []
  );

  // If the query (or its Norwegian translation) is a broad staple, also search
  // its concrete subtypes so e.g. "melk"/"milk" surfaces Helmelk & Lettmelk.
  const stapleKeys = [normalized, ...aliases, ...translatedWords];
  const stapleExpansions = stapleKeys.flatMap(
    (key) => norwegianStapleExpansions[key] ?? []
  );

  return uniqueSearchTerms([
    ...aliases,
    translatedPhrase,
    ...wordAliases,
    cleanedQuery || query,
    ...stapleExpansions
  ]);
}

function normalizeStoreName(value: KassalappStorePrice) {
  if (typeof value.store === "string") return value.store.trim();
  return firstText(value.store?.name, value.store_name, value.name) ?? "Store";
}

function normalizeStoreLogo(value: KassalappStorePrice) {
  if (typeof value.store === "string") return normalizeImageUrl(value.store_logo ?? value.logo);
  return normalizeImageUrl(value.store?.logo) ?? normalizeImageUrl(value.store_logo) ?? normalizeImageUrl(value.logo);
}

function normalizePrice(value: KassalappStorePrice) {
  const rawPrice = typeof value.price === "string" ? Number(value.price.replace(",", ".")) : value.price;
  return typeof rawPrice === "number" && Number.isFinite(rawPrice) ? rawPrice : null;
}

function normalizeStorePrices(values?: KassalappStorePrice[] | null): StorePrice[] {
  return (values ?? [])
    .map((value) => {
      const price = normalizePrice(value);
      if (price === null) return null;

      return {
        store: normalizeStoreName(value),
        storeLogo: normalizeStoreLogo(value),
        price,
        currency: "NOK" as const
      };
    })
    .filter((value): value is StorePrice => Boolean(value))
    .sort((a, b) => a.price - b.price)
    .slice(0, 3);
}

function normalizeProductStore(product: KassalappProduct): ProductStore | null {
  const name = firstText(product.store?.name);
  if (!name) return null;

  return {
    name,
    code: firstText(product.store?.code),
    logo: normalizeImageUrl(product.store?.logo)
  };
}

function normalizeCurrentPrice(product: KassalappProduct) {
  const rawPrice = typeof product.current_price === "string" ? Number(product.current_price.replace(",", ".")) : product.current_price;
  return typeof rawPrice === "number" && Number.isFinite(rawPrice) ? rawPrice : null;
}

function priceFromProduct(product: KassalappProduct): KassalappStorePrice | null {
  const price = normalizeCurrentPrice(product);
  if (price === null) return null;

  return {
    price,
    store: product.store ?? null
  };
}

function normalizeAllergens(values?: KassalappProduct["allergens"]) {
  return (values ?? [])
    .filter((allergen) => allergen.contains?.toUpperCase() === "YES")
    .map((allergen) => firstText(allergen.display_name, allergen.code))
    .filter((value): value is string => Boolean(value));
}

function normalizeLabels(values?: KassalappProduct["labels"]) {
  return (values ?? [])
    .map((label) => firstText(label.display_name, label.name))
    .filter((value): value is string => Boolean(value));
}

function normalizeCategories(product: KassalappProduct) {
  const rawCategories = Array.isArray(product.categories)
    ? product.categories
    : product.categories
      ? [product.categories]
      : [];
  // Kassalapp's search API returns `category` as an ARRAY of taxonomy nodes
  // ({ id, depth, name }), while the single-product API returns a single object
  // or string. Flatten both shapes so we never end up with a nested array that
  // silently drops every category name.
  const rawCategory = Array.isArray(product.category)
    ? product.category
    : product.category
      ? [product.category]
      : [];

  return uniqueByText(
    [
      ...rawCategories,
      ...rawCategory,
      product.category_name,
      product.product_category
    ]
      .map((category) => {
        if (typeof category === "string" || typeof category === "number") return firstText(category);
        return firstText(category?.display_name, category?.name);
      })
      .filter((value): value is string => Boolean(value)),
    (category) => category
  );
}

function normalizeNutrition(values?: KassalappProduct["nutrition"]): KassalappNutrition[] {
  return (values ?? [])
    .map((item) => {
      const code = firstText(item.code);
      const displayName = firstText(item.display_name, item.code);
      const amount = typeof item.amount === "string" ? Number(item.amount.replace(",", ".")) : item.amount;
      const unit = firstText(item.unit) ?? "";

      if (!code || !displayName || typeof amount !== "number" || !Number.isFinite(amount)) return null;

      return {
        code,
        displayName,
        amount,
        unit
      };
    })
    .filter((value): value is KassalappNutrition => Boolean(value));
}

// Compute a health grade directly from a raw Kassalapp product. The search
// payload already carries nutrition/labels/category, so we can grade every
// result without an extra per-product API call. Returns null when there is no
// nutrition signal to grade against.
function healthGradeFromRawProduct(product: KassalappProduct): GradeLetter | null {
  const nutrition = normalizeNutrition(product.nutrition);
  const labels = normalizeLabels(product.labels);

  if (nutrition.length === 0 && !hasNokkelhullLabel(labels)) return null;

  const categories = normalizeCategories(product);

  return calculateHealthGrade({
    nutrition: nutritionDataFromKassalapp(nutrition),
    labels,
    category: categories.join(" ")
  });
}

function uniqueByText<T>(values: T[], getKey: (value: T) => string) {
  const seen = new Set<string>();

  return values.filter((value) => {
    const key = getKey(value).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function unwrapKassalappProducts(data: KassalappResponse): { ean: string | null; products: KassalappProduct[] } {
  if ("data" in data && data.data?.products?.length) {
    return {
      ean: barcodeFromProduct(data.data),
      products: [data.data, ...data.data.products]
    };
  }

  if ("data" in data && data.data) {
    return {
      ean: barcodeFromProduct(data.data),
      products: [data.data]
    };
  }

  if ("product" in data && data.product) {
    return {
      ean: barcodeFromProduct(data.product),
      products: [data.product]
    };
  }

  if ("name" in data || "ean" in data || "image" in data) {
    return {
      ean: barcodeFromProduct(data),
      products: [data]
    };
  }

  return { ean: null, products: [] };
}

function unwrapKassalappSearchProducts(data: KassalappSearchResponse): KassalappProduct[] {
  if (Array.isArray(data.data)) return data.data;
  if (data.data?.data?.length) return data.data.data;
  if (data.data?.items?.length) return data.data.items;
  if (data.data?.products?.length) return data.data.products;
  if (data.items?.length) return data.items;
  if (data.products?.length) return data.products;
  return [];
}

export function getCategoryEmoji(categories: string) {
  const text = categories.toLowerCase();
  if (text.includes("chocolate") || text.includes("sweet") || text.includes("spread")) return "🍫";
  if (text.includes("drink") || text.includes("beverage") || text.includes("soda") || text.includes("water")) return "🥤";
  if (text.includes("cosmetic") || text.includes("beauty") || text.includes("cream")) return "🧴";
  if (text.includes("milk") || text.includes("dairy")) return "🥛";
  if (text.includes("bread") || text.includes("bakery") || text.includes("cereal")) return "🍞";
  if (text.includes("clean") || text.includes("detergent") || text.includes("household")) return "🧹";
  if (text.includes("meat") || text.includes("sausage") || text.includes("chicken")) return "🥩";
  if (text.includes("fruit") || text.includes("vegetable")) return "🥦";
  if (text.includes("coffee") || text.includes("tea")) return "☕";
  if (text.includes("cheese")) return "🧀";
  if (text.includes("fish") || text.includes("seafood")) return "🐟";
  if (text.includes("oil") || text.includes("sauce")) return "🫙";
  return "🌿";
}

export function getProductEmoji(value: string) {
  const text = value.toLowerCase();
  if (text.includes("chocolate") || text.includes("hazelnut")) return "🍫";
  if (text.includes("milk") || text.includes("dairy")) return "🥛";
  if (text.includes("organic") || text.includes("grain") || text.includes("oat") || text.includes("cereal")) return "🌾";
  if (text.includes("nut") || text.includes("butter")) return "🥜";
  if (text.includes("cosmetic") || text.includes("cream") || text.includes("lotion")) return "🧴";
  if (text.includes("meat") || text.includes("sausage") || text.includes("beef") || text.includes("pølse")) return "🥩";
  if (text.includes("coffee")) return "☕";
  if (text.includes("cheese")) return "🧀";
  if (text.includes("fish")) return "🐟";
  if (text.includes("sauce") || text.includes("oil")) return "🫙";
  return "🌿";
}

export function getVerifiedDisplayImage(product: Pick<ProductResult, "image" | "categories">) {
  const placeholderEmoji = getCategoryEmoji(product.categories);

  if (product.image) {
    return {
      displayImage: product.image,
      displayImageSource: "kassalapp" as const,
      placeholderEmoji
    };
  }

  return {
    displayImage: null,
    displayImageSource: "placeholder" as const,
    placeholderEmoji
  };
}

export async function fetchKassalappProduct(barcode: string) {
  const apiKey = process.env.KASSALAPP_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`https://kassal.app/api/v1/products/ean/${barcode.trim()}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      cache: "no-store",
      signal: controller.signal
    });

    if (response.status === 404) return null;
    if (!response.ok) throw new KassalappLookupError();

    const { ean, products } = unwrapKassalappProducts((await response.json()) as KassalappResponse);
    const rawProduct = products.find((product) => firstText(product.name) && imageFromProduct(product))
      ?? products.find((product) => firstText(product.name))
      ?? null;
    if (!rawProduct) return null;

    const name = firstText(rawProduct.name);
    if (!name) return null;
    const storePrices = [
      ...normalizeStorePrices(rawProduct.store_prices),
      ...normalizeStorePrices(products.map(priceFromProduct).filter((value): value is KassalappStorePrice => Boolean(value)))
    ]
      .filter((value, index, values) => values.findIndex((candidate) => candidate.store === value.store && candidate.price === value.price) === index)
      .sort((a, b) => a.price - b.price)
      .slice(0, 3);

    const allNutrition = uniqueByText(
      products.flatMap((product) => normalizeNutrition(product.nutrition)),
      (nutrition) => `${nutrition.code}-${nutrition.displayName}-${nutrition.unit}`
    );
    const allAllergens = uniqueByText(
      products.flatMap((product) => normalizeAllergens(product.allergens)),
      (allergen) => allergen
    );
    const allLabels = uniqueByText(
      products.flatMap((product) => normalizeLabels(product.labels)),
      (label) => label
    );
    const allCategories = uniqueByText(
      products.flatMap((product) => normalizeCategories(product)),
      (category) => category
    );
    const firstProductWithCurrentPrice = products.find((product) => normalizeCurrentPrice(product) !== null);
    const firstProductWithStore = products.find((product) => normalizeProductStore(product));

    return {
      barcode: ean ?? barcodeFromProduct(rawProduct) ?? barcode.trim(),
      name,
      brand: firstText(rawProduct.brand, rawProduct.vendor) ?? "Brand not listed",
      ingredients: firstText(rawProduct.ingredientList, rawProduct.ingredient_list, rawProduct.ingredients),
      image: imageFromProduct(rawProduct),
      storePrices,
      currentPrice: normalizeCurrentPrice(rawProduct) ?? (firstProductWithCurrentPrice ? normalizeCurrentPrice(firstProductWithCurrentPrice) : null),
      store: normalizeProductStore(rawProduct) ?? (firstProductWithStore ? normalizeProductStore(firstProductWithStore) : null),
      allergens: allAllergens,
      labels: allLabels,
      categories: allCategories,
      nutrition: allNutrition
    };
  } catch (error) {
    if (error instanceof KassalappLookupError) throw error;
    throw new KassalappLookupError();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchKassalappImageByEan(ean: string) {
  const product = await fetchKassalappProduct(ean).catch(() => null);
  const image = product?.image ?? null;
  return image;
}

// Score how well a search result matches the user's query, so the actual
// product they typed (e.g. plain "melk"/milk) ranks above derivatives that
// merely contain the word (melkesjokolade/milk chocolate, melkefri/milk-free,
// melkepulver/milk powder). Higher is better.
//
// The strongest signal is Kassalapp's own category tree: a carton of milk sits
// in the "Melk" category, while milk chocolate sits under "Sjokolade". We also
// reward the query appearing as a standalone word and penalise "without X"
// products and clearly-unrelated categories.
const RELEVANCE_DERIVATIVE_CATEGORIES = [
  "sjokolade",
  "kjeks",
  "cookies",
  "snacks",
  "godteri",
  "dessert",
  "iskrem",
  "baking",
  "pølser",
  "kaker"
];

// Flavoured / sweetened variants of a plain staple. When someone searches for a
// base product ("melk"/milk) we still want to show these (they sit in the right
// category), but the plain version should come first. Chocolate milk lives in
// the "Sjokolademelk" category and its name carries these cues.
const RELEVANCE_FLAVOURED_VARIANTS = [
  "sjokolade",
  "sjoko",
  "vanilje",
  "jordbær",
  "banan",
  "birthday",
  "cookies",
  "karamell"
];

function tokenize(value: string): string[] {
  return value.toLowerCase().match(/[a-zæøå0-9]+/g) ?? [];
}

// Norwegian nouns inflect ("banan" -> "bananer"/"bananen", "eple" -> "epler").
// Treat a word as matching the query when it equals the query or is the query
// plus a short inflection suffix, so "Bananer" still matches a "banan" search.
const NORWEGIAN_INFLECTION_SUFFIXES = ["", "en", "et", "er", "ene", "a", "n"];

function wordMatchesQuery(word: string, query: string): boolean {
  if (word === query) return true;
  if (word.length <= query.length || !word.startsWith(query)) return false;
  const suffix = word.slice(query.length);
  return NORWEGIAN_INFLECTION_SUFFIXES.includes(suffix);
}

function scoreSearchRelevanceForTerm(
  product: Pick<KassalappSearchProduct, "name" | "categories" | "image">,
  query: string
): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  const name = product.name.toLowerCase();
  const nameWords = tokenize(name);
  const categories = product.categories.map((category) => category.toLowerCase());
  const categoryWords = categories.flatMap((category) => tokenize(category));
  const categoryText = categories.join(" ");

  let score = 0;

  // Strongest signal: a product category matches the query (e.g. query "melk"
  // and category "Melk", or "banan" and "Bananer"), which is Kassalapp's own
  // taxonomy. Matching accounts for Norwegian noun inflection.
  if (categoryWords.some((word) => wordMatchesQuery(word, q))) score += 100;
  // Softer: the query appears somewhere inside the category path.
  else if (categoryText.includes(q)) score += 20;

  // The query matches a standalone word in the product name (inflection-aware).
  if (nameWords.some((word) => wordMatchesQuery(word, q))) score += 40;

  // The product name starts with the query word.
  if (name === q || name.startsWith(`${q} `)) score += 25;

  // "Uten melk" / "melkefri" / "u/melk" are explicitly WITHOUT the thing.
  if (new RegExp(`(^|\\s)(u/|uten\\s|${q}fri\\b)`).test(name)) score -= 60;

  // The query is only a substring of a bigger, unrelated word (melkepulver,
  // melkesjokolade) rather than a matching word: usually a derivative product.
  if (
    name.includes(q) &&
    !nameWords.some((word) => wordMatchesQuery(word, q))
  ) {
    score -= 20;
  }

  // Clearly-different product categories that merely reference the query word.
  if (RELEVANCE_DERIVATIVE_CATEGORIES.some((category) => categoryText.includes(category))) {
    score -= 35;
  }

  // Flavoured variant of the queried staple (e.g. chocolate milk for "melk"):
  // keep it in the results but rank plain versions ahead of it. We never treat
  // the query itself as a "flavour", so searching "banan" or "jordbær" still
  // ranks those fruits normally.
  if (
    RELEVANCE_FLAVOURED_VARIANTS.some(
      (flavour) =>
        !q.includes(flavour) &&
        (categoryText.includes(flavour) || name.includes(flavour))
    )
  ) {
    score -= 45;
  }

  // Tiny tie-breaker so a result with a usable image edges out one without.
  if (product.image) score += 3;

  return score;
}

// Public relevance score. Accepts the user's query plus any expanded Norwegian
// terms (e.g. "milk" -> ["melk"], "melk" -> ["helmelk", "lettmelk", ...]) and
// returns the best score across all of them. This keeps English and broad
// staple searches ranking the actual Norwegian products first, since the
// underlying product data is Norwegian.
export function scoreSearchRelevance(
  product: Pick<KassalappSearchProduct, "name" | "categories" | "image">,
  query: string,
  extraTerms: string[] = []
): number {
  const terms = uniqueSearchTerms([query, ...extraTerms]);
  return terms.reduce(
    (best, term) => Math.max(best, scoreSearchRelevanceForTerm(product, term)),
    Number.NEGATIVE_INFINITY
  );
}

// Map over items with bounded concurrency. Kassalapp rate-limits bursts, so we
// cannot fire every expansion request at once (that returns HTTP 429), but we
// also do not want to wait for them one at a time. A small pool keeps search
// fast while staying under the limit.
async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<Array<PromiseSettledResult<R>>> {
  const results: Array<PromiseSettledResult<R>> = new Array(items.length);
  let cursor = 0;

  async function runNext(): Promise<void> {
    const index = cursor++;
    if (index >= items.length) return;
    try {
      results[index] = { status: "fulfilled", value: await worker(items[index], index) };
    } catch (reason) {
      results[index] = { status: "rejected", reason };
    }
    await runNext();
  }

  const pool = Array.from(
    { length: Math.min(Math.max(1, concurrency), items.length || 1) },
    () => runNext()
  );
  await Promise.all(pool);
  return results;
}

export async function searchKassalappProducts(
  query: string,
  limit = 6,
  options: { categoryId?: number; category?: string; includeBrandMatch?: boolean } = {}
): Promise<KassalappSearchProduct[]> {
  const apiKey = process.env.KASSALAPP_API_KEY;
  if (!apiKey) return [];

  try {
    const searchQueries = expandKassalappSearchQueries(query);
    const requests: Array<{ search?: string; brand?: string }> = [
      ...searchQueries.map((search) => ({ search })),
      ...(options.includeBrandMatch ? [{ brand: query.trim() }] : [])
    ];

    const size = String(Math.min(100, Math.max(limit, 6)));

    // Run expansion requests with a small concurrency pool: parallel enough to
    // stay fast, bounded enough to avoid Kassalapp's burst rate limit (60/min).
    // A single failed sub-request should not fail the whole search.
    const settled = await mapWithConcurrency(requests, 2, async (searchRequest) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const url = new URL("https://kassal.app/api/v1/products");
        if (searchRequest.search) {
          url.searchParams.set("search", searchRequest.search);
        }
        if (searchRequest.brand) {
          url.searchParams.set("brand", searchRequest.brand);
        }
        if (options.categoryId) {
          url.searchParams.set("category_id", String(options.categoryId));
        }
        if (options.category) {
          url.searchParams.set("category", options.category);
        }
        url.searchParams.set("unique", "1");
        url.searchParams.set("exclude_without_ean", "1");
        url.searchParams.set("size", size);

        try {
          const response = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
            // Kassalapp allows only 60 requests/minute and each search fans out
            // into several sub-requests. Product results are stable for a long
            // time, so cache each upstream request in Next's Data Cache for an
            // hour. Popular staples ("melk", "brød"...) then cost zero requests
            // against the rate budget after the first lookup.
            next: { revalidate: 3600 },
            signal: controller.signal
          });

          if (!response.ok) {
            const details = await response.text().catch(() => "");
            console.error(
              "[Kassalapp] Search failed:",
              response.status,
              searchRequest.search ?? searchRequest.brand ?? `category ${options.categoryId ?? options.category ?? ""}`
            );
            throw new KassalappSearchError("Kassalapp search failed.", response.status, details);
          }

          const rawResponse = (await response.json()) as KassalappSearchResponse;
          return unwrapKassalappSearchProducts(rawResponse)
            .map<KassalappSearchProduct | null>((product) => {
              const name = firstText(product.name);
              const barcode = barcodeFromProduct(product);
              if (!name || !barcode) return null;

              return {
                barcode,
                name,
                brand: firstText(product.brand, product.vendor) ?? "Brand not listed",
                image: imageFromProduct(product),
                categories: normalizeCategories(product),
                healthGrade: healthGradeFromRawProduct(product)
              };
            })
            .filter((product): product is KassalappSearchProduct => Boolean(product));
        } finally {
          clearTimeout(timeout);
        }
      });

    // If every request failed, surface the first error so callers can react
    // (e.g. show "search unavailable"); a partial failure just yields fewer
    // results.
    const fulfilled = settled.filter(
      (outcome): outcome is PromiseFulfilledResult<KassalappSearchProduct[]> =>
        outcome.status === "fulfilled"
    );
    if (fulfilled.length === 0) {
      const firstRejection = settled.find(
        (outcome): outcome is PromiseRejectedResult => outcome.status === "rejected"
      );
      if (firstRejection) throw firstRejection.reason;
    }

    const results = fulfilled.flatMap((outcome) => outcome.value);

    return uniqueByText(results, (product) => product.barcode ?? product.name)
      .map((product) => ({
        product,
        // Score against the query and its Norwegian expansions so English and
        // broad staple searches still rank the actual products first.
        relevance: scoreSearchRelevance(product, query, searchQueries)
      }))
      .sort((a, b) => {
        // Primary: relevance to the typed query (actual product over derivatives).
        if (a.relevance !== b.relevance) return b.relevance - a.relevance;
        // Tie-break: results that start with the query, then those with an image.
        const aStartsWith = a.product.name.toLowerCase().startsWith(query.toLowerCase());
        const bStartsWith = b.product.name.toLowerCase().startsWith(query.toLowerCase());
        if (aStartsWith !== bStartsWith) return Number(bStartsWith) - Number(aStartsWith);
        return Number(Boolean(b.product.image)) - Number(Boolean(a.product.image));
      })
      .map(({ product }) => product)
      .slice(0, limit);
  } catch (error) {
    console.error("[Kassalapp] Search error:", error instanceof Error ? error.message : String(error));
    if (error instanceof KassalappSearchError) throw error;
    throw new KassalappSearchError();
  }
}
