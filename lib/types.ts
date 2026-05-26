import type { AdditiveAnalysis } from "@/lib/additives";

export type EcoGrade = "a" | "b" | "c" | "d" | "e" | "unknown";
export type GradeLetter = "A" | "B" | "C" | "D" | "E";

export type ScanRecord = {
  id?: string;
  user_id: string;
  barcode: string;
  product_name: string;
  brand: string | null;
  eco_score_grade: EcoGrade;
  ecoscan_score: number;
  product_image: string | null;
  created_at?: string;
};

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
  aiSummary: string[];
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
