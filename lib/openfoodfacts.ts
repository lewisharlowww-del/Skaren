import { analyzeAdditives } from "@/lib/additives";
import { getEcoGrade, getNutritionGrade, getProductSkarenScore, normalizeEcoGrade } from "@/lib/ecoscore";
import { calculateHealthGrade } from "@/lib/healthscore";
import type { ProductResult } from "@/lib/types";

type OpenFoodFactsProduct = {
  product_name?: string;
  product_name_en?: string;
  abbreviated_product_name?: string;
  brands?: string;
  brands_tags?: string[];
  categories?: string;
  categories_tags?: string[];
  categories_hierarchy?: string[];
  ecoscore_grade?: string;
  ecoscore_score?: number;
  ecoscore_data?: {
    grade?: string;
    score?: number;
    [key: string]: unknown;
  };
  environment_impact_level?: string;
  environment_impact_level_tags?: string[];
  ecoscore_tags?: string[];
  nutriscore_grade?: string;
  nutrition_grades?: string;
  packaging?: string;
  packaging_text?: string;
  packaging_tags?: string[];
  origins?: string;
  origins_tags?: string[];
  countries?: string;
  countries_tags?: string[];
  manufacturing_places?: string;
  ingredients_text?: string;
  ingredients_text_en?: string;
  additives_tags?: string[];
  nova_group?: number | string;
};

type OpenFoodFactsResponse = {
  status: number;
  product?: OpenFoodFactsProduct;
};

const countryTranslations: Record<string, string> = {
  italie: "Italy",
  allemagne: "Germany",
  espagne: "Spain",
  "royaume uni": "United Kingdom",
  "pays bas": "Netherlands",
  pologne: "Poland",
  roumanie: "Romania",
  suisse: "Switzerland",
  "etats unis": "United States",
  belgique: "Belgium",
  maroc: "Morocco",
  inde: "India",
  chine: "China",
  bresil: "Brazil",
  mexique: "Mexico",
  turquie: "Turkey",
  france: "France",
  luxembourg: "Luxembourg",
  philippines: "Philippines",
  norge: "Norway",
  norvege: "Norway",
  "norvège": "Norway",
  danemark: "Denmark",
  danmark: "Denmark",
  sverige: "Sweden",
  suede: "Sweden",
  "suède": "Sweden",
  finlande: "Finland",
  "forente stater": "United States"
};

export class ProductNotFoundError extends Error {
  constructor() {
    super("We couldn't find this product. Try another barcode or check the number is correct.");
    this.name = "ProductNotFoundError";
  }
}

export class ProductLookupError extends Error {
  constructor() {
    super("Something went wrong. Please try again.");
    this.name = "ProductLookupError";
  }
}

function firstText(...values: Array<string | string[] | null | undefined>) {
  for (const value of values) {
    const text = Array.isArray(value) ? value.filter(Boolean).join(", ") : value;
    const trimmed = text?.trim();

    if (trimmed) {
      return trimmed;
    }
  }

  return null;
}

function stripLanguagePrefix(value: string) {
  return value.trim().replace(/^[a-z]{2}:/i, "").replaceAll("-", " ");
}

function capitaliseWord(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function capitaliseFirstLetter(value: string) {
  const cleaned = stripLanguagePrefix(value).trim();
  return capitaliseWord(cleaned);
}

function capitaliseEachWord(value: string) {
  return stripLanguagePrefix(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => capitaliseWord(word))
    .join(" ");
}

function cleanCountryName(value: string) {
  const stripped = stripLanguagePrefix(value).trim();
  const translationKey = stripped
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return countryTranslations[translationKey] ?? capitaliseEachWord(stripped);
}

function splitValues(...values: Array<string | string[] | null | undefined>) {
  return values
    .flatMap((value) => (Array.isArray(value) ? value : value?.split(",") ?? []))
    .map((value) => value.trim())
    .filter(Boolean);
}

function uniqueValues(values: string[]) {
  const seen = new Set<string>();

  return values.filter((value) => {
    const key = value.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isLikelyFrenchCategory(value: string) {
  const words = stripLanguagePrefix(value).toLowerCase().replaceAll("-", " ");
  const frenchSignals = ["dejeuner", "dejeuners", "déjeuner", "déjeuners", "produit", "produits", "tartiner", "sucre", "sucres", "sucré", "sucrés", "pate", "pates", "pâte", "pâtes"];

  return frenchSignals.some((signal) => new RegExp(`(^|\\s)${signal}(\\s|$)`, "i").test(words));
}

function cleanCategories(...values: Array<string | string[] | null | undefined>) {
  const cleaned = splitValues(...values)
    .filter((value) => value.toLowerCase().startsWith("en:"))
    .filter((value) => !isLikelyFrenchCategory(value))
    .map((value) => capitaliseFirstLetter(value))
    .filter(Boolean);

  return uniqueValues(cleaned).join(", ") || "General Product";
}

function cleanCountries(...values: Array<string | string[] | null | undefined>) {
  const cleaned = uniqueValues(splitValues(...values).map((value) => cleanCountryName(value)).filter(Boolean));

  if (cleaned.length === 0) return "Origin unknown";

  const visible = cleaned.slice(0, 5);
  return cleaned.length > 5 ? `${visible.join(", ")} and more` : visible.join(", ");
}

function cleanPackaging(...values: Array<string | string[] | null | undefined>) {
  const text = splitValues(...values).join(" ").toLowerCase();
  const materials = [
    { label: "Plastic", keywords: ["plastic"] },
    { label: "Glass", keywords: ["glass"] },
    { label: "Cardboard", keywords: ["cardboard"] },
    { label: "Paper", keywords: ["paper"] },
    { label: "Aluminium", keywords: ["aluminium", "aluminum"] },
    { label: "Metal", keywords: ["metal"] },
    { label: "Wood", keywords: ["wood"] },
    { label: "Recyclable", keywords: ["recyclable"] }
  ];
  const found = materials
    .filter((material) => material.keywords.some((keyword) => text.includes(keyword)))
    .map((material) => material.label)
    .slice(0, 3);

  return found.join(", ") || "Packaging info unavailable";
}

function gradeFromScore(score?: number) {
  if (typeof score !== "number") return null;
  if (score >= 80) return "a";
  if (score >= 60) return "b";
  if (score >= 40) return "c";
  if (score >= 20) return "d";
  return "e";
}

function extractEcoGrade(product: OpenFoodFactsProduct) {
  return normalizeEcoGrade(
    firstText(
      product.ecoscore_grade,
      product.ecoscore_data?.grade,
      product.environment_impact_level,
      product.ecoscore_tags,
      product.environment_impact_level_tags,
      gradeFromScore(product.ecoscore_score),
      gradeFromScore(product.ecoscore_data?.score)
    )
  );
}

function extractNovaGroup(value: OpenFoodFactsProduct["nova_group"]) {
  const group = typeof value === "string" ? Number.parseInt(value, 10) : value;

  return group === 1 || group === 2 || group === 3 || group === 4 ? group : null;
}

export async function fetchOpenFoodFactsProduct(barcode: string) {
  const cleanBarcode = barcode.trim();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  let response: Response;

  try {
    response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}`, {
      next: { revalidate: 3600 },
      signal: controller.signal
    });
  } catch {
    throw new ProductLookupError();
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new ProductLookupError();
  }

  const data = (await response.json()) as OpenFoodFactsResponse;

  if (data.status !== 1 || !data.product) {
    throw new ProductNotFoundError();
  }

  return data.product;
}

export function normalizeOpenFoodFactsProduct(barcode: string, product: OpenFoodFactsProduct): ProductResult {
  const cleanBarcode = barcode.trim();
  const ecoGrade = extractEcoGrade(product);

  const normalizedProduct: ProductResult = {
    barcode: cleanBarcode,
    name: firstText(product.product_name_en, product.product_name, product.abbreviated_product_name) ?? "Unknown Product",
    brand: firstText(product.brands, product.brands_tags) ?? "Brand not listed",
    categories: cleanCategories(product.categories, product.categories_tags, product.categories_hierarchy),
    image: null,
    ecoGrade,
    healthGrade: "C",
    hasNokkelhull: false,
    nutriGrade: firstText(product.nutriscore_grade, product.nutrition_grades) ?? "Not rated",
    packaging: cleanPackaging(product.packaging, product.packaging_text, product.packaging_tags),
    origins: cleanCountries(product.origins, product.origins_tags, product.manufacturing_places, product.countries, product.countries_tags),
    ingredients: firstText(product.ingredients_text_en, product.ingredients_text) ?? "Ingredients unavailable",
    displayImage: null,
    displayImageSource: "placeholder",
    placeholderEmoji: "🌿",
    norwegianDataStatus: "limited",
    storePrices: [],
    currentPrice: null,
    store: null,
    allergens: [],
    labels: [],
    kassalappCategories: [],
    kassalappNutrition: [],
    additives: analyzeAdditives(product.additives_tags),
    novaGroup: extractNovaGroup(product.nova_group),
    aiSummary: []
  };

  return {
    ...normalizedProduct,
    ecoGradeLetter: getEcoGrade(normalizedProduct),
    nutritionGradeLetter: getNutritionGrade(normalizedProduct),
    healthGrade: calculateHealthGrade({
      nutrition: {},
      labels: [],
      category: normalizedProduct.categories
    })
  };
}

export async function fetchProductByBarcode(barcode: string): Promise<ProductResult> {
  const product = await fetchOpenFoodFactsProduct(barcode);
  return normalizeOpenFoodFactsProduct(barcode, product);
}

export async function fetchMergedProductByBarcode(barcode: string): Promise<ProductResult> {
  return fetchProductByBarcode(barcode);
}

type OpenFoodFactsSearchResponse = {
  products?: Array<{
    _id?: string;
    code?: string;
    product_name?: string;
    brands?: string;
    countries_tags?: string[];
  }>;
};

function cleanSearchTerm(value: string) {
  return value
    .replace(/[®™©]/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[-–—_/|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function searchOpenFoodFactsBarcodes(searchTerm: string, brand?: string, limit = 5): Promise<string[]> {
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("search_terms", searchTerm);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", "20");

  try {
    const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
    if (!response.ok) return [];

    const data = (await response.json()) as OpenFoodFactsSearchResponse;
    const cleanBrand = cleanSearchTerm(brand ?? "").toLowerCase();
    const searchTokens = cleanSearchTerm(searchTerm)
      .toLowerCase()
      .split(" ")
      .filter((token) => token.length > 2);
    const products = data.products ?? [];
    const scoredProducts = products
      .map((product) => {
        const barcode = product.code ?? product._id ?? null;
        if (!barcode) return { product, score: -1 };

        const productName = cleanSearchTerm(product.product_name ?? "").toLowerCase();
        const productBrand = cleanSearchTerm(product.brands ?? "").toLowerCase();
        const countryTags = product.countries_tags ?? [];
        const hasNorway = countryTags.some((country) => country.toLowerCase() === "en:norway");
        const brandMatches = cleanBrand ? productBrand.includes(cleanBrand) : false;
        const matchingNameTokens = searchTokens.filter((token) => productName.includes(token)).length;
        const unrelatedBrand = cleanBrand && productBrand && !brandMatches;

        let score = 0;
        if (hasNorway) score += 12;
        if (brandMatches) score += 8;
        score += Math.min(8, matchingNameTokens * 2);
        if (unrelatedBrand) score -= 6;

        return { product, score };
      })
      .filter(({ score }) => score >= 4)
      .sort((a, b) => b.score - a.score);

    return scoredProducts
      .map(({ product }) => product.code ?? product._id)
      .filter((candidate): candidate is string => Boolean(candidate))
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function findOpenFoodFactsBarcode(productName: string, brand?: string): Promise<string | null> {
  const cleanName = cleanSearchTerm(productName);
  const cleanBrand = cleanSearchTerm(brand ?? "");
  const terms = [
    [cleanName, cleanBrand].filter(Boolean).join(" "),
    [cleanBrand, cleanName.split(" ").slice(0, 3).join(" ")].filter(Boolean).join(" "),
    cleanName,
    cleanBrand
  ].filter(Boolean);

  for (const term of terms) {
    const matches = await searchOpenFoodFactsBarcodes(term, cleanBrand, 1);
    if (matches[0]) return matches[0];
  }

  return null;
}

export function toScanPayload(product: ProductResult, userId: string) {
  return {
    user_id: userId,
    barcode: product.barcode,
    product_name: product.name,
    brand: product.brand === "Brand not listed" ? null : product.brand,
    eco_score_grade: product.ecoGrade,
    ecoscan_score: getProductSkarenScore(product),
    product_image: product.displayImage
  };
}
