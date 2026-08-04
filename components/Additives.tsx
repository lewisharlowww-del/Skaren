"use client";

/**
 * Additives — D1 "The Shelf", step 4.
 *
 * The marketing spearhead, so it sits directly under Merk's verdict and above
 * nutrition. Three rules hold the section together:
 *
 *   1. The PROPORTION is the headline, not the count. A segmented ratio bar
 *      means 1-of-4 can never read like 4-of-4.
 *   2. FUNCTION FIRST. "Preservative" in plain words is the bold line; the
 *      chemical name sits quiet underneath. That keeps the section educational
 *      rather than alarmist.
 *   3. Severity lives in the left edge, the meter and the word — never in a
 *      whole card turning red.
 */

import { useState } from "react";
import type { AdditiveAnalysis } from "@/lib/additives";
import { lookupENumber, type SafetyRating } from "@/lib/enumbers";
import { t, type Language } from "@/lib/i18n";

type AdditivesProps = {
  additives: AdditiveAnalysis[] | string[];
  lang?: Language;
};

type Item = AdditiveAnalysis & { functionWord: string | null };

/** Plain-words function, translated. The E-number database calls it `category`. */
const FUNCTION_NO: Record<string, string> = {
  Colour: "Fargestoff",
  Preservative: "Konserveringsmiddel",
  Antioxidant: "Antioksidant",
  "Acidity Regulator": "Surhetsregulator",
  Emulsifier: "Emulgator",
  Stabiliser: "Stabilisator",
  Thickener: "Fortykningsmiddel",
  Sweetener: "Søtstoff",
  "Flavour Enhancer": "Smaksforsterker",
  "Raising Agent": "Hevemiddel",
  "Anti-caking Agent": "Antiklumpemiddel",
  "Glazing Agent": "Overflatemiddel"
};

function functionWord(category: string | undefined, lang: Language): string | null {
  if (!category) return null;
  return lang === "no" ? FUNCTION_NO[category] ?? category : category;
}

/** Normalise the union input to a consistent list, carrying the function word. */
function normalise(input: AdditiveAnalysis[] | string[], lang: Language): Item[] {
  if (input.length === 0) return [];

  if (typeof input[0] === "string") {
    return (input as string[]).map((code) => {
      const entry = lookupENumber(code);
      if (entry) {
        return {
          code: entry.code,
          name: entry.name,
          risk: entry.safety as AdditiveAnalysis["risk"],
          description: entry.description,
          known: true,
          functionWord: functionWord(entry.category, lang)
        };
      }
      return {
        code: code.toUpperCase(),
        name: `${code.toUpperCase()}`,
        risk: "moderate" as AdditiveAnalysis["risk"],
        description: t("product_unknown_additive", lang),
        known: false,
        functionWord: null
      };
    });
  }

  return (input as AdditiveAnalysis[]).map((additive) => ({
    ...additive,
    functionWord: functionWord(lookupENumber(additive.code)?.category, lang)
  }));
}

/** Three dots, filled by severity. Colour is never the only cue — the count is. */
function CautionMeter({ filled }: { filled: number }) {
  return (
    <span style={{ display: "flex", gap: 2.5 }} aria-hidden>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          style={{
            width: index < filled ? 4.5 : 5,
            height: index < filled ? 4.5 : 5,
            borderRadius: "50%",
            background: index < filled ? "var(--sk-score-weak)" : "var(--sk-grade-e-bg)"
          }}
        />
      ))}
    </span>
  );
}

export function Additives({ additives, lang = "no" }: AdditivesProps) {
  const [openCode, setOpenCode] = useState<string | null>(null);
  const items = normalise(additives, lang);

  // On a clean product the whole section collapses to one card. No tiles, no
  // grid — nothing to explain, so nothing is shown.
  if (items.length === 0) {
    return (
      <div
        style={{
          background: "var(--sk-surface-card)",
          border: "0.5px solid var(--sk-border-default)",
          borderRadius: 18,
          padding: "14px 18px"
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontFamily: "var(--sk-font-brand)",
              fontSize: 34,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: "var(--sk-score-good)"
            }}
          >
            0
          </span>
          <span style={{ fontSize: 12.5, color: "var(--sk-text-muted)" }}>{t("product_additives_total", lang)}</span>
        </div>
        <div
          style={{ marginTop: 11, height: 10, borderRadius: 3, background: "var(--sk-border-green)" }}
          aria-hidden
        />
        <p style={{ marginTop: 7, fontSize: 11.5, color: "var(--sk-text-secondary)" }}>
          {t("product_no_additives", lang)}
        </p>
      </div>
    );
  }

  const watch = items.filter((item) => item.risk !== "safe");
  const safe = items.filter((item) => item.risk === "safe");

  return (
    <div>
      {/* Summary — the ratio is the headline */}
      <div
        style={{
          background: "var(--sk-surface-card)",
          border: "0.5px solid var(--sk-border-default)",
          borderRadius: 18,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: 16
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexShrink: 0 }}>
          <span
            style={{
              fontFamily: "var(--sk-font-brand)",
              fontSize: 34,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              color: "var(--sk-text-primary)"
            }}
          >
            {items.length}
          </span>
          <span style={{ fontSize: 12.5, color: "var(--sk-text-muted)" }}>{t("product_additives_total", lang)}</span>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 3 }} aria-hidden>
            {items.map((item, index) => (
              <span
                key={`${item.code}-${index}`}
                style={{
                  flex: 1,
                  height: 10,
                  borderRadius: 3,
                  background: item.risk === "safe" ? "var(--sk-border-green)" : "var(--sk-score-weak)"
                }}
              />
            ))}
          </div>
          {/* Both regular weight: the proportion speaks, nobody shouts. */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, fontSize: 11.5 }}>
            <span style={{ color: "var(--sk-score-weak)" }}>
              {watch.length} {t("product_worth_watching", lang)}
            </span>
            <span style={{ color: "var(--sk-status-positive)" }}>
              {safe.length} {t("product_harmless", lang)}
            </span>
          </div>
        </div>
      </div>

      {/* Tiles — watch first, then safe */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          alignItems: "start",
          marginTop: 10
        }}
      >
        {watch.map((item) => {
          const isOpen = openCode === item.code;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => setOpenCode(isOpen ? null : item.code)}
              className="focus-ring"
              style={{
                position: "relative",
                overflow: "hidden",
                textAlign: "left",
                background: "var(--sk-surface-card)",
                border: "1px solid var(--sk-grade-e-border)",
                borderRadius: 16,
                padding: "11px 13px",
                minHeight: "var(--sk-min-tap)",
                gridColumn: isOpen ? "span 2" : undefined
              }}
              aria-expanded={isOpen}
            >
              <span
                aria-hidden
                style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "var(--sk-score-weak)" }}
              />
              <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span
                  style={{
                    fontFamily: "var(--sk-font-data)",
                    fontVariantNumeric: "tabular-nums",
                    fontSize: 14,
                    color: "var(--sk-text-primary)"
                  }}
                >
                  {item.code.toUpperCase()}
                </span>
                <CautionMeter filled={item.risk === "avoid" ? 3 : 2} />
              </span>
              {item.functionWord ? (
                <span
                  style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--sk-text-primary)", marginTop: 5 }}
                >
                  {item.functionWord}
                </span>
              ) : null}
              <span style={{ display: "block", fontSize: 10.5, color: "var(--sk-text-muted)", marginTop: 1 }}>
                {item.name}
              </span>
              <span
                style={{
                  display: "block",
                  fontFamily: "var(--sk-font-data)",
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--sk-score-weak)",
                  marginTop: 6
                }}
              >
                {t("product_worth_watching", lang)}
              </span>
              {isOpen && item.description ? (
                <span
                  style={{
                    display: "block",
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: "var(--sk-text-secondary)",
                    marginTop: 8
                  }}
                >
                  {item.description}
                </span>
              ) : null}
            </button>
          );
        })}

        {safe.map((item) => {
          const isOpen = openCode === item.code;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => setOpenCode(isOpen ? null : item.code)}
              className="focus-ring"
              style={{
                position: "relative",
                overflow: "hidden",
                textAlign: "left",
                background: "var(--sk-brand-mist)",
                border: "1px solid var(--sk-border-default)",
                borderRadius: 15,
                padding: "11px 13px",
                minHeight: "var(--sk-min-tap)",
                gridColumn: isOpen ? "span 2" : undefined
              }}
              aria-expanded={isOpen}
            >
              <span
                aria-hidden
                style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "var(--sk-border-green)" }}
              />
              <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span
                  style={{
                    fontFamily: "var(--sk-font-data)",
                    fontVariantNumeric: "tabular-nums",
                    fontSize: 12.5,
                    color: "var(--sk-text-secondary)"
                  }}
                >
                  {item.code.toUpperCase()}
                </span>
                <span
                  style={{
                    fontFamily: "var(--sk-font-data)",
                    fontSize: 9,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--sk-grade-a-text)",
                    background: "var(--sk-grade-a-bg)",
                    padding: "3px 8px",
                    borderRadius: 999
                  }}
                >
                  {t("product_safe", lang)}
                </span>
              </span>
              {item.functionWord ? (
                <span style={{ display: "block", fontSize: 11.5, color: "var(--sk-text-muted)", marginTop: 5 }}>
                  {item.functionWord}
                </span>
              ) : null}
              {isOpen && item.description ? (
                <span
                  style={{ display: "block", fontSize: 12, lineHeight: 1.5, color: "var(--sk-text-secondary)", marginTop: 8 }}
                >
                  {item.description}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Header sub-line for the section — "Nothing to explain" on a clean product. */
export function additivesHeaderHint(count: number, lang: Language): string {
  return count === 0 ? t("product_nothing_to_explain", lang) : t("product_tap_to_explain", lang);
}
