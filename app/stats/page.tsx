"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Minus,
  ScanBarcode
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { SkarenLoader } from "@/components/SkarenLoader";
import { useStats, type StatsRange } from "@/hooks/useStats";
import { useLang } from "@/lib/language-context";
import type { GradeLetter } from "@/lib/types";

const gradeClasses: Record<GradeLetter, string> = {
  A: "sk-grade-a",
  B: "sk-grade-b",
  C: "sk-grade-c",
  D: "sk-grade-d",
  E: "sk-grade-e"
};

const gradeSegmentColors: Record<GradeLetter, string> = {
  A: "var(--sk-grade-a-border)",
  B: "var(--sk-grade-b-border)",
  C: "var(--sk-grade-c-border)",
  D: "var(--sk-grade-d-border)",
  E: "var(--sk-grade-e-border)"
};

const copy = {
  en: {
    label: "Your stats",
    rangeTitle: { week: "This week", month: "This month", all: "All time" },
    rangeTab: { week: "Week", month: "Month", all: "All" },
    totalScans: "Total scans",
    averageGrade: "Avg health grade",
    gradeBreakdown: "Grade distribution",
    additives: "Additives",
    weeklyInsight: "Weekly insight",
    rangeInsight: "Range insight",
    mostScanned: "Most scanned",
    recentlyScanned: "Recently scanned",
    scan: "scan",
    scans: "scans",
    noPrior: "No previous period",
    allTime: "Across all scans",
    more: "more than last",
    fewer: "fewer than last",
    unchanged: "Same as last period",
    gradeUp: "Up from",
    gradeDown: "Down from",
    gradeSame: "Unchanged from",
    mixed: "Mixed period",
    strong: "Strong period",
    balanced: "Balanced period",
    improve: "Room to improve",
    average: "average",
    strongChoice: "strong",
    weakerChoice: "weaker",
    choices: "choices",
    noFlagged: "No flagged additives",
    across: "Across",
    selectedScans: "selected scans",
    toAvoid: "To avoid",
    moderate: "Moderate",
    noScans: "No scans yet",
    noScansSuffix: { week: "this week", month: "this month", all: "" },
    emptyHelp: "Scan your first product to see your stats.",
    scanNow: "Scan now"
  },
  no: {
    label: "Din statistikk",
    rangeTitle: { week: "Denne uken", month: "Denne måneden", all: "Hele perioden" },
    rangeTab: { week: "Uke", month: "Måned", all: "Alt" },
    totalScans: "Skanninger",
    averageGrade: "Snitt helsevurdering",
    gradeBreakdown: "Karakterfordeling",
    additives: "Tilsetningsstoffer",
    weeklyInsight: "Ukens innsikt",
    rangeInsight: "Periodens innsikt",
    mostScanned: "Mest skannet",
    recentlyScanned: "Nylig skannet",
    scan: "skanning",
    scans: "skanninger",
    noPrior: "Ingen forrige periode",
    allTime: "Alle skanninger",
    more: "flere enn sist",
    fewer: "færre enn sist",
    unchanged: "Samme som forrige periode",
    gradeUp: "Opp fra",
    gradeDown: "Ned fra",
    gradeSame: "Uendret fra",
    mixed: "Blandet periode",
    strong: "Sterk periode",
    balanced: "Balansert periode",
    improve: "Rom for forbedring",
    average: "snitt",
    strongChoice: "sterke",
    weakerChoice: "svakere",
    choices: "valg",
    noFlagged: "Ingen markerte tilsetningsstoffer",
    across: "På tvers av",
    selectedScans: "valgte skanninger",
    toAvoid: "Bør unngås",
    moderate: "Moderate",
    noScans: "Ingen skanninger ennå",
    noScansSuffix: { week: "denne uken", month: "denne måneden", all: "" },
    emptyHelp: "Skann ditt første produkt for å se statistikken.",
    scanNow: "Skann nå"
  }
} as const;

type StatsCopy = (typeof copy)[keyof typeof copy];

function Card({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[var(--sk-radius-lg)] border-[0.5px] border-[var(--sk-border-default)] bg-[var(--sk-surface-white)] ${className}`}
    >
      {children}
    </section>
  );
}

function ScanTrend({
  value,
  range,
  text
}: {
  value: number | null;
  range: StatsRange;
  text: StatsCopy;
}) {
  if (range === "all") {
    return <p className="mt-2 text-[11px] text-[var(--sk-text-muted)]">{text.allTime}</p>;
  }
  if (value === null) {
    return <p className="mt-2 text-[11px] text-[var(--sk-text-muted)]">{text.noPrior}</p>;
  }

  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  const tone =
    value > 0
      ? "text-[var(--sk-status-positive)]"
      : value < 0
        ? "text-[var(--sk-status-danger)]"
        : "text-[var(--sk-status-neutral)]";

  return (
    <span className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold ${tone}`}>
      <Icon className="h-3.5 w-3.5" />
      {value === 0
        ? text.unchanged
        : `${Math.abs(value)}% ${value > 0 ? text.more : text.fewer}`}
    </span>
  );
}

function GradeTrend({
  direction,
  previous,
  range,
  text
}: {
  direction: "up" | "down" | "same" | "none";
  previous: string | null;
  range: StatsRange;
  text: StatsCopy;
}) {
  if (range === "all") {
    return <p className="mt-2 text-[11px] text-[var(--sk-text-muted)]">{text.allTime}</p>;
  }
  if (direction === "none" || !previous) {
    return <p className="mt-2 text-[11px] text-[var(--sk-text-muted)]">{text.noPrior}</p>;
  }

  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  const tone =
    direction === "up"
      ? "text-[var(--sk-status-positive)]"
      : direction === "down"
        ? "text-[var(--sk-status-danger)]"
        : "text-[var(--sk-status-neutral)]";
  const label =
    direction === "up" ? text.gradeUp : direction === "down" ? text.gradeDown : text.gradeSame;

  return (
    <span className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold ${tone}`}>
      <Icon className="h-3.5 w-3.5" />
      {label} {previous}
    </span>
  );
}

function StatsSkeleton() {
  return (
    <div className="mt-6 space-y-3">
      <div className="h-24 animate-pulse rounded-[var(--sk-radius-lg)] bg-white/70" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-32 animate-pulse rounded-[var(--sk-radius-lg)] bg-white/70" />
        <div className="h-32 animate-pulse rounded-[var(--sk-radius-lg)] bg-white/70" />
      </div>
      <div className="h-32 animate-pulse rounded-[var(--sk-radius-lg)] bg-white/70" />
      <div className="h-44 animate-pulse rounded-[var(--sk-radius-lg)] bg-white/70" />
      <div className="h-24 animate-pulse rounded-[var(--sk-radius-lg)] bg-white/70" />
      <div className="h-52 animate-pulse rounded-[var(--sk-radius-lg)] bg-white/70" />
    </div>
  );
}

export default function StatsPage() {
  const [range, setRange] = useState<StatsRange>("week");
  const { lang } = useLang();
  const text = copy[lang];
  const stats = useStats(range, lang);
  const grades = Object.keys(stats.gradeBreakdown) as GradeLetter[];
  const strongCount = stats.gradeBreakdown.A + stats.gradeBreakdown.B;
  const weakerCount = stats.gradeBreakdown.D + stats.gradeBreakdown.E;
  const hasRepeatedProduct = stats.mostScanned.some((product) => product.count > 1);
  const summaryTone =
    strongCount > 0 && weakerCount > 0
      ? text.mixed
      : weakerCount > strongCount
        ? text.improve
        : strongCount > weakerCount
          ? text.strong
          : text.balanced;
  const avoidWidth = stats.additivesTotal
    ? (stats.additivesToAvoid / stats.additivesTotal) * 100
    : 0;
  const moderateWidth = stats.additivesTotal
    ? (stats.additivesModerate / stats.additivesTotal) * 100
    : 0;
  const flaggedAdditives =
    stats.additivesToAvoid + stats.additivesModerate;

  if (stats.loading) return <SkarenLoader message="Loading stats" />

  return (
    <>
      <BottomNav />
      <main className="min-h-screen bg-[var(--sk-brand-mist)] pb-36 text-[var(--sk-text-primary)]">
        <div className="mx-auto w-full max-w-xl px-4 pb-8 pt-6">
          <header>
            <p className="sk-label">{text.label}</p>
            <h1 className="type-heading-1 mt-1">{text.rangeTitle[range]}</h1>

            <div
              className="mt-5 grid grid-cols-3 rounded-[var(--sk-radius-pill)] border-[0.5px] border-[var(--sk-border-default)] bg-[var(--sk-brand-mist-dark)] p-1"
              role="group"
              aria-label={text.label}
            >
              {(["week", "month", "all"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRange(option)}
                  aria-pressed={range === option}
                  className={`focus-ring min-h-10 rounded-[var(--sk-radius-pill)] text-xs font-semibold transition ${
                    range === option
                      ? "bg-[var(--sk-surface-white)] text-[var(--sk-brand-forest)] shadow-sm"
                      : "text-[var(--sk-text-secondary)]"
                  }`}
                >
                  {text.rangeTab[option]}
                </button>
              ))}
            </div>
          </header>

          {stats.totalScans === 0 ? (
            <Card className="mt-8 px-6 py-12 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--sk-grade-a-bg)] text-[var(--sk-brand-forest)]">
                <ScanBarcode className="h-7 w-7" />
              </div>
              <h2 className="type-heading-3 mt-5">
                {text.noScans} {text.noScansSuffix[range]}
              </h2>
              <p className="type-body-sm mx-auto mt-2 max-w-xs text-[var(--sk-text-secondary)]">
                {text.emptyHelp}
              </p>
              <Link
                href="/scan"
                className="focus-ring type-button mt-6 inline-flex min-h-12 items-center justify-center rounded-[var(--sk-radius-lg)] bg-[var(--sk-brand-forest)] px-6 text-[var(--sk-text-on-dark)]"
              >
                {text.scanNow}
              </Link>
            </Card>
          ) : (
            <div className="mt-6 space-y-3">
              <section className="rounded-[var(--sk-radius-lg)] border-[0.5px] border-[var(--sk-border-green)] bg-[var(--sk-surface-insight)] px-4 py-4">
                <p className="text-[15px] font-bold text-[var(--sk-brand-forest)]">{summaryTone}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--sk-text-secondary)]">
                  {stats.totalScans} {stats.totalScans === 1 ? text.scan : text.scans}
                  {" · "}{text.average} {stats.avgHealthGrade}
                  {" · "}{strongCount} {text.strongChoice} / {weakerCount} {text.weakerChoice} {text.choices}
                </p>
              </section>

              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4">
                  <p className="sk-label">{text.totalScans}</p>
                  <p className="mt-3 text-[32px] font-bold leading-none tracking-[-0.03em]">
                    {stats.totalScans}
                  </p>
                  <ScanTrend value={stats.scanTrendVsLast} range={range} text={text} />
                </Card>

                <Card className="p-4">
                  <p className="sk-label">{text.averageGrade}</p>
                  <p className="mt-3 text-[32px] font-bold leading-none tracking-[-0.03em] text-[var(--sk-brand-forest)]">
                    {stats.avgHealthGrade}
                  </p>
                  <GradeTrend
                    direction={stats.healthGradeTrend}
                    previous={stats.previousAvgHealthGrade}
                    range={range}
                    text={text}
                  />
                </Card>
              </div>

              <section className="rounded-[var(--sk-radius-lg)] border-[0.5px] border-[var(--sk-border-green)] bg-[var(--sk-surface-insight)] p-4">
                <p className="sk-label text-[var(--sk-brand-forest)]">
                  {range === "week" ? text.weeklyInsight : text.rangeInsight}
                </p>
                <p className="sk-verdict mt-3">{stats.weeklyInsight}</p>
              </section>

              <Card className="p-4">
                <p className="sk-label">{text.gradeBreakdown}</p>
                <div
                  className="mt-5 flex h-3 overflow-hidden rounded-full bg-[var(--sk-brand-mist-dark)]"
                  aria-label={text.gradeBreakdown}
                >
                  {grades.map((grade) => {
                    const count = stats.gradeBreakdown[grade];
                    if (count === 0) return null;
                    return (
                      <div
                        key={grade}
                        title={`${grade}: ${count}`}
                        style={{
                          width: `${(count / stats.totalScans) * 100}%`,
                          background: gradeSegmentColors[grade]
                        }}
                      />
                    );
                  })}
                </div>
                <div className="mt-4 grid grid-cols-5 gap-1">
                  {grades.map((grade) => {
                    const count = stats.gradeBreakdown[grade];
                    const percent = Math.round((count / stats.totalScans) * 100);
                    return (
                      <div key={grade} className="text-center">
                        <span
                          className={`mx-auto grid h-8 w-8 place-items-center rounded-full border text-[11px] font-bold ${gradeClasses[grade]}`}
                        >
                          {grade}
                        </span>
                        <p className="mt-1.5 text-[10px] font-semibold text-[var(--sk-text-secondary)]">
                          {percent}%
                        </p>
                        <p className="text-[9px] text-[var(--sk-text-muted)]">{count}</p>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {flaggedAdditives === 0 ? (
                <Card className="flex items-center gap-3 p-4">
                  <CheckCircle2
                    className="h-6 w-6 shrink-0 text-[var(--sk-status-positive)]"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-[13px] font-bold">{text.noFlagged}</p>
                    <p className="mt-1 text-[11px] text-[var(--sk-text-muted)]">
                      {text.across} {stats.totalScans} {text.selectedScans}
                    </p>
                  </div>
                </Card>
              ) : (
                <Card className="p-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="sk-label">{text.additives}</p>
                      <p className="mt-3 text-[32px] font-bold leading-none tracking-[-0.03em]">
                        {stats.additivesTotal}
                      </p>
                    </div>
                    <p className="pb-1 text-[11px] text-[var(--sk-text-muted)]">
                      {text.across} {stats.totalScans} {text.selectedScans}
                    </p>
                  </div>

                  <div className="mt-5 space-y-4">
                    {[
                      {
                        label: text.toAvoid,
                        value: stats.additivesToAvoid,
                        width: avoidWidth,
                        color: "var(--sk-grade-e-text)"
                      },
                      {
                        label: text.moderate,
                        value: stats.additivesModerate,
                        width: moderateWidth,
                        color: "var(--sk-grade-d-text)"
                      }
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span style={{ color: item.color }}>{item.label}</span>
                          <span>{item.value}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--sk-brand-mist-dark)]">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${item.width}%`, background: item.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="p-4">
                <p className="sk-label">
                  {hasRepeatedProduct ? text.mostScanned : text.recentlyScanned}
                </p>
                <div className="mt-3 divide-y divide-[var(--sk-border-muted)]">
                  {stats.mostScanned.map((product, index) => {
                    const grade = product.healthGrade.charAt(0) as GradeLetter;
                    return (
                      <div
                        key={`${product.name}-${index}`}
                        className="flex min-h-[4.4rem] items-center gap-3 py-3"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--sk-brand-mist)] text-xs font-bold text-[var(--sk-text-secondary)]">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-bold">{product.name}</p>
                          <p className="mt-1 text-[11px] text-[var(--sk-text-muted)]">
                            {product.count} {product.count === 1 ? text.scan : text.scans}
                          </p>
                        </div>
                        <span className={`sk-pill border ${gradeClasses[grade] ?? "sk-grade-c"}`}>
                          {product.healthGrade}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
