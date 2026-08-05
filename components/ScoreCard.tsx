"use client";

/**
 * ScoreCard — traced 1:1 from the D1 "The Shelf" canvas frame.
 *
 * Every size, weight, radius and colour below is read literally off the
 * 402px-wide phone frame in `Skaren 2026 - Three Visions.dc.html`. Where the
 * handoff README and the HTML disagreed, the HTML won — per the README's own
 * tie-breaker. The most consequential case: the uppercase tracked labels are
 * DM Sans with tabular figures and weight 600, NOT JetBrains Mono. Mono is used
 * only for the two grade-tile labels and the status bar.
 *
 * Rules the layout encodes:
 *   1. The number carries the band colour; everything else stays ink.
 *   2. The shelf median replaces endorsement.
 *   3. "why?" is a real 44px control.
 */

import type { GradeLetter } from "@/lib/types";
import { t, type Language } from "@/lib/i18n";

type ScoreCardProps = {
  score: number | null;
  nutriScore: GradeLetter | null;
  ecoGrade: GradeLetter | null;
  shelfMedian?: number | null;
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

/** Absolute descriptors: A Excellent · B Good · C Average · D Poor · E Weak. */
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

/** Eco has its own vocabulary in the canvas — "High footprint", not "Poor". */
function ecoWord(grade: GradeLetter | null, lang: Language): string {
  if (!grade) return t("product_no_data", lang);
  const key = {
    A: "eco_verdict_a",
    B: "eco_verdict_b",
    C: "eco_verdict_c",
    D: "eco_verdict_d",
    E: "eco_verdict_e"
  }[grade] as Parameters<typeof t>[0];
  return t(key, lang);
}

function GradeTile({
  label,
  grade,
  word,
  caption
}: {
  label: string;
  grade: GradeLetter | null;
  word: string;
  caption?: string;
}) {
  const colour = gradeColour(grade);
  const filled = grade ? GRADES.indexOf(grade) + 1 : 0;

  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        overflow: "hidden",
        background: "var(--sk-surface-card)",
        border: "1px solid var(--sk-border-default)",
        borderRadius: 18,
        padding: "14px 16px 13px"
      }}
    >
      {/* Ghost letter bleeding off the top-right */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          right: -14,
          top: -18,
          fontFamily: "var(--sk-font-brand)",
          fontSize: 84,
          fontWeight: 400,
          lineHeight: 1,
          color: "var(--sk-text-primary)",
          opacity: 0.05
        }}
      >
        {grade ?? "?"}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div
          style={{
            fontFamily: "var(--sk-font-data)",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--sk-text-muted)"
          }}
        >
          {label}
        </div>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 9,
            background: colour,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--sk-font-brand)",
            fontSize: 14,
            fontWeight: 400,
            color: "#fff"
          }}
        >
          {grade ?? "–"}
        </div>
      </div>

      {/* Verdict word stays ink, never the grade colour. */}
      <div
        style={{
          fontFamily: "var(--sk-font-brand)",
          fontSize: 17,
          fontWeight: 400,
          letterSpacing: "-0.015em",
          color: "var(--sk-text-primary)",
          marginTop: 8
        }}
      >
        {word}
      </div>

      {caption ? (
        <div style={{ fontSize: 11, color: "var(--sk-text-muted)", marginTop: 9 }}>{caption}</div>
      ) : (
        <div style={{ display: "flex", gap: 2.5, marginTop: 9 }} aria-hidden>
          {GRADES.map((_, index) => (
            <div
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
    <div style={{ background: "var(--sk-surface-card)", borderRadius: 22, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              fontFamily: "var(--sk-font-ui)",
              fontVariantNumeric: "tabular-nums",
              fontSize: 40,
              fontWeight: 400,
              lineHeight: 1,
              color: colour
            }}
          >
            {score ?? "–"}
          </div>
          <div
            style={{
              fontFamily: "var(--sk-font-ui)",
              fontVariantNumeric: "tabular-nums",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--sk-text-muted)",
              marginTop: 4
            }}
          >
            {t("product_score", lang)}
          </div>
          <button
            type="button"
            onClick={onWhy}
            className="focus-ring"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44,
              marginTop: 7,
              padding: "0 14px",
              borderRadius: 999,
              background: "var(--sk-grade-a-bg)",
              fontFamily: "var(--sk-font-ui)",
              fontSize: 12.5,
              color: "var(--sk-grade-a-text)"
            }}
          >
            {t("product_why", lang)}
          </button>
        </div>

        {shelfMedian != null ? (
          <div style={{ flex: 1 }}>
            <div style={{ position: "relative", height: 9, borderRadius: 5, background: "var(--sk-brand-mist-dark)" }}>
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: `${shelfMedian}%`,
                  top: -4,
                  width: 2,
                  height: 17,
                  background: "var(--sk-text-muted)"
                }}
              />
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: `calc(${position}% - 7px)`,
                  top: -3,
                  width: 15,
                  height: 15,
                  borderRadius: "50%",
                  background: colour,
                  border: "3px solid var(--sk-surface-card)"
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 10,
                fontFamily: "var(--sk-font-ui)",
                fontVariantNumeric: "tabular-nums",
                fontSize: 11.5,
                color: "var(--sk-text-muted)"
              }}
            >
              <div>
                {t("product_shelf_median", lang)} · {shelfMedian}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <GradeTile
          label={t("product_nutriscore", lang)}
          grade={nutriScore}
          word={verdictWord(nutriScore, lang)}
          caption={confident ? undefined : t("product_limited_data_caption", lang)}
        />
        <GradeTile label={t("product_eco", lang)} grade={ecoGrade} word={ecoWord(ecoGrade, lang)} />
      </div>
    </div>
  );
}
