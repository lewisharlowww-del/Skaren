import { Activity } from "lucide-react";
import type { KassalappNutrition } from "@/lib/types";

type DailyIntakeProps = {
  nutrition: KassalappNutrition[];
};

const DAILY_REFERENCE = {
  calories: 2000,
  fat: 70,
  saturatedFat: 20,
  carbohydrates: 260,
  sugars: 50,
  protein: 50,
  salt: 6,
  fiber: 25
};

function findAmount(nutrition: KassalappNutrition[], matches: string[], excludes: string[] = [], preferredUnits: string[] = []) {
  const candidates = nutrition.filter((entry) => {
    if (entry.amount <= 0) return false;

    const text = `${entry.code} ${entry.displayName}`.toLowerCase();
    const isMatch = matches.some((match) => text.includes(match));
    const isExcluded = excludes.some((exclude) => text.includes(exclude));

    return isMatch && !isExcluded;
  });
  const selected = preferredUnits.length > 0
    ? candidates.find((entry) => preferredUnits.some((unit) => entry.unit.toLowerCase().includes(unit))) ?? candidates[0]
    : candidates[0];

  if (!selected) return null;

  return {
    amount: preferredUnits.includes("kcal") && selected.unit.toLowerCase().includes("kj") ? selected.amount / 4.184 : selected.amount,
    unit: preferredUnits.includes("kcal") ? "kcal" : selected.unit || "g"
  };
}

function formatAmount(amount: number, unit: string) {
  const value = unit === "kcal" ? Math.round(amount) : Number.isInteger(amount) ? amount : amount.toFixed(1);
  return `${value}${unit === "kcal" ? " kcal" : unit ? ` ${unit}` : ""}`;
}

function barTone(percent: number) {
  if (percent <= 15) return "bg-emerald-500";
  if (percent <= 30) return "bg-amber-400";
  return "bg-rose-500";
}

export function DailyIntake({ nutrition }: DailyIntakeProps) {
  const rows = [
    { key: "calories", label: "Calories", reference: DAILY_REFERENCE.calories, data: findAmount(nutrition, ["energy", "energi", "calories", "calorie", "kcal", "kj"], [], ["kcal"]) },
    { key: "fat", label: "Fat", reference: DAILY_REFERENCE.fat, data: findAmount(nutrition, ["fat", "fett"], ["saturated", "mettede", "mettet"]) },
    { key: "saturatedFat", label: "Saturated fat", reference: DAILY_REFERENCE.saturatedFat, data: findAmount(nutrition, ["saturated", "mettede", "mettet"]) },
    { key: "carbohydrates", label: "Carbs", reference: DAILY_REFERENCE.carbohydrates, data: findAmount(nutrition, ["carbohydrate", "karbohydrat"]) },
    { key: "sugars", label: "Sugars", reference: DAILY_REFERENCE.sugars, data: findAmount(nutrition, ["sugars", "sugar", "sukker", "sukkerarter"]) },
    { key: "protein", label: "Protein", reference: DAILY_REFERENCE.protein, data: findAmount(nutrition, ["protein", "proteins"]) },
    { key: "salt", label: "Salt", reference: DAILY_REFERENCE.salt, data: findAmount(nutrition, ["salt"]) },
    { key: "fiber", label: "Fiber", reference: DAILY_REFERENCE.fiber, data: findAmount(nutrition, ["fiber", "fibre", "kostfiber"]) }
  ]
    .filter((row): row is { key: string; label: string; reference: number; data: { amount: number; unit: string } } => Boolean(row.data))
    .map((row) => ({
      ...row,
      percent: Math.round((row.data.amount / row.reference) * 100)
    }));

  if (rows.length === 0) return null;

  return (
    <div className="rounded-[1.5rem] border border-black/5 bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-2xl bg-leaf-50 text-forest">
          <Activity className="h-4 w-4" />
        </div>
        <h3 className="type-heading-3 text-soil-900">Daily impact</h3>
      </div>

      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.key}>
            <div className="type-body-sm mb-2 flex items-center justify-between gap-3">
              <p className="font-bold text-ink">{row.label}</p>
              <p className="text-right font-bold text-soil-600">
                {formatAmount(row.data.amount, row.data.unit)} = {row.percent}% of daily reference
              </p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-soil-100">
              <div className={`h-full rounded-full ${barTone(row.percent)}`} style={{ width: `${Math.min(100, row.percent)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <p className="type-body-sm mt-4 text-soil-500">Based on a 2000 kcal daily diet per 100g</p>
    </div>
  );
}
