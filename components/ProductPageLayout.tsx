"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, Info, ListPlus } from "lucide-react";
import { DailyIntake } from "@/components/DailyIntake";
import { Additives } from "@/components/Additives";
import { gradeDescriptions } from "@/components/ScoreBadge";
import { useShoppingList } from "@/hooks/useShoppingList";
import { hasEcoData } from "@/lib/ecoscore";
import type { ProductInsight, ProductResult, GradeLetter } from "@/lib/types";

type Props = {
  product: ProductResult;
  getKeyInsights: (p: ProductResult) => ProductInsight[];
  getNutritionRows: (p: ProductResult) => { label: string; displayAmount: string; tone: string }[];
  visibleIngredients: (p: ProductResult) => string | null;
  hasNutritionSignal: (p: ProductResult) => boolean;
  getEcoGrade: (p: ProductResult) => GradeLetter | null;
};

const GRADE_COLORS: Record<string, string> = {
  A: "var(--sk-brand-forest)",
  B: "var(--sk-brand-leaf)",
  C: "var(--sk-grade-c-text)",
  D: "var(--sk-grade-d-text)",
  E: "var(--sk-grade-e-text)",
};

const GRADE_BACKGROUNDS: Record<string, string> = {
  A: "var(--sk-grade-a-bg)",
  B: "var(--sk-grade-b-bg)",
  C: "var(--sk-grade-c-bg)",
  D: "var(--sk-grade-d-bg)",
  E: "var(--sk-grade-e-bg)"
};

function getColor(g: GradeLetter | null) {
  return g ? GRADE_COLORS[g] ?? "var(--sk-text-muted)" : "var(--sk-text-muted)";
}

function getGradeBackground(g: GradeLetter | null) {
  return g ? GRADE_BACKGROUNDS[g] ?? "var(--sk-surface-card)" : "var(--sk-surface-card)";
}

const NOVA_LABELS = ["", "Unprocessed", "Processed ingredients", "Processed food", "Ultra-processed"];
const TAB_LABELS = {
  grade: "Overview",
  nutrition: "Nutrition",
  details: "Breakdown"
} as const;

function getHealthGradeBasis(product: ProductResult, hasNutrition: boolean) {
  if (!hasNutrition) return "Health needs nutrition data before it can be graded.";
  if (product.hasNokkelhull) return "Health uses nutrition data and the Norwegian Nøkkelhull label.";
  if (product.kassalappNutrition.length > 0) return "Health uses calories, sugar, salt, fat, protein, fiber, and allergens.";
  return "Health uses the official Nutri-Score when detailed nutrition is missing.";
}

function getEcoGradeBasis(hasEco: boolean) {
  return hasEco
    ? "Eco uses the official Open Food Facts Eco-Score for this product."
    : "Eco is not included because this product has no official Eco-Score yet.";
}

function getTypedInsightTone(type: ProductInsight["type"]) {
  if (type === "positive") {
    return {
      icon: CheckCircle2,
      className: "border-[var(--sk-grade-a-border)] bg-[var(--sk-grade-a-bg)] text-[var(--sk-brand-forest)]"
    };
  }

  if (type === "warning") {
    return {
      icon: AlertTriangle,
      className: "border-[var(--sk-grade-d-border)] bg-[var(--sk-grade-d-bg)] text-[var(--sk-grade-d-text)]"
    };
  }

  return {
    icon: Info,
    className: "border-[var(--sk-border-muted)] bg-[var(--sk-surface-card)] text-[var(--sk-text-secondary)]"
  };
}

function polishInsightText(text: string) {
  return text
    .replace(/\bmentioned\b/gi, "found")
    .replace(/\bseems\b/gi, "is")
    .replace(/\bappears\b/gi, "is");
}

function getShoppingCategory(product: ProductResult) {
  const text = `${product.categories} ${product.kassalappCategories.join(" ")}`.toLowerCase();

  if (/(milk|dairy|cheese|yogurt|melk|ost|yoghurt)/.test(text)) return "Dairy";
  if (/(meat|beef|pork|chicken|kjøtt|kylling|pølse)/.test(text)) return "Meat";
  if (/(fish|seafood|salmon|tuna|fisk|laks)/.test(text)) return "Fish";
  if (/(vegetable|produce|salad|grønnsak|frukt)/.test(text)) return "Vegetables";
  if (/(snack|chocolate|candy|chips|sjokolade|godteri)/.test(text)) return "Snacks";
  if (/(drink|beverage|juice|soda|water|drikke|brus|vann)/.test(text)) return "Drinks";
  return "Other";
}

export function ProductPageLayout({
  product,
  getKeyInsights,
  getNutritionRows,
  visibleIngredients,
  hasNutritionSignal,
  getEcoGrade,
}: Props) {
  const router = useRouter();
  const { addItem } = useShoppingList();
  const [activeTab, setActiveTab] = useState<"grade" | "nutrition" | "details">("grade");
  const [gradeHelpOpen, setGradeHelpOpen] = useState(false);
  const [addedToList, setAddedToList] = useState(false);
  const gradeHelpRef = useRef<HTMLDivElement>(null);
  const gradeHelpButtonRef = useRef<HTMLButtonElement>(null);

  const hasOfficialEcoData = hasEcoData(product);
  const ecoGrade = hasOfficialEcoData ? product.ecoGradeLetter ?? getEcoGrade(product) : null;
  const healthGrade = hasNutritionSignal(product) ? product.healthGrade : null;
  const nutritionRows = getNutritionRows(product);
  const ingredients = visibleIngredients(product);
  const insights = getKeyInsights(product).map((insight) => ({
      ...insight,
      text: polishInsightText(insight.text)
    }))
    .filter((insight) => {
      const text = insight.text.toLowerCase();
      if (text.includes("limited eco data")) return false;
      if (text.includes("eco score is missing")) return false;
      if (text.includes("weak eco score")) return false;
      return true;
    })
    .slice(0, 3);

  useEffect(() => {
    if (!gradeHelpOpen) return;

    function closeGradeHelp({ returnFocus = false } = {}) {
      setGradeHelpOpen(false);
      if (returnFocus) {
        window.requestAnimationFrame(() => gradeHelpButtonRef.current?.focus());
      }
    }

    function closeOnOutsideTap(event: PointerEvent) {
      if (!gradeHelpRef.current?.contains(event.target as Node)) {
        closeGradeHelp();
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeGradeHelp({ returnFocus: true });
      }
    }

    window.addEventListener("pointerdown", closeOnOutsideTap);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeOnOutsideTap);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [gradeHelpOpen]);

  return (
    <div className="flex flex-col bg-[var(--sk-brand-mist)]" style={{ height: "100dvh" }}>

      {/* BACK */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <Link href="/scan" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--sk-brand-forest)] hover:bg-[var(--sk-surface-white)]" aria-label="Back to scanner">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="type-section-label text-[var(--sk-text-muted)]">Product result</h1>
      </div>

      {/* PRODUCT HERO */}
      <div className="mx-4 flex-shrink-0 overflow-hidden rounded-2xl bg-[var(--sk-brand-forest)] p-4 flex items-center gap-5 shadow-[0_16px_40px_rgba(23,74,49,0.16)]">
        {product.displayImage ? (
          <img
            src={product.displayImage}
            alt={product.name}
            className="h-24 w-24 rounded-2xl object-contain bg-[var(--sk-surface-white)]/12 flex-shrink-0"
          />
        ) : (
          <div className="h-24 w-24 rounded-2xl bg-[var(--sk-surface-white)]/12 flex items-center justify-center text-4xl flex-shrink-0 border border-white/10">
            {product.placeholderEmoji}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="type-heading-1 line-clamp-2 text-white">{product.name}</h2>
          <p className="type-body-sm mt-2 text-[var(--sk-text-faint)]">{product.brand}</p>
          <span className="type-caption mt-3 inline-block rounded-full border border-white/15 bg-[var(--sk-surface-white)]/12 px-2.5 py-0.5 text-[var(--sk-brand-mist-dark)]">
            {product.norwegianDataStatus === "kassalapp" ? "✓ Norwegian store data" : "⚠ Limited store data"}
          </span>
        </div>
      </div>

      {/* GRADE STRIP */}
      <div ref={gradeHelpRef} className="relative mx-4 mt-2 flex-shrink-0 bg-[var(--sk-surface-white)] rounded-2xl px-4 py-4 flex items-center justify-between border border-[var(--sk-border-default)] shadow-[0_10px_30px_rgba(50,42,31,0.04)]">
        <button
          ref={gradeHelpButtonRef}
          type="button"
          aria-label="Explain product grades"
          aria-controls="grade-help-popover"
          aria-expanded={gradeHelpOpen}
          onClick={() => setGradeHelpOpen((open) => !open)}
          className="absolute right-3 top-3 z-20 grid h-11 w-11 place-items-center rounded-full border border-[var(--sk-border-default)] bg-[var(--sk-surface-card)] text-[var(--sk-text-secondary)] shadow-sm transition-colors hover:bg-[var(--sk-brand-mist-dark)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sk-brand-forest)]"
        >
          <Info className="h-5 w-5" />
        </button>

        {gradeHelpOpen ? (
          <div
            id="grade-help-popover"
            role="dialog"
            aria-labelledby="grade-help-title"
            className="absolute right-3 top-16 z-30 w-[min(20rem,calc(100vw-4rem))] rounded-2xl border border-[var(--sk-border-default)] bg-[var(--sk-surface-white)] p-4 text-left shadow-[0_18px_60px_rgba(50,42,31,0.18)]"
          >
            <p id="grade-help-title" className="type-section-label text-[var(--sk-brand-forest)]">Why these grades?</p>
            <div className="type-body-sm mt-3 space-y-3 text-[var(--sk-text-secondary)]">
              <p><span className="font-bold text-[var(--sk-text-primary)]">Health:</span> {getHealthGradeBasis(product, Boolean(healthGrade))}</p>
              <p><span className="font-bold text-[var(--sk-text-primary)]">Eco:</span> {getEcoGradeBasis(hasOfficialEcoData)}</p>
            </div>
          </div>
        ) : null}

        {/* Health */}
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <div
            className="type-grade flex h-14 w-14 items-center justify-center rounded-full border-[3px] font-satoshi text-2xl"
            style={{ borderColor: getColor(healthGrade), color: getColor(healthGrade), background: getGradeBackground(healthGrade) }}
          >
            {healthGrade ?? "–"}
          </div>
          <span className="type-section-label text-[var(--sk-text-muted)]">Health</span>
          <span className="type-caption text-[var(--sk-text-secondary)]">{healthGrade ? gradeDescriptions[healthGrade] : "Not enough data yet"}</span>
        </div>

        <div className="w-px h-12 bg-[var(--sk-brand-mist-dark)]" />

        {hasOfficialEcoData ? (
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <div
              className="type-grade flex h-14 w-14 items-center justify-center rounded-full border-[3px] font-satoshi text-2xl"
              style={{ borderColor: getColor(ecoGrade), color: getColor(ecoGrade), background: getGradeBackground(ecoGrade) }}
            >
              {ecoGrade ?? "–"}
            </div>
            <span className="type-section-label text-[var(--sk-text-muted)]">Eco</span>
            <span className="type-caption text-[var(--sk-text-secondary)]">{ecoGrade ? gradeDescriptions[ecoGrade] : "Not enough data yet"}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 flex-1 opacity-65">
            <span className="type-grade text-3xl text-[var(--sk-text-faint)]">–</span>
            <span className="type-section-label text-[var(--sk-text-muted)]">Eco</span>
            <span className="type-caption text-[var(--sk-text-muted)]">No eco data</span>
          </div>
        )}
      </div>

      {/* TABS */}
      <div className="mx-4 mt-2 flex-shrink-0 bg-[var(--sk-surface-white)] rounded-xl p-1 grid grid-cols-3 gap-1 border border-[var(--sk-border-default)]">
        {(["grade", "nutrition", "details"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`type-button rounded-[10px] py-2.5 transition-all ${
              activeTab === tab ? "bg-[var(--sk-brand-forest)] text-white shadow-sm" : "text-[var(--sk-text-muted)] hover:text-[var(--sk-text-secondary)]"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* SCROLLABLE TAB CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-4 min-h-0">

        {/* GRADE TAB */}
        {activeTab === "grade" && (
          <div className="flex flex-col gap-2.5">
            {insights.length > 0 && (
              <>
                <p className="type-section-label px-1 text-[var(--sk-text-muted)]">
                  Key insights
                </p>
                {insights.map((insight) => {
                  const tone = getTypedInsightTone(insight.type);
                  const Icon = tone.icon;
                  return (
                    <div
                      key={insight.text}
                      className={`type-body-sm flex items-start gap-3 rounded-xl border px-4 py-3 ${tone.className}`}
                    >
                      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>{insight.text}</span>
                    </div>
                  );
                })}
              </>
            )}

            <p className="type-section-label px-1 pt-1 text-[var(--sk-text-muted)]">
              Product context
            </p>
            {[
              {
                icon: "🌍",
                name: "Origin",
                val: product.origins === "Origin unknown" ? "Origin unknown" : product.origins,
                tone: "bg-[var(--sk-brand-mist-card)] text-[var(--sk-brand-forest)]",
              },
            ].map((s) => (
              <div
                key={s.name}
                className="bg-[var(--sk-surface-white)] rounded-xl px-4 py-3 flex items-center gap-3 border border-[var(--sk-border-default)]"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--sk-brand-mist-card)] flex items-center justify-center text-lg flex-shrink-0">
                  {s.icon}
                </div>
                <div className="flex-1">
                  <p className="type-body-sm font-bold text-ink">{s.name}</p>
                </div>
                <span className={`type-caption flex-shrink-0 rounded-full px-3 py-1 ${s.tone}`}>
                  {s.val}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* NUTRITION TAB */}
        {activeTab === "nutrition" && (
          <div className="flex flex-col gap-2.5">
            {nutritionRows.length === 0 ? (
              <p className="type-body-sm py-8 text-center text-[var(--sk-text-muted)]">No nutrition data available</p>
            ) : (
              <>
                <p className="type-section-label px-1 text-[var(--sk-text-muted)]">Per 100g</p>
                <div className="bg-[var(--sk-surface-white)] rounded-xl overflow-hidden border border-[var(--sk-border-default)]">
                  {nutritionRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between px-4 py-3 border-b border-[var(--sk-border-default)] last:border-b-0"
                    >
                      <span className="type-body-sm font-semibold text-ink">{row.label}</span>
                      <span className={`type-body-sm rounded-full px-3 py-0.5 font-bold ${row.tone}`}>
                        {row.displayAmount}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="type-section-label px-1 pt-1 text-[var(--sk-text-muted)]">
                  Daily impact
                </p>
                <DailyIntake nutrition={product.kassalappNutrition} />
              </>
            )}
          </div>
        )}

        {/* DETAILS TAB */}
        {activeTab === "details" && (
          <div className="flex flex-col gap-2.5">
            <p className="type-section-label px-1 text-[var(--sk-text-muted)]">
              Processing
            </p>
            {product.novaGroup ? (
              <div className="bg-[var(--sk-surface-white)] rounded-xl px-4 py-3 flex items-center gap-4 border border-[var(--sk-border-default)]">
                <div
                  className={`type-grade flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl ${
                    product.novaGroup === 1
                      ? "bg-[var(--sk-grade-a-bg)] text-[var(--sk-brand-forest)]"
                      : product.novaGroup === 4
                      ? "bg-[var(--sk-grade-d-bg)] text-[var(--sk-grade-d-text)]"
                      : "bg-[var(--sk-grade-c-bg)] text-[var(--sk-grade-c-text)]"
                  }`}
                >
                  {product.novaGroup}
                </div>
                <div>
                  <p className="type-section-label text-[var(--sk-text-muted)]">NOVA processing</p>
                  <p className="type-body-sm mt-0.5 font-bold text-ink">{NOVA_LABELS[product.novaGroup]}</p>
                </div>
              </div>
            ) : (
              <div className="bg-[var(--sk-surface-white)] rounded-xl px-4 py-3 flex items-center gap-3 border border-[var(--sk-border-default)]">
                <div className="w-10 h-10 rounded-xl bg-[var(--sk-grade-c-bg)] flex items-center justify-center text-lg flex-shrink-0">
                  🔢
                </div>
                <div>
                  <p className="type-body-sm font-bold text-ink">No NOVA rating yet</p>
                  <p className="type-caption mt-1 text-[var(--sk-text-secondary)]">Processing data is not available for this product.</p>
                </div>
              </div>
            )}

            <Additives additives={product.additives} />

            {product.allergens.length > 0 && (
              <>
                <p className="type-section-label px-1 pt-1 text-[var(--sk-text-muted)]">
                  Allergens
                </p>
                <div className="bg-[var(--sk-surface-white)] rounded-xl px-4 py-3 border border-[var(--sk-border-default)]">
                  <div className="flex flex-wrap gap-2">
                    {product.allergens.map((a) => (
                      <span key={a} className="type-caption rounded-full bg-[var(--sk-grade-d-bg)] px-3 py-1 text-[var(--sk-grade-d-text)]">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {ingredients && (
              <>
                <p className="type-section-label px-1 pt-1 text-[var(--sk-text-muted)]">
                  Ingredients
                </p>
                <div className="bg-[var(--sk-surface-white)] rounded-xl px-4 py-3 border border-[var(--sk-border-default)]">
                  <p className="type-body-sm text-[var(--sk-text-secondary)]">{ingredients}</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM ACTIONS */}
      <div className="flex-shrink-0 space-y-2 border-t border-[var(--sk-border-default)] bg-[var(--sk-surface-white)] px-4 py-3">
        <button
          type="button"
          style={{ width: "100%", padding: "15px", borderRadius: "16px" }}
          onClick={() => router.push("/scan")}
          className="type-button bg-[var(--sk-brand-mist-card)] text-[var(--sk-brand-forest)]"
        >
          Scan again
        </button>
        <button
          type="button"
          onClick={() => {
            if (addedToList) {
              router.push("/shopping-list");
              return;
            }

            void addItem({
              name: product.name,
              category: getShoppingCategory(product),
              healthGrade: healthGrade ?? undefined,
              addedFromScan: true
            }).then(() => setAddedToList(true));
          }}
          className="type-button flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--sk-border-green)] bg-white px-4 py-3 text-[var(--sk-brand-forest)]"
        >
          {addedToList ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Added to list
            </>
          ) : (
            <>
              <ListPlus className="h-4 w-4" />
              Add to list
            </>
          )}
        </button>
      </div>
    </div>
  );
}
