"use client";

import { useState } from "react";
import type { AdditiveAnalysis } from "@/lib/additives";
import type { SafetyRating } from "@/lib/enumbers";
import { t, type Language } from "@/lib/i18n";

type AdditivesProps = {
  additives: AdditiveAnalysis[];
  lang?: Language;
};

const SAFETY_STYLES: Record<SafetyRating, { dot: string; tag: { bg: string; color: string } }> = {
  safe:     { dot: "#2a5030", tag: { bg: "#ddeedd", color: "#2a5030" } },
  moderate: { dot: "#706030", tag: { bg: "#f0e8d0", color: "#706030" } },
  avoid:    { dot: "#703030", tag: { bg: "#e8d8d4", color: "#703030" } },
};

function safetyLabel(safety: SafetyRating, lang: Language): string {
  if (safety === "safe") return t('product_safe', lang);
  if (safety === "avoid") return t('product_avoid', lang);
  return t('product_moderate', lang);
}

export function Additives({ additives, lang = 'no' }: AdditivesProps) {
  const [openCode, setOpenCode] = useState<string | null>(null);

  if (additives.length === 0) {
    return (
      <div style={{ background: "#ddeedd", borderRadius: 14, border: "0.5px solid #88bb88", padding: "10px 12px" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#2a5030" }}>{t('product_no_additives', lang)}</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#ffffff", borderRadius: 14, border: "0.5px solid #e0d8cc", overflow: "hidden" }}>
      {additives.map((additive, index) => {
        const safety = (additive.risk ?? "moderate") as SafetyRating;
        const styles = SAFETY_STYLES[safety] ?? SAFETY_STYLES.moderate;
        const isOpen = openCode === additive.code;
        const isLast = index === additives.length - 1;

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
                borderBottom: isLast && !isOpen ? "none" : "0.5px solid #f5f0e8",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {/* Coloured dot */}
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: styles.dot, flexShrink: 0 }} />

              {/* Name + description */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#1e1e18", lineHeight: 1.3 }}>
                  {additive.code.toUpperCase()} {additive.name}
                </p>
                {!isOpen && additive.description ? (
                  <p style={{ fontSize: 11, color: "#9a8e7e", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
              <div style={{ padding: "6px 12px 10px 27px", borderBottom: isLast ? "none" : "0.5px solid #f5f0e8", background: styles.tag.bg }}>
                <p style={{ fontSize: 12, color: styles.dot, lineHeight: 1.5 }}>{additive.description}</p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
