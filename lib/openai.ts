import type { ProductResult } from "@/lib/types";

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

function productContext(product: ProductResult, score: number) {
  return [
    `Product name: ${product.name}`,
    `Brand: ${product.brand}`,
    `Categories: ${product.categories}`,
    `Ingredients: ${product.ingredients}`,
    `Nutri-Score: ${product.nutriGrade}`,
    `Eco-Score grade: ${product.ecoGrade}`,
    `Skaren score: ${score}`,
    `Packaging: ${product.packaging}`,
    `Origins: ${product.origins}`
  ].join("\n");
}

export async function generateAiSummary(product: ProductResult, score: number) {
  const instructions = `You are a friendly, straight-talking food advisor helping people make smarter choices in a Norwegian supermarket.
Explain products simply, like a knowledgeable friend — not a doctor or nutritionist.

Rules:
- Write like you're texting a friend, not writing a health report
- Maximum 15 words per bullet point
- No jargon
- Replace "saturated fat" with "unhealthy fat"
- Replace "ultra-processed" with "heavily processed"
- Replace "additives" with "added chemicals"
- Be direct and honest — if something is bad, say so clearly but kindly
- If something is good, celebrate it
- Never use these words: intake, consumption, formulation, nutritional profile, macro
- Always write in English even if product data is in Norwegian
- Return exactly 3 bullet points as a JSON array of strings
- Return ONLY JSON, no other text.`;

  const prompt = `Product: ${product.name}, Brand: ${product.brand}, Category: ${product.categories},
Nutri-Score: ${product.nutriGrade}, Eco-Score: ${product.ecoGrade},
Packaging: ${product.packaging}, Origins: ${product.origins},
Ingredients: ${product.ingredients}

Skaren score: ${score}
Context:
${productContext(product, score)}`;

  const text = await callOpenAi(prompt, 700, instructions);

  if (!text) return [];

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]) as unknown;

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => typeof item === "string" && item.trim())
      .map((item) => item.trim())
      .slice(0, 3);
  } catch {
    return [];
  }
}
