"use client";

/**
 * NutritionTable — D1 "The Shelf" merged nutrition.
 *
 * One section, two columns under a single header:
 *   Left  — Nutrition · 100 g: grams exactly as printed on the label.
 *   Right — Of your day: a bar + % of a 2000 kcal reference.
 *
 * Rules from the redesign guide:
 *   - The NUMBERS stay ink. The bar carries the signal (double-coding value and
 *     bar was the biggest source of noise on the old screen).
 *   - Colour only where it matters: saturated fat + salt when high (weak),
 *     protein + fiber when good (positive), neutral otherwise.
 *   - Colour is never the only cue — the bar length and an explicit % carry the
 *     same meaning for colour-blind users (Step 8 accessibility).
 */

import { t, type Language } from "@/lib/i18n";
import type { KassalappNutrition, ProductResult } from "@/lib/types";
import { getNutritionRows } from "@/lib/productDetails";

type NutritionTableProps = {
  product: ProductResult;
  nutrition: KassalappNutrition[];
  lang?: Language;
};

// Reference daily amounts (per the 2000 kcal EU reference intake).
const DAILY_REFERENCE: Record<string, number> = {
  Calories: 2000,
  Fat: 70,
  "Saturated fat": 20,
  Carbs: 260,
  Sugars: 50,
  Fiber: 25,
  Protein: 50,
  Salt: 6,
};

// Which nutrients read "good when high" vs "watch when high".
const HIGHER_IS_BETTER = new Set(["Protein", "Fiber"]);
const WATCH_WHEN_HIGH = new Set(["Saturated fat", "Salt", "Sugars"]);

function toneFor(matchKey: string, percent: number): { bar: string; strong: boolean } {
  if (HIGHER_IS_BETTER.has(matchKey)) {
    return percent >= 20 ? { bar: "var(--sk-status-positive)", strong: true } : { bar: "var(--sk-border-muted)", strong: false };
  }
  if (WATCH_WHEN_HIGH.has(matchKey)) {
    if (percent >= 35) return { bar: "var(--sk-score-weak)", strong: true };
    if (percent >= 20) return { bar: "var(--sk-score-mid)", strong: true };
  }
  return { bar: "var(--sk-brand-mist-dark)", strong: false };
}

export function NutritionTable({ product, nutrition, lang = "no" }: NutritionTableProps) {
  const rows = getNutritionRows(product, lang);
  if (rows.length === 0) return null;

  return (
    <div
      className="overflow-hidden"
      style={{ background: "var(--sk-surface-white)", borderRadius: "var(--sk-radius-md)", border: "0.5px solid var(--sk-border-default)" }}
    >
      {/* Column headers */}
      <div
        className="grid items-center"
        style={{
          gridTemplateColumns: "1fr 1.15fr",
          gap: 12,
          padding: "9px 14px",
          borderBottom: "0.5px solid var(--sk-border-default)",
          background: "var(--sk-brand-mist-card)",
        }}
      >
        <span className="type-section-label" style={{ color: "var(--sk-text-muted)" }}>
          {t("product_nutrition", lang)} · 100 g
        </span>
        <span className="type-section-label" style={{ color: "var(--sk-text-muted)", textAlign: "right" }}>
          {lang === "no" ? "Av dagen din" : "Of your day"}
        </span>
      </div>

      {rows.map((row, index) => {
        const reference = DAILY_REFERENCE[row.matchKey];
        const percent = reference ? Math.round((row.amount / reference) * 100) : null;
        const tone = percent != null ? toneFor(row.matchKey, percent) : { bar: "var(--sk-border-muted)", strong: false };
        return (
          <div
            key={row.label}
            className="grid items-center"
            style={{
              gridTemplateColumns: "1fr 1.15fr",
              gap: 12,
              minHeight: 46,
              padding: "9px 14px",
              ...(index < rows.length - 1 ? { borderBottom: "1px solid var(--sk-border-muted)" } : {}),
            }}
          >
            {/* Left — label + grams as printed. Numbers stay ink. */}
            <div style={{ minWidth: 0 }}>
              <p className="type-body-sm" style={{ fontWeight: 600, color: "var(--sk-text-primary)", lineHeight: 1.2 }}>
                {row.label}
              </p>
              <p
                style={{
                  fontFamily: "var(--sk-font-data)",
                  fontSize: 13,
                  color: "var(--sk-text-primary)",
                  marginTop: 2,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {row.displayAmount}
              </p>
            </div>

            {/* Right — bar + %. The bar carries the signal, the % is the word cue. */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
              {percent != null ? (
                <>
                  <div
                    style={{ flex: 1, maxWidth: 120, height: 8, borderRadius: 999, overflow: "hidden", background: "var(--sk-border-muted)" }}
                    role="img"
                    aria-label={`${percent}% ${lang === "no" ? "av dagen" : "of your day"}`}
                  >
                    <div
                      className={tone.strong && WATCH_WHEN_HIGH.has(row.matchKey) && percent >= 35 ? "sk-pattern-caution" : undefined}
                      style={{ height: "100%", borderRadius: 999, width: `${Math.min(100, Math.max(3, percent))}%`, background: tone.bar }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--sk-font-data)",
                      fontSize: 12,
                      minWidth: 34,
                      textAlign: "right",
                      color: tone.strong ? tone.bar : "var(--sk-text-muted)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {percent}%
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 12, color: "var(--sk-text-faint)" }}>–</span>
              )}
            </div>
          </div>
        );
      })}

      {/* Basis footnote. Portion data would let these switch to "per serving". */}
      <div style={{ padding: "8px 14px", borderTop: "0.5px solid var(--sk-border-muted)", background: "var(--sk-brand-mist-card)" }}>
        <p className="type-caption" style={{ color: "var(--sk-text-faint)", textTransform: "none", letterSpacing: 0 }}>
          {lang === "no" ? "Andel av en referansedag på 2000 kcal." : "Share of a 2000 kcal reference day."}
        </p>
      </div>
    </div>
  );
}
