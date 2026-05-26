import { Sparkles } from "lucide-react";
import type { ProductResult } from "@/lib/types";
import { generateSwaps } from "@/utils/generateSwaps";

type SwapSuggestionsProps = {
  product: ProductResult;
  score: number;
};

export function SwapSuggestions({ product, score }: SwapSuggestionsProps) {
  const suggestions = generateSwaps(product, score).slice(0, 3);

  return (
    <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft">
      <div className="mb-4 flex items-center gap-2 text-lime-500">
        <Sparkles className="h-5 w-5" />
        <h2 className="text-xl font-black text-ink">Better choice suggestions</h2>
      </div>
      <p className="text-sm text-soil-600">Demo suggestions for now, based on broad product category and score.</p>
      <div className="mt-4 space-y-3">
        {suggestions.map((suggestion) => (
          <div key={suggestion.name} className="rounded-2xl bg-lime-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black text-ink">{suggestion.name}</h3>
                <p className="mt-1 text-sm leading-6 text-soil-600">{suggestion.reason}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-ink">{suggestion.estimatedScore}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
