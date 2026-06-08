import { t, type Language } from "@/lib/i18n";
import type { KassalappNutrition } from "@/lib/types";

type DailyIntakeProps = {
  nutrition: KassalappNutrition[];
  lang?: Language;
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

function barColour(percent: number): string {
  if (percent < 20) return "#6aab6a";
  if (percent <= 35) return "#c8a040";
  return "#c05050";
}

function percentTextColour(percent: number): string {
  if (percent < 20) return "#2a5030";
  if (percent <= 35) return "#706030";
  return "#703030";
}

export function DailyIntake({ nutrition, lang = 'no' }: DailyIntakeProps) {
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
    <div
      className="overflow-hidden bg-white"
      style={{ borderRadius: 14, border: "0.5px solid #e0d8cc" }}
    >
      {rows.map((row, index) => (
        <div
          key={row.key}
          style={{ padding: "7px 12px", ...(index < rows.length - 1 ? { borderBottom: "0.5px solid #e0d8cc" } : {}) }}
        >
          <div className="type-body-sm flex items-center justify-between gap-3" style={{ marginBottom: 4 }}>
            <p className="font-bold text-ink">{row.label}</p>
            <p className="text-right font-bold" style={{ color: percentTextColour(row.percent) }}>
              {formatAmount(row.data.amount, row.data.unit)} = {row.percent}{t('product_daily_reference', lang)}
            </p>
          </div>
          <div style={{ height: 10, borderRadius: 999, overflow: "hidden", background: "#ede8e0" }}>
            <div
              style={{
                height: "100%",
                borderRadius: 999,
                width: `${Math.min(100, row.percent)}%`,
                background: barColour(row.percent),
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
