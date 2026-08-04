"use client";

/**
 * ScoreCard — D1 "The Shelf", step 3.
 *
 * The score, where it sits on its own shelf, and two grade tiles. Three rules:
 *
 *   1. The number carries the band colour; everything else stays ink.
 *   2. The shelf median replaces endorsement — "shelf median · 51" says where
 *      this product sits without Merk having to praise anything.
 *   3. "why?" is a real 44px control, not a 10px link. It is the affordance the
 *      entire number depends on.
 *
 * The two tiles are Nutri-Score and Eco. The old Health tile is gone: it
 * duplicated the score sitting right above it.
 */

import type { GradeLetter } from "@/lib/types";
import { t, type Language } from "@/lib/i18n";

type ScoreCardProps = {
  score: number | null;
  /** Band colour follows the score, not the grade letter. */
  nutriScore: GradeLetter | null;
  ecoGrade: GradeLetter | null;
  /** Median of this product's own category, 0-100, when we have enough data. */
  shelfMedian?: number | null;
  /** False when the score came from the absolute fallback. */
  confident?: boolean;
  lang: Language;
  onWhy: () => void;
};

const GRADES: GradeLetter[] = ["A", "B", "C", "D", "E"];

export function bandColour(score: number | null): string {
  if (score == null) return "var(--sk-text-faint)";
  if (score >= 60) return "var(--sk-score-good)";
  if (score >= 40) return "var(--sk-score-mid)";
  return "var(--sk-score-weak)";
}

function gradeColour(grade: GradeLetter | null): string {
  if (!grade) return "var(--sk-text-faint)";
  if (grade === "A" || grade === "B") return "var(--sk-score-good)";
  if (grade === "C" || grade === "D") return "var(--sk-score-mid)";
  return "var(--sk-score-weak)";
}

/** Absolute descriptors. Never shelf comparisons — those live on the slider. */
export function verdictWord(grade: GradeLetter | null, lang: Language): string {
  if (!grade) return t("product_no_data", lang);
  const key = {
    A: "product_excellent",
    B: "product_good",
    C: "product_average",
    D: "product_poor",
    E: "product_bad"
  }[grade] as Parameters<typeof t>[0];
  return t(key, lang);
}

/**
 * One tile: an oversized ghost letter, the category label, a solid letter chip,
 * the verdict word in INK, and a five-step dot scale. The dot count is the
 * accessibility fallback — meaning never rides on hue alone.
 */
function GradeTile({
  label,
  grade,
  lang,
  caption
}: {
  label: string;
  grade: GradeLetter | null;
  lang: Language;
  caption?: string;
}) {
  const colour = gradeColour(grade);
  const filled = grade ? GRADES.indexOf(grade) + 1 : 0;

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        flex: 1,
        background: "var(--sk-surface-card)",
        border: "0.5px solid var(--sk-border-default)",
        borderRadius: 18,
        padding: "13px 15px 14px"
      }}
    >
      {/* Ghost letter bleeding off the top-right */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          right: -6,
          top: -18,
          fontFamily: "var(--sk-font-brand)",
          fontSize: 76,
          lineHeight: 1,
          color: "var(--sk-text-primary)",
          opacity: 0.05
        }}
      >
        {grade ?? "?"}
      </span>

      <span
        style={{
          fontFamily: "var(--sk-font-data)",
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--sk-text-muted)"
        }}
      >
        {label}
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 9 }}>
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 26,
            height: 26,
            borderRadius: 9,
            background: colour,
            color: "#fff",
            fontFamily: "var(--sk-font-ui)",
            fontSize: 14,
            fontWeight: 600,
            flexShrink: 0
          }}
        >
          {grade ?? "–"}
        </span>
        {/* Verdict word stays INK, never the grade colour. */}
        <span
          style={{
            fontFamily: "var(--sk-font-brand)",
            fontSize: 17,
            letterSpacing: "-0.015em",
            color: "var(--sk-text-primary)"
          }}
        >
          {verdictWord(grade, lang)}
        </span>
      </div>

      {caption ? (
        <p style={{ fontSize: 11, color: "var(--sk-text-muted)", marginTop: 8 }}>{caption}</p>
      ) : (
        <div style={{ display: "flex", gap: 2.5, marginTop: 10 }} aria-hidden>
          {GRADES.map((_, index) => (
            <span
              key={index}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: index < filled ? colour : "var(--sk-border-default)"
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ScoreCard({
  score,
  nutriScore,
  ecoGrade,
  shelfMedian,
  confident = true,
  lang,
  onWhy
}: ScoreCardProps) {
  const colour = bandColour(score);
  const position = Math.max(0, Math.min(100, score ?? 0));

  return (
    <section>
      <div
        style={{
          background: "var(--sk-surface-card)",
          border: "0.5px solid var(--sk-border-default)",
          borderRadius: 22,
          padding: 20
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
          <div style={{ flexShrink: 0 }}>
            <div
              style={{
                fontFamily: "var(--sk-font-ui)",
                fontVariantNumeric: "tabular-nums",
                fontSize: 40,
                lineHeight: 1,
                color: colour
              }}
            >
              {score ?? "–"}
            </div>
            <div
              style={{
                fontFamily: "var(--sk-font-data)",
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--sk-text-muted)",
                marginTop: 6
              }}
            >
              {t("product_score", lang)}
            </div>
            {/* The weakest trust affordance in the old app was a 10px link. */}
            <button
              type="button"
              onClick={onWhy}
              className="focus-ring"
              style={{
                marginTop: 8,
                minHeight: "var(--sk-min-tap)",
                padding: "0 16px",
                borderRadius: 999,
                background: "var(--sk-grade-a-bg)",
                color: "var(--sk-grade-a-text)",
                fontSize: 13
              }}
            >
              {t("product_why", lang)}
            </button>
          </div>

          {/* Where this sits on its own shelf */}
          {shelfMedian != null ? (
            <div style={{ flex: 1, paddingTop: 10 }}>
              <div
                style={{ position: "relative", height: 9, borderRadius: 5, background: "var(--sk-brand-mist-dark)" }}
              >
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: `${shelfMedian}%`,
                    top: -3,
                    width: 2,
                    height: 15,
                    background: "var(--sk-text-muted)"
                  }}
                />
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: `calc(${position}% - 7.5px)`,
                    top: -3,
                    width: 15,
                    height: 15,
                    borderRadius: "50%",
                    background: colour,
                    boxShadow: "0 0 0 3px var(--sk-surface-card)"
                  }}
                />
              </div>
              <p
                style={{
                  textAlign: "right",
                  marginTop: 9,
                  fontSize: 11.5,
                  color: "var(--sk-text-muted)",
                  fontVariantNumeric: "tabular-nums"
                }}
              >
                {t("product_shelf_median", lang)} · {shelfMedian}
              </p>
            </div>
          ) : null}
        </div>

        {/* Two tiles. Never a tinted fill — tint is reserved for flagged
            additives, so "grade" and "warning" can never look alike. */}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <GradeTile
            label={t("product_nutriscore", lang)}
            grade={nutriScore}
            lang={lang}
            caption={confident ? undefined : t("product_limited_data_caption", lang)}
          />
          <GradeTile label={t("product_eco", lang)} grade={ecoGrade} lang={lang} />
        </div>
      </div>
    </section>
  );
}
