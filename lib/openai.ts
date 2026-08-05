import type { ProductInsight, ProductResult, MerkVerdict, GradeLetter } from "@/lib/types";

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

// ── Merk's verdict ────────────────────────────────────────────────────────────
// Merk is the label that decided to start helping. Every product has a label;
// most people ignore it; this one explains food before you buy it. He does not
// judge — he helps you understand. This is his single spoken line on the result
// screen, authored from the real scanned product so he actually "knows" it.

// The faces Merk can pull, mapped to what a face means so the model can only
// pick a real expression and we can safely fall back if it invents one.
const MERK_FACES = new Set([
  "happy", "curious", "surprised", "unsure", "confident",
  "celebration", "concern", "thinking", "scanning",
] as const);

// Bump this whenever the verdict prompt changes shape/voice. Cached verdicts
// authored under an older version are treated as stale and regenerated, so a
// prompt fix reaches users without waiting out the 7-day cache TTL. v2 dropped
// nutrition-number recitation (sugar/carbs/fat/salt) — those live in the table.
export const MERK_VERDICT_VERSION = 2;

function normalizeMerkExpression(
  value: unknown,
  grade: GradeLetter | null
): MerkVerdict["expression"] {
  if (typeof value === "string" && MERK_FACES.has(value as MerkVerdict["expression"])) {
    return value as MerkVerdict["expression"];
  }
  // Fall back to a face that matches the grade rather than a flat default.
  if (grade === "A") return "confident";
  if (grade === "B") return "happy";
  if (grade === "C") return "thinking";
  if (grade === "D") return "curious";
  if (grade === "E") return "concern";
  return "unsure";
}

/**
 * Ask Merk to look at one scanned product and say what he sees, in his own
 * voice. Returns a structured verdict (face + headline + one explaining line)
 * or null when the model is unavailable, so the caller can fall back to the
 * static grade map. Never throws.
 */
export async function generateMerkVerdict(
  product: ProductResult,
  language: "no" | "en" = "en"
): Promise<MerkVerdict | null> {
  const grade = (product.healthGrade ?? null) as GradeLetter | null;
  const no = language === "no";

  const sugarValue = getSugarValue(product);
  const sugarInIngredients = ingredientsContainSugar(product.ingredients);
  const sugarContext = sugarValue !== "unknown"
    ? `${sugarValue}g per 100g`
    : sugarInIngredients
      ? "exact value unavailable, but the ingredients list added sugars"
      : "not listed";

  const worstAdditives = product.additives
    .filter((a) => a.risk === "avoid" || a.risk === "moderate")
    .map((a) => `${a.code} ${a.name} (${a.risk})`)
    .join(", ");

  const systemPrompt = `You are Merk, the mascot and single voice of Skaren, a Norwegian food-scanning app.

WHO YOU ARE
Every product has a label. Most people ignore it. You are the one label that decided to start helping instead. You do not judge people or food — you help people understand what they are about to buy, in plain words, before they buy it. You are the knowledgeable friend who happens to be a food label: warm, calm, honest, never preachy, never alarmist.

YOUR JOB
Look at the ONE product below and say what it MEANS for the shopper — the single "so what" they should walk away with. The app already shows a full nutrition table (sugar, carbs, fat, protein, salt, calories) right next to you, so your job is emphatically NOT to repeat those numbers. Give the meaning behind them, not the panel.

VOICE RULES
- First person, as Merk ("I'd..."/"Jeg ville...") is allowed but do not overuse "I".
- Never say the words judge, bad, good/dårlig, forbidden, or scold the shopper.
- Never mention Skaren, Nutri-Score, Eco-Score, NOVA by name, or any numeric app score. Translate them into meaning.
- DO NOT recite nutrition figures. Never quote grams, percentages, calories, or "per 100g" values for sugar, carbs, fat, saturated fat, protein, or salt — the nutrition table already shows all of that and repeating it is exactly what the shopper does not want from you. Speak in plain meaning instead ("salty enough to notice", "leans sugary", "genuinely lean"), not in numbers.
- The ONE thing you MAY name specifically is a concerning additive (e.g. an artificial colour or preservative worth knowing about), because that is not in the nutrition table.
- Never claim something is low-sugar or sugar-free if it clearly isn't; just avoid citing the figure.
- If you truly lack the data to say anything meaningful, say so briefly and move on — never output "N/A", "unknown", or "not listed" as text.
- Write in ${no ? "Norwegian Bokmål" : "English"}.

WHAT TO RETURN — a single JSON object, nothing else:
{
  "expression": one of "confident" | "happy" | "celebration" | "curious" | "thinking" | "unsure" | "surprised" | "concern",
  "headline": ${no ? "3–6 words" : "3–6 words"}, the one sharpest takeaway in your words (no numbers), sentence case, no trailing period,
  "text": one sentence, max 22 words, that explains what this product means for the shopper and what to do with it — meaning, not measurements
}

CHOOSING YOUR FACE (match your words to your face)
- confident / happy / celebration: a clean, strong product — little to worry about.
- thinking / curious: a middle-of-the-shelf product — fine sometimes, one thing to notice.
- unsure: you genuinely lack the data to speak with confidence.
- concern: a real, specific issue worth flagging calmly (never anger).`;

  const userMessage = `Product: ${product.name}
Brand: ${product.brand || "unknown"}
Overall grade (A best … E worst, for YOUR judgement only, never print it): ${grade ?? "no grade"}
Category: ${product.categories || product.kassalappCategories.join(", ") || "unknown"}
Processing (NOVA 1 unprocessed … 4 ultra-processed): ${product.novaGroup ?? "unknown"}
Ingredients: ${product.ingredients || "not available"}
Additives worth naming: ${worstAdditives || "none of concern"}
All additive codes: ${product.additives.map((a) => a.code).join(", ") || "none detected"}
Fat: ${getFatValue(product)}g per 100g
Saturated fat: ${getNutritionValue(product, ["saturated", "mettede", "mettet"])}g per 100g
Sugar: ${sugarContext}
Protein: ${getNutritionValue(product, ["protein", "proteins"])}g per 100g
Salt: ${getNutritionValue(product, ["salt", "sodium", "natrium"])}g per 100g
Eco grade: ${product.ecoGrade ?? "not available"}
Origin: ${product.origins || "not listed"}
Allergens: ${product.allergens.join(", ") || "none listed"}`;

  const raw = await callOpenAi(userMessage, 320, systemPrompt);
  if (!raw) return null;

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      expression?: unknown;
      headline?: unknown;
      text?: unknown;
    };

    const headline = typeof parsed.headline === "string" ? parsed.headline.trim().replace(/[.!]+$/, "") : "";
    const body = typeof parsed.text === "string" ? parsed.text.trim() : "";
    if (!headline || !body) return null;

    return {
      expression: normalizeMerkExpression(parsed.expression, grade),
      headline,
      text: body,
      source: "ai",
      v: MERK_VERDICT_VERSION,
    };
  } catch {
    return null;
  }
}
