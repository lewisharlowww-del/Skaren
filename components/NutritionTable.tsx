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
    return percent >= 20 ? { bar: "var(--sk-status-positive)", strong: true } : { bar: "var(--sk-text-muted)", strong: false };
  }
  if (WATCH_WHEN_HIGH.has(matchKey)) {
    if (percent >= 35) return { bar: "var(--sk-score-weak)", strong: true };
    if (percent >= 20) return { bar: "var(--sk-score-mid)", strong: true };
  }
  // Neutral rows (Energy, Fat, Carbs, and low-% watch/good rows). The canvas
  // fills these muted grey (#948B76 / #8E8676) — NOT the track colour, which
  // would make the bar invisible against its own track.
  return { bar: "var(--sk-text-muted)", strong: false };
}


/** Rows the label prints as a breakdown of the row above. */
const SUB_ROWS = new Set(["Saturated fat", "Sugars"]);

const LABEL_STYLE = {
  fontFamily: "var(--sk-font-ui)",
  fontVariantNumeric: "tabular-nums" as const,
  fontSize: 9.5,
  fontWeight: 600,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  color: "var(--sk-text-muted)"
};

export function NutritionTable({ product, nutrition, lang = "no" }: NutritionTableProps) {
  const rows = getNutritionRows(product, lang);
  if (rows.length === 0) return null;

  return (
    <div>
      {/*
        Traced from the canvas: ONE card, split down the middle by a 1px rule.
        Left is exactly what the label prints; right is what it means for a day.
        Every row is 44px tall — the same tap floor used everywhere else — and
        the sub-rows ("saturated", "sugars") are marked with a 10px dash rather
        than an indent, because an indent disappears at this type size.
      */}
      <div
        className="overflow-hidden"
        style={{ background: "var(--sk-surface-card)", borderRadius: 20 }}
      >
        {/* Header row */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--sk-rule-strong)" }}>
          <div style={{ flex: 1, padding: "12px 16px", ...LABEL_STYLE }}>
            {t("product_nutrition", lang)} · 100 g
          </div>
          <div style={{ width: 1, background: "var(--sk-rule-strong)" }} />
          <div style={{ flex: 1, padding: "12px 16px", ...LABEL_STYLE }}>
            {lang === "no" ? "Av dagen din" : "Of your day"}
          </div>
        </div>

        {rows.map((row, index) => {
          const reference = DAILY_REFERENCE[row.matchKey];
          const percent = reference ? Math.round((row.amount / reference) * 100) : null;
          const tone =
            percent != null ? toneFor(row.matchKey, percent) : { bar: "var(--sk-text-muted)", strong: false };
          const isSub = SUB_ROWS.has(row.matchKey);
          const last = index === rows.length - 1;

          return (
            <div
              key={row.label}
              style={{ display: "flex", borderBottom: last ? undefined : "1px solid var(--sk-border-muted)" }}
            >
              {/* Left — as printed on the label. Values stay ink. */}
              <div
                style={{
                  flex: 1,
                  padding: "0 16px",
                  minHeight: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isSub ? undefined : "space-between",
                  gap: isSub ? 9 : 8
                }}
              >
                {isSub ? <span aria-hidden style={{ width: 10, height: 1, background: "var(--sk-border-default)" }} /> : null}
                <span
                  style={{
                    flex: isSub ? 1 : undefined,
                    fontSize: isSub ? 13.5 : 14.5,
                    color: isSub ? "var(--sk-text-secondary)" : "var(--sk-text-primary)"
                  }}
                >
                  {row.label}
                </span>
                <span
                  style={{
                    fontFamily: "var(--sk-font-ui)",
                    fontVariantNumeric: "tabular-nums",
                    fontSize: isSub ? 13 : 13.5,
                    color: isSub ? "var(--sk-text-secondary)" : "var(--sk-text-primary)"
                  }}
                >
                  {row.displayAmount}
                </span>
              </div>

              <div style={{ width: 1, background: "var(--sk-rule-strong)" }} />

              {/* Right — the bar carries the signal, the % is the word cue. */}
              <div
                style={{ flex: 1, padding: "0 16px", minHeight: 44, display: "flex", alignItems: "center", gap: 9 }}
              >
                {percent != null ? (
                  <>
                    <div
                      style={{
                        flex: 1,
                        height: 5,
                        borderRadius: 3,
                        background: "var(--sk-brand-mist-card)",
                        overflow: "hidden"
                      }}
                      role="img"
                      aria-label={`${percent}% ${lang === "no" ? "av dagen" : "of your day"}`}
                    >
                      <div
                        className={
                          tone.strong && WATCH_WHEN_HIGH.has(row.matchKey) && percent >= 35
                            ? "sk-pattern-caution"
                            : undefined
                        }
                        style={{
                          width: `${Math.min(100, Math.max(1, percent))}%`,
                          height: "100%",
                          background: tone.bar
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--sk-font-ui)",
                        fontVariantNumeric: "tabular-nums",
                        fontSize: 12,
                        width: 30,
                        textAlign: "right",
                        color: "var(--sk-text-muted)"
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
      </div>

      {/* Footnote sits OUTSIDE the card in the canvas, not in a grey strip. */}
      <p
        style={{
          fontSize: 11.5,
          color: "var(--sk-text-muted)",
          marginTop: 8,
          paddingLeft: 2
        }}
      >
        {lang === "no"
          ? "Venstre: som trykt på pakken. Høyre: andel av en dag på 2000 kcal."
          : "Left: as printed on the label. Right: share of a 2000 kcal day."}
      </p>
    </div>
  );
}
