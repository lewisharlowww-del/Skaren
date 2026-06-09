import type { GradeLetter } from "@/lib/types";
import type { Language } from "@/lib/i18n";

type ScoreBadgeProps = {
  grade: GradeLetter | null;
  label?: string;
  size?: "sm" | "lg";
};

const gradeColors: Record<GradeLetter, string> = {
  A: "var(--sk-brand-forest)",
  B: "var(--sk-brand-leaf)",
  C: "var(--sk-grade-d-text)",
  D: "var(--sk-grade-d-text)",
  E: "var(--sk-grade-e-text)"
};

export const gradeDescriptions: Record<GradeLetter, string> = {
  A: "Excellent",
  B: "Good",
  C: "Average",
  D: "Poor",
  E: "Very Poor"
};

const gradeDescriptionsNo: Record<GradeLetter, string> = {
  A: "Utmerket",
  B: "Bra",
  C: "Middels",
  D: "Svak",
  E: "Veldig svak",
};

export function getGradeLabel(grade: GradeLetter, lang: Language = "en"): string {
  return lang === "no" ? gradeDescriptionsNo[grade] : gradeDescriptions[grade];
}

export function ScoreBadge({ grade, label = "ECO GRADE", size = "sm" }: ScoreBadgeProps) {
  const large = size === "lg";
  const color = grade ? gradeColors[grade] : "var(--sk-text-muted)";
  const letter = grade ?? "–";

  return (
    <div className="inline-flex flex-col items-center gap-2 text-center">
      <div
        aria-label={`${label} ${letter}`}
        className={`type-grade grid place-items-center rounded-full bg-white shadow-soft ${large ? "motion-score-reveal h-[100px] w-[100px] border-[8px] text-5xl" : "h-12 w-12 border-[5px] text-2xl"}`}
        style={{
          borderColor: color,
          color
        }}
      >
        {letter}
      </div>
      <span className="type-section-label text-soil-700">
        {label}
      </span>
      {large && grade ? <span className="type-body font-bold text-ink">{gradeDescriptions[grade]}</span> : null}
    </div>
  );
}
