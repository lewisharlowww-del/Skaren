"use client";

import { useState } from "react";
import type { AdditiveAnalysis } from "@/lib/additives";
import { lookupENumber, type SafetyRating } from "@/lib/enumbers";
import { t, type Language } from "@/lib/i18n";

type AdditivesProps = {
  additives: AdditiveAnalysis[] | string[];
  lang?: Language;
};

const SAFETY_STYLES: Record<SafetyRating, { dot: string; tag: { bg: string; color: string } }> = {
  safe:     { dot: "var(--sk-grade-a-text)", tag: { bg: "var(--sk-grade-a-bg)", color: "var(--sk-grade-a-text)" } },
  moderate: { dot: "var(--sk-grade-c-text)", tag: { bg: "var(--sk-grade-c-bg)", color: "var(--sk-grade-c-text)" } },
  avoid:    { dot: "var(--sk-grade-e-text)", tag: { bg: "var(--sk-grade-e-bg)", color: "var(--sk-grade-e-text)" } },
};

function safetyLabel(safety: SafetyRating, lang: Language): string {
  if (safety === "safe") return t('product_safe', lang);
  if (safety === "avoid") return t('product_avoid', lang);
  return t('product_moderate', lang);
}

/** Normalise the union input to a consistent AdditiveAnalysis array */
function normalise(input: AdditiveAnalysis[] | string[]): AdditiveAnalysis[] {
  if (input.length === 0) return [];

  // Detect string[] vs AdditiveAnalysis[]
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
        };
      }
      // Unknown code — show gracefully
      return {
        code: code.toUpperCase(),
        name: `${code.toUpperCase()} Unknown additive`,
        risk: "moderate" as AdditiveAnalysis["risk"],
        description: "Not in Skaren's additive database",
        known: false,
      };
    });
  }

  return input as AdditiveAnalysis[];
}

export function Additives({ additives, lang = 'no' }: AdditivesProps) {
  const [openCode, setOpenCode] = useState<string | null>(null);
  const items = normalise(additives);

  if (items.length === 0) {
    return (
      <div style={{ background: "var(--sk-grade-a-bg)", borderRadius: 14, border: "0.5px solid var(--sk-grade-a-border)", padding: "10px 12px" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--sk-grade-a-text)" }}>{t('product_no_additives', lang)}</p>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--sk-surface-white)", borderRadius: 14, border: "0.5px solid var(--sk-border-default)", overflow: "hidden" }}>
      {items.map((additive, index) => {
        const safety = (additive.risk ?? "moderate") as SafetyRating;
        const styles = SAFETY_STYLES[safety] ?? SAFETY_STYLES.moderate;
        const isOpen = openCode === additive.code;
        const isLast = index === items.length - 1;

        return (
          <div key={additive.code}>
            <button
              type="button"
              onClick={() => setOpenCode(isOpen ? null : additive.code)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderBottom: isLast && !isOpen ? "none" : "0.5px solid var(--sk-border-muted)",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {/* Coloured dot */}
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: styles.dot, flexShrink: 0 }} />

              {/* Name + description */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--sk-text-primary)", lineHeight: 1.3 }}>
                  {additive.code.toUpperCase()} {additive.name}
                </p>
                {!isOpen && additive.description ? (
                  <p style={{ fontSize: 11, color: "var(--sk-text-muted)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {additive.description}
                  </p>
                ) : null}
              </div>

              {/* Safety tag */}
              <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 6, padding: "2px 7px", flexShrink: 0, background: styles.tag.bg, color: styles.tag.color }}>
                {safetyLabel(safety, lang)}
              </span>
            </button>

            {/* Expanded description */}
            {isOpen ? (
              <div style={{ padding: "6px 12px 10px 27px", borderBottom: isLast ? "none" : "0.5px solid var(--sk-border-muted)", background: styles.tag.bg }}>
                <p style={{ fontSize: 12, color: styles.dot, lineHeight: 1.5 }}>{additive.description}</p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
