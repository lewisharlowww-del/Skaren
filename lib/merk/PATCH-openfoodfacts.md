# Wiring the Nutri-Score preference into the app

Three small edits. Nothing else changes.

## 1 · Ask the API for the score fields

`lib/openfoodfacts.ts`, in `fetchOpenFoodFactsProduct` — the v2 endpoint returns
everything by default, but pin the fields so the payload stays small and the
score fields can never silently disappear:

```ts
response = await fetch(
  `https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}` +
    `?fields=product_name,product_name_en,brands,categories,categories_tags,` +
    `ingredients_text,ingredients_text_en,additives_tags,nova_group,` +
    `nutriscore_grade,nutrition_grades,nutriscore_score,` +
    `ecoscore_grade,environmental_score_grade,packaging,packaging_tags,` +
    `origins,origins_tags,countries,countries_tags`,
  { /* existing options */ }
);
```

Also add the numeric field to the `OpenFoodFactsProduct` type:

```ts
nutriscore_grade?: string;
nutrition_grades?: string;
nutriscore_score?: number;   // <- new
```

## 2 · Use the resolver instead of calling the absolute model directly

`lib/openfoodfacts.ts`, at the end of `normalizeOpenFoodFactsProduct`:

```ts
import { resolveHealthGrade } from "@/merk/healthGrade";
import categoryStats from "@/merk/categoryStats.json";

const health = resolveHealthGrade({
  offFields: {
    nutriscore_grade: product.nutriscore_grade,
    nutrition_grades: product.nutrition_grades,
    nutriscore_score: product.nutriscore_score
  },
  fallback: {
    nutrition: {},
    labels: [],
    category: normalizedProduct.categories,
    novaGroup: normalizedProduct.novaGroup,
    additives: normalizedProduct.additives
  },
  category: {
    key: categoryKey(normalizedProduct.categories),
    stats: categoryStats,
    nutrition: {
      salt: nutritionData.salt,
      satFat: nutritionData.saturatedFat,
      protein: nutritionData.protein
    },
    watchAdditives: normalizedProduct.additives.filter(a => a.risk !== "safe").length
  }
});

return {
  ...normalizedProduct,
  ecoGradeLetter: getEcoGrade(normalizedProduct),
  nutritionGradeLetter: getNutritionGrade(normalizedProduct),
  healthGrade: health.grade,
  healthScore: health.score,
  healthSource: health.source,     // "nutriscore" | "skaren-category" | "skaren-absolute"
  healthModel: health.model,
  healthBasis: health.basis,
  healthConfident: health.confident
};
```

Do the same in the Kassalapp merge path (`fetchMergedProductByBarcode`) so a
product that comes from Kassalapp but also exists in Open Food Facts still gets
the Nutri-Score.

## 3 · Persist provenance with each scan

`lib/types.ts` — add to `ProductResult`:

```ts
healthScore?: number;
healthSource?: "nutriscore" | "skaren-category" | "skaren-absolute";
healthModel?: string;
healthBasis?: string;
healthConfident?: boolean;
```

Store `healthSource` and `healthModel` on the saved scan row. When the model is
re-tuned, old scans keep the number they were shown — history never rewrites
itself.

## What the UI does with it

- **Score card** — unchanged when `healthConfident` is true.
- **Health tile** — when `healthSource === "skaren-absolute"`, show the grade at
  reduced emphasis with a small "limited data" caption instead of the dot scale.
- **"why?" sheet** — first line is `healthBasis`. For Nutri-Score products that
  reads *"Nutrition graded by Nutri-Score. Additives and processing scored by
  Skaren."* which is a stronger sentence than a model only we have seen.
- **Additives and NOVA sections are untouched.** Nutri-Score ignores additives
  entirely; that section stays ours and stays the loudest thing on the page.

## Before this ships

Run 500 real Norwegian barcodes from your own catalogue through the API and
count how many return a usable `nutriscore_grade`. If it is under ~60 %, the
fallback is the main path and the category model is what actually needs the
work. Also note Open Food Facts is ODbL — attribution is required, and there are
share-alike obligations on derived databases.
