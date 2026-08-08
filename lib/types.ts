import type { AdditiveAnalysis } from "@/lib/additives";

export type EcoGrade = "a" | "b" | "c" | "d" | "e" | "unknown";
export type GradeLetter = "A" | "B" | "C" | "D" | "E";
export type ProductInsight = {
  type: "positive" | "warning" | "info";
  text: string;
};

// Merk's spoken verdict about one scanned product. This is what he "says" on
// the result screen: a single voice that explains, never judges. `expression`
// picks his face; `headline` is the one sharp fact in his words; `text` is the
// short explanation underneath. AI-authored when premium, falls back to the
// static grade map otherwise. `source` records who wrote it so history can tell.
export type MerkVerdictSource = "ai" | "static";
export type MerkExpressionName =
  | "happy"
  | "curious"
  | "surprised"
  | "unsure"
  | "confident"
  | "celebration"
  | "concern"
  | "thinking"
  | "scanning";
export type MerkVerdict = {
  expression: MerkExpressionName;
  headline: string;
  text: string;
  source: MerkVerdictSource;
  /* Prompt version this verdict was authored under. Lets the cache retire
     verdicts written by an older prompt without waiting out the TTL. */
  v?: number;
};

export type ScanRecord = {
  id?: string;
  user_id: string;
  barcode: string;
  product_name: string;
  brand: string | null;
  eco_score_grade: EcoGrade;
  ecoscan_score: number;
  skaren_grade?: GradeLetter | null;
  health_grade?: GradeLetter | null;
  environmental_grade?: GradeLetter | null;
  additives_total?: number | null;
  additives_to_avoid?: number | null;
  additives_moderate?: number | null;
  additives_details?: AdditiveAnalysis[] | null;
  product_image: string | null;
  created_at?: string;
};

export type StatsScanRecord = ScanRecord;

export type ProductResult = {
  barcode: string;
  name: string;
  brand: string;
  categories: string;
  image: string | null;
  ecoGrade: EcoGrade;
  ecoGradeLetter?: GradeLetter;
  nutritionGradeLetter?: GradeLetter;
  healthGrade: GradeLetter;
  hasNokkelhull: boolean;
  nutriGrade: string;
  packaging: string;
  origins: string;
  ingredients: string;
  displayImage: string | null;
  displayImageSource: "kassalapp" | "placeholder";
  placeholderEmoji: string;
  norwegianDataStatus: "kassalapp" | "limited";
  storePrices: StorePrice[];
  currentPrice: number | null;
  store: ProductStore | null;
  allergens: string[];
  labels: string[];
  kassalappCategories: string[];
  kassalappNutrition: KassalappNutrition[];
  additives: AdditiveAnalysis[];
  novaGroup: 1 | 2 | 3 | 4 | null;
  aiSummary: Array<string | ProductInsight>;
  /* Merk's spoken verdict — his single voice about this product. AI-authored
     for premium users, cached for everyone, static grade fallback otherwise. */
  merkVerdict?: MerkVerdict | null;
  /* Merk voice engine v1 — his four-slot copy about this product (headline,
     verdict, additiveNote, wouldMerkBuy). Computed from a judged ProductBrief
     and validated server-side. Present for premium/cached; the UI falls back to
     merkVerdict then the static grade map when absent. */
  merkCopy?: import("@/lib/merk/voice/copy").MerkCopy | null;
  /* ── Scoring provenance ──────────────────────────────────────────────────
     Which engine produced the number, and which version of it. Persisted with
     every saved scan so a re-tune never silently rewrites a user's history. */
  healthScore?: number;
  healthSource?: "nutriscore" | "skaren-category" | "skaren-absolute";
  healthModel?: string;
  healthBasis?: string;
  healthConfident?: boolean;
};

export type ProductStore = {
  name: string;
  code: string | null;
  logo: string | null;
};

export type KassalappNutrition = {
  code: string;
  displayName: string;
  amount: number;
  unit: string;
};

export type StorePrice = {
  store: string;
  storeLogo: string | null;
  price: number;
  currency: "NOK";
};
