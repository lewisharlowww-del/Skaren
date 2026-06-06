"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Minus,
  ScanBarcode
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useStats, type StatsRange } from "@/hooks/useStats";
import type { GradeLetter } from "@/lib/types";

const rangeLabels: Record<StatsRange, string> = {
  week: "This week",
  month: "This month",
  all: "All time"
};

const gradeClasses: Record<GradeLetter, string> = {
  A: "sk-grade-a",
  B: "sk-grade-b",
  C: "sk-grade-c",
  D: "sk-grade-d",
  E: "sk-grade-e"
};

function Trend({ value }: { value: number }) {
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
      {value === 0 ? "No prior change" : `${value > 0 ? "+" : ""}${value}% vs last`}
    </span>
  );
}

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

function StatsSkeleton() {
  return (
    <div className="mt-6 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="h-32 animate-pulse rounded-[var(--sk-radius-lg)] bg-white/70" />
        <div className="h-32 animate-pulse rounded-[var(--sk-radius-lg)] bg-white/70" />
      </div>
      <div className="h-64 animate-pulse rounded-[var(--sk-radius-lg)] bg-white/70" />
      <div className="h-44 animate-pulse rounded-[var(--sk-radius-lg)] bg-white/70" />
      <div className="h-32 animate-pulse rounded-[var(--sk-radius-lg)] bg-white/70" />
      <div className="h-56 animate-pulse rounded-[var(--sk-radius-lg)] bg-white/70" />
    </div>
  );
}

export default function StatsPage() {
  const [range, setRange] = useState<StatsRange>("week");
  const stats = useStats(range);
  const maxGradeCount = Math.max(...Object.values(stats.gradeBreakdown), 1);
  const avoidWidth = stats.additivesTotal
    ? (stats.additivesToAvoid / stats.additivesTotal) * 100
    : 0;
  const moderateWidth = stats.additivesTotal
    ? (stats.additivesModerate / stats.additivesTotal) * 100
    : 0;

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-[var(--sk-brand-mist)] pb-36 text-[var(--sk-text-primary)]">
        <div className="mx-auto w-full max-w-xl px-4 pb-8 pt-6">
          <header>
            <p className="sk-label">Your stats</p>
            <div className="mt-1 flex items-end justify-between gap-4">
              <h1 className="type-heading-1">{rangeLabels[range]}</h1>
              <BarChart3
                className="mb-1 h-5 w-5 text-[var(--sk-brand-forest)]"
                aria-hidden="true"
              />
            </div>

            <div className="mt-5 grid grid-cols-3 rounded-[var(--sk-radius-pill)] border-[0.5px] border-[var(--sk-border-default)] bg-[var(--sk-brand-mist-dark)] p-1">
              {(["week", "month", "all"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRange(option)}
                  className={`focus-ring min-h-10 rounded-[var(--sk-radius-pill)] text-xs font-semibold transition ${
                    range === option
                      ? "bg-[var(--sk-surface-white)] text-[var(--sk-brand-forest)] shadow-sm"
                      : "text-[var(--sk-text-secondary)]"
                  }`}
                >
                  {option === "week" ? "Week" : option === "month" ? "Month" : "All"}
                </button>
              ))}
            </div>
          </header>

          {stats.loading ? (
            <StatsSkeleton />
          ) : stats.totalScans === 0 ? (
            <Card className="mt-8 px-6 py-12 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--sk-grade-a-bg)] text-[var(--sk-brand-forest)]">
                <ScanBarcode className="h-7 w-7" />
              </div>
              <h2 className="type-heading-3 mt-5">
                No scans yet {range === "week" ? "this week" : range === "month" ? "this month" : ""}
              </h2>
              <p className="type-body-sm mx-auto mt-2 max-w-xs text-[var(--sk-text-secondary)]">
                Scan your first product to see your stats.
              </p>
              <Link
                href="/scan"
                className="focus-ring type-button mt-6 inline-flex min-h-12 items-center justify-center rounded-[var(--sk-radius-lg)] bg-[var(--sk-brand-forest)] px-6 text-[var(--sk-text-on-dark)]"
              >
                Scan now
              </Link>
            </Card>
          ) : (
            <div className="mt-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4">
                  <p className="sk-label">Total scans</p>
                  <p className="mt-3 text-[32px] font-bold leading-none tracking-[-0.03em]">
                    {stats.totalScans}
                  </p>
                  <Trend value={stats.trendVsLast} />
                </Card>

                <Card className="p-4">
                  <p className="sk-label">Avg health grade</p>
                  <p className="mt-3 text-[32px] font-bold leading-none tracking-[-0.03em] text-[var(--sk-brand-forest)]">
                    {stats.avgHealthGrade}
                  </p>
                  <Trend value={stats.trendVsLast} />
                </Card>
              </div>

              <Card className="p-4">
                <p className="sk-label">Grade breakdown</p>
                <div className="mt-5 space-y-3">
                  {(Object.keys(stats.gradeBreakdown) as GradeLetter[]).map(
                    (grade) => {
                      const count = stats.gradeBreakdown[grade];
                      const width = (count / maxGradeCount) * 100;

                      return (
                        <div key={grade} className="grid grid-cols-[1.75rem_1fr_1.5rem] items-center gap-3">
                          <span
                            className={`grid h-7 w-7 place-items-center rounded-full border text-[11px] font-bold ${gradeClasses[grade]}`}
                          >
                            {grade}
                          </span>
                          <div className="h-2 overflow-hidden rounded-full bg-[var(--sk-brand-mist-dark)]">
                            <div
                              className={`h-full min-w-[3px] rounded-full ${gradeClasses[grade]}`}
                              style={{ width: `${width}%` }}
                            />
                          </div>
                          <span className="text-right text-xs font-semibold text-[var(--sk-text-secondary)]">
                            {count}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="sk-label">Additives</p>
                    <p className="mt-3 text-[32px] font-bold leading-none tracking-[-0.03em]">
                      {stats.additivesTotal}
                    </p>
                  </div>
                  <p className="pb-1 text-[11px] text-[var(--sk-text-muted)]">
                    Across selected scans
                  </p>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-[var(--sk-grade-e-text)]">To avoid</span>
                      <span>{stats.additivesToAvoid}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--sk-brand-mist-dark)]">
                      <div
                        className="h-full rounded-full bg-[var(--sk-grade-e-text)]"
                        style={{ width: `${avoidWidth}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-[var(--sk-grade-d-text)]">Moderate</span>
                      <span>{stats.additivesModerate}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--sk-brand-mist-dark)]">
                      <div
                        className="h-full rounded-full bg-[var(--sk-grade-d-text)]"
                        style={{ width: `${moderateWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <section className="rounded-[var(--sk-radius-lg)] border-[0.5px] border-[var(--sk-border-green)] bg-[var(--sk-surface-insight)] p-4">
                <p className="sk-label text-[var(--sk-brand-forest)]">
                  {range === "week" ? "Weekly insight" : "Range insight"}
                </p>
                <p className="sk-verdict mt-3">{stats.weeklyInsight}</p>
              </section>

              <Card className="p-4">
                <p className="sk-label">Most scanned</p>
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
                          <p className="truncate text-[13px] font-bold">
                            {product.name}
                          </p>
                          <p className="mt-1 text-[11px] text-[var(--sk-text-muted)]">
                            {product.count} {product.count === 1 ? "scan" : "scans"}
                          </p>
                        </div>
                        <span
                          className={`sk-pill border ${gradeClasses[grade] ?? "sk-grade-c"}`}
                        >
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
