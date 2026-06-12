import type { ProductInsight, ProductResult } from "@/lib/types";

type OpenAiTextBlock = {
  type?: string;
  text?: string;
};

type OpenAiOutputItem = {
  content?: OpenAiTextBlock[];
};

type OpenAiResponse = {
  output_text?: string;
  output?: OpenAiOutputItem[];
};

async function callOpenAi(prompt: string, maxTokens: number, instructions: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-5.4-nano";

  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        instructions,
        input: prompt,
        max_output_tokens: maxTokens,
        text: { format: { type: "text" } }
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`OpenAI API error: ${response.status} ${response.statusText}`, errorText);
      return null;
    }

    const data = (await response.json()) as OpenAiResponse;

    return data.output_text?.trim()
      ?? data.output
        ?.flatMap((item) => item.content ?? [])
        .map((content) => content.text ?? "")
        .join("")
        .trim()
      ?? null;
  } catch (error) {
    console.error("OpenAI API error:", error instanceof Error ? error.message : String(error));
    return null;
  }
}

export async function generateWeeklyStatsInsight(stats: {
  totalScans: number;
  avgHealthGrade: string;
  scanTrendVsLast: number | null;
  gradeBreakdown: Record<string, number>;
  additivesTotal: number;
  additivesToAvoid: number;
  additivesModerate: number;
  mostScanned: Array<{
    name: string;
    count: number;
    healthGrade: string;
  }>;
}, language: "no" | "en" = "en") {
  const systemPrompt = `You write one sentence weekly food insights for a Norwegian health app.
- Maximum 20 words
- Reference the user's actual scan data
- Tone: warm, direct, never preachy
- No emojis, no exclamation marks
- End with one gentle actionable observation
- Do not add a heading or label
- Write in ${language === "no" ? "Norwegian Bokmål" : "English"}`;

  const prompt = `Weekly scan data:
Total scans: ${stats.totalScans}
Average health grade: ${stats.avgHealthGrade}
Scan volume change versus last week: ${
    stats.scanTrendVsLast === null ? "no previous data" : `${stats.scanTrendVsLast}%`
  }
Grade breakdown: ${Object.entries(stats.gradeBreakdown)
    .map(([grade, count]) => `${grade}: ${count}`)
    .join(", ")}
Additives found: ${stats.additivesTotal}
Additives to avoid: ${stats.additivesToAvoid}
Moderate additives: ${stats.additivesModerate}
Most scanned products: ${
    stats.mostScanned
      .map(
        (product) =>
          `${product.name} (${product.count}, grade ${product.healthGrade})`
      )
      .join(", ") || "none"
  }`;

  const text = await callOpenAi(prompt, 80, systemPrompt);
  if (!text) return null;

  return text
    .replace(/^["']|["']$/g, "")
    .replace(/^(weekly (?:insight|summary)|ukeoppsummering|ukens innsikt)\s*:\s*/i, "")
    .split(/\s+/)
    .slice(0, 20)
    .join(" ");
}

function getNutritionValue(product: ProductResult, terms: string[], excludes: string[] = []) {
  const match = product.kassalappNutrition.find((entry) => {
    const text = `${entry.code} ${entry.displayName}`.toLowerCase();
    return terms.some((term) => text.includes(term)) && !excludes.some((exclude) => text.includes(exclude));
  });

  return match ? String(match.amount) : "unknown";
}

function getFatValue(product: ProductResult) {
  const structuredFat = getNutritionValue(product, ["fat", "fett"], ["saturated", "mettede", "mettet"]);
  if (structuredFat !== "unknown") return structuredFat;

  const fatFromName = product.name.match(/(\d+(?:[.,]\d+)?)\s*%/);
  return fatFromName ? fatFromName[1].replace(",", ".") : "unknown";
}

function normalizeInsightType(value: unknown): ProductInsight["type"] {
  return value === "positive" || value === "warning" || value === "info" ? value : "info";
}

// Sugar lookup — Kassalapp sometimes stores sugar as a sub-field of carbohydrates
// using Norwegian terms like "hvorav sukker" or "sukkerarter". Try multiple variants.
function getSugarValue(product: ProductResult): string {
  const value = getNutritionValue(
    product,
    ["sugars", "sugar", "sukker", "sukkerarter", "hvorav sukker", "herav sukker"],
    []
  );
  return value;
}

// Returns true if the ingredients text contains common added-sugar words.
// Used to guard against the AI claiming "no added sugar" when ingredients
// clearly list sugar under a different form.
function ingredientsContainSugar(ingredients: string | null | undefined): boolean {
  if (!ingredients) return false;
  const lower = ingredients.toLowerCase();
  const sugarWords = [
    "sukker", "glukose", "fruktose", "fructose", "glucose", "sirup", "syrup",
    "dextrose", "dekstrose", "maltose", "laktose", "saccharose", "honning",
    "honey", "agave", "molasses", "melasse", "invertsugar", "invertsukker",
  ];
  return sugarWords.some((word) => lower.includes(word));
}

export async function generateAiSummary(product: ProductResult) {
  const sugarValue = getSugarValue(product);
  const sugarInIngredients = ingredientsContainSugar(product.ingredients);
  // Build a sugar context line the AI can rely on unambiguously
  const sugarContext = sugarValue !== "unknown"
    ? `${sugarValue}g per 100g`
    : sugarInIngredients
      ? "exact value unavailable, but ingredients contain added sugars (sukker/glucose/sirup)"
      : "not listed";

  const systemPrompt = `You write short food insights for Skaren, a Norwegian food scanning app.

Your job is to help everyday Norwegian shoppers quickly understand if a product is good for them.

Rules:
- Write exactly 3 insights per product
- Each insight is one sentence, maximum 15 words
- Lead with what it means for the user, not the raw data point
- Tone: knowledgeable friend who happens to know nutrition — warm, direct, never preachy
- No emojis, no exclamation marks, no hedging words like "mentioned", "seems", or "appears"
- Reference actual numbers when relevant (e.g. "14% fat", "32% of daily saturated fat")
- If a data field is missing, briefly say why and move on — never write "N/A", "Unknown", "Limited", or "Not listed" as standalone text
- Assume Norwegian dietary context and habits
- Never repeat what the grade already says — add new information or meaning
- Do not mention Skaren, Skåren, Nutri-Score, Eco-Score, or numeric app scores in the insights
- Write in English
- CRITICAL: Never say "no added sugar", "sugar-free", or "low sugar" if the sugar field is ≥ 5g/100g OR if the ingredients contain sukker, glukose, fruktose, sirup, or similar sweeteners. Doing so is factually wrong and misleads users.

Insight types to cover (pick the 3 most relevant for this product):
- Processing level (NOVA) — what it means in plain terms
- Additives — reassuring if clean, specific if concerning
- Fat / saturated fat — only if notably high or low
- Protein — only if notably high (e.g. sports/fitness relevant)
- Sugar — flag if ≥ 10g/100g or if ingredients contain added sugars
- Eco / origin — only if data is available; if missing, one sentence explaining why
- Allergens — only if present

Output format — return a JSON array, nothing else:
[
  { "type": "positive" | "warning" | "info", "text": "..." },
  { "type": "positive" | "warning" | "info", "text": "..." },
  { "type": "positive" | "warning" | "info", "text": "..." }
]`;

  const userMessage = `
Product: ${product.name}
Brand: ${product.brand}
NOVA level: ${product.novaGroup ?? "unknown"}
Ingredients: ${product.ingredients ?? "not available"}
Additives: ${product.additives.map((additive) => additive.code).join(", ") || "none detected"}
Fat: ${getFatValue(product)}g per 100g
Saturated fat: ${getNutritionValue(product, ["saturated", "mettede", "mettet"])}g per 100g
Protein: ${getNutritionValue(product, ["protein", "proteins"])}g per 100g
Sugar: ${sugarContext}
Ecoscore grade: ${product.ecoGrade ?? "not available"}
Origin: ${product.origins ?? "not listed"}
Allergens: ${product.allergens.join(", ") || "none listed"}
`;

  const text = await callOpenAi(userMessage, 700, systemPrompt);

  if (!text) return [];

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]) as unknown;

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item): ProductInsight | null => {
        if (typeof item === "string" && item.trim()) return { type: "info", text: item.trim() };
        if (!item || typeof item !== "object") return null;

        const insight = item as { type?: unknown; text?: unknown };
        if (typeof insight.text !== "string" || !insight.text.trim()) return null;

        return {
          type: normalizeInsightType(insight.type),
          text: insight.text.trim()
        };
      })
      .filter((item): item is ProductInsight => Boolean(item))
      .slice(0, 3);
  } catch {
    return [];
  }
}
