import type { GradeLetter } from "@/lib/types";

type ScoreBadgeProps = {
  grade: GradeLetter | null;
  label?: string;
  size?: "sm" | "lg";
};

const gradeColors: Record<GradeLetter, string> = {
  A: "#1A5C3A",
  B: "#4CAF7D",
  C: "#F4A261",
  D: "#E76F51",
  E: "#E63946"
};

export const gradeDescriptions: Record<GradeLetter, string> = {
  A: "Excellent",
  B: "Good",
  C: "Average",
  D: "Poor",
  E: "Very Poor"
};

export function ScoreBadge({ grade, label = "ECO GRADE", size = "sm" }: ScoreBadgeProps) {
  const large = size === "lg";
  const color = grade ? gradeColors[grade] : "#9CA3AF";
  const letter = grade ?? "–";

  return (
    <div className="inline-flex flex-col items-center gap-2 text-center">
      <div
        aria-label={`${label} ${letter}`}
        className={`grid place-items-center rounded-full bg-white font-black shadow-soft ${large ? "h-[100px] w-[100px] border-[8px] text-5xl" : "h-12 w-12 border-[5px] text-2xl"}`}
        style={{
          borderColor: color,
          color
        }}
      >
        {letter}
      </div>
      <span className={`font-black uppercase leading-tight tracking-[0.14em] text-soil-700 ${large ? "text-[0.82rem]" : "text-[0.78rem]"}`}>
        {label}
      </span>
      {large && grade ? <span className="text-[0.95rem] font-black text-ink">{gradeDescriptions[grade]}</span> : null}
    </div>
  );
}
