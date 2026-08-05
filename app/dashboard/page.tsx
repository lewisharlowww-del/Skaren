"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Award, BarChart3, CalendarDays, Flame, Leaf, ScanBarcode, ShieldCheck, Trophy } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BadgeCard } from "@/components/BadgeCard";
import { EmptyState } from "@/components/EmptyState";
import { OnboardingSlides } from "@/components/OnboardingSlides";
import { StatCard } from "@/components/StatCard";
import { useScans } from "@/hooks/useScans";
import { useStreak } from "@/hooks/useStreak";
import { useUser } from "@/hooks/useUser";
import { getEcoGrade, gradeLetterToScore, hasEcoData } from "@/lib/ecoscore";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { GradeLetter, ProductResult, ScanRecord } from "@/lib/types";
import { useLang } from "@/lib/language-context";
import type { Language } from "@/lib/i18n";

const badges = [
  { nameEn: "First Scan", nameNo: "Første skanning", test: (scans: ScanRecord[]) => scans.length >= 1 },
  { nameEn: "5 Products Scanned", nameNo: "5 produkter skannet", test: (scans: ScanRecord[]) => scans.length >= 5 },
  { nameEn: "Smart Shopper", nameNo: "Smart handler", test: (scans: ScanRecord[]) => scans.some((scan) => scan.ecoscan_score >= 75) },
  { nameEn: "Careful Checker", nameNo: "Nøye sjekker", test: (scans: ScanRecord[]) => scans.some((scan) => scan.ecoscan_score < 55) }
];

// Every user-facing string on this screen, in both languages. The gradeTone /
// gradeDetail helpers below take `lang` so even the health-grade blurb follows
// the app language.
const copy = {
  en: {
    overview: "Your Skaren overview",
    title: "Stats",
    subtitle: "See your scan rhythm, saved product history, and the grades you are choosing most often.",
    newScan: "New scan",
    monthlyGrade: "Monthly Health Grade",
    scans: "Scans",
    bestGrade: "Best grade",
    badges: "Badges",
    productsScanned: "Products scanned",
    productsScannedDetail: "All-time saved product reports",
    currentStreak: "Current streak",
    day: "day",
    days: "days",
    streakOn: "Nice rhythm. Keep scanning.",
    streakOff: "Scan today to start a streak.",
    bestHealthGrade: "Best Health Grade",
    lowestHealthGrade: "Lowest Health Grade",
    grade: "Grade",
    noBest: "No best product yet",
    noWorst: "No lower-grade product yet",
    milestones: "Milestones",
    earned: "Earned",
    locked: "Locked",
    latestProducts: "Latest products",
    recentScans: "Recent scans",
    noDate: "No date",
    monthPrompt: "Scan this month to build your Health Grade trend.",
    basedOn: (n: number) => `Based on ${n} saved product${n === 1 ? "" : "s"} this month.`,
    gradeLabel: { A: "Health Grade A", B: "Health Grade B", C: "Health Grade C", D: "Health Grade D", E: "Health Grade E" },
    gradeDetail: {
      A: "Excellent monthly health profile.",
      B: "Good monthly health profile.",
      C: "Average monthly health profile.",
      D: "Lower monthly health profile.",
      E: "Very low monthly health profile.",
    },
  },
  no: {
    overview: "Din Skaren-oversikt",
    title: "Statistikk",
    subtitle: "Se skannerytmen din, lagret produkthistorikk og karakterene du velger oftest.",
    newScan: "Ny skanning",
    monthlyGrade: "Månedlig helsekarakter",
    scans: "Skanninger",
    bestGrade: "Beste karakter",
    badges: "Merker",
    productsScanned: "Produkter skannet",
    productsScannedDetail: "Alle lagrede produktrapporter",
    currentStreak: "Nåværende rekke",
    day: "dag",
    days: "dager",
    streakOn: "Fin rytme. Fortsett å skanne.",
    streakOff: "Skann i dag for å starte en rekke.",
    bestHealthGrade: "Beste helsekarakter",
    lowestHealthGrade: "Laveste helsekarakter",
    grade: "Karakter",
    noBest: "Ingen beste produkt ennå",
    noWorst: "Ingen produkt med lavere karakter ennå",
    milestones: "Milepæler",
    earned: "Oppnådd",
    locked: "Låst",
    latestProducts: "Siste produkter",
    recentScans: "Nylige skanninger",
    noDate: "Ingen dato",
    monthPrompt: "Skann denne måneden for å bygge helsekarakter-trenden din.",
    basedOn: (n: number) => `Basert på ${n} lagret${n === 1 ? "" : "e"} produkt${n === 1 ? "" : "er"} denne måneden.`,
    gradeLabel: { A: "Helsekarakter A", B: "Helsekarakter B", C: "Helsekarakter C", D: "Helsekarakter D", E: "Helsekarakter E" },
    gradeDetail: {
      A: "Utmerket månedlig helseprofil.",
      B: "God månedlig helseprofil.",
      C: "Gjennomsnittlig månedlig helseprofil.",
      D: "Lavere månedlig helseprofil.",
      E: "Svært lav månedlig helseprofil.",
    },
  },
} as const;

function scoreToGrade(score: number) {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  if (score >= 20) return "D";
  return "E";
}

function getScanKey(scan: ScanRecord) {
  return scan.id ?? `${scan.barcode}-${scan.created_at ?? ""}`;
}

function getScanGrade(scan: ScanRecord, overrides: Record<string, GradeLetter>) {
  return overrides[getScanKey(scan)] ?? scan.health_grade ?? scan.environmental_grade ?? scoreToGrade(scan.ecoscan_score);
}

function getScanGradeScore(scan: ScanRecord, overrides: Record<string, GradeLetter>) {
  return gradeLetterToScore(getScanGrade(scan, overrides));
}

function gradeTone(score: number) {
  if (score >= 80) return { text: "text-forest", ring: "var(--sk-brand-forest)", bg: "from-emerald-50 to-white", grade: "A" as const };
  if (score >= 60) return { text: "text-leaf-700", ring: "var(--sk-brand-leaf)", bg: "from-leaf-50 to-white", grade: "B" as const };
  if (score >= 40) return { text: "text-amber-700", ring: "var(--sk-grade-d-text)", bg: "from-amber-50 to-white", grade: "C" as const };
  if (score >= 20) return { text: "text-orange-700", ring: "var(--sk-grade-d-text)", bg: "from-orange-50 to-white", grade: "D" as const };
  return { text: "text-rose-700", ring: "var(--sk-grade-e-text)", bg: "from-rose-50 to-white", grade: "E" as const };
}

function formatDate(value: string | undefined, lang: Language, fallback: string) {
  if (!value) return fallback;
  return new Intl.DateTimeFormat(lang === "no" ? "nb-NO" : "en", { month: "short", day: "numeric" }).format(new Date(value));
}

export default function DashboardPage() {
  const router = useRouter();
  const { lang } = useLang();
  const text = copy[lang];
  const { user, loading: userLoading, isConfigured } = useUser();
  const { scans, loading: scansLoading } = useScans(user);
  const streak = useStreak(scans);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [gradeOverrides, setGradeOverrides] = useState<Record<string, GradeLetter>>({});
  const refreshedScansRef = useRef(new Set<string>());

  useEffect(() => {
    if (!userLoading && (!isConfigured || !user)) {
      router.push("/login?next=%2Fdashboard");
    }

    if (user && user.user_metadata?.onboarding_completed !== true) {
      setShowOnboarding(true);
    }
  }, [isConfigured, router, user, userLoading]);

  useEffect(() => {
    if (scansLoading || scans.length === 0) return;

    let cancelled = false;

    async function refreshLegacyGrades() {
      const legacyScans = scans
        .filter((scan) => !scan.health_grade && !refreshedScansRef.current.has(getScanKey(scan)))
        .slice(0, 8);

      for (const scan of legacyScans) {
        const scanKey = getScanKey(scan);
        refreshedScansRef.current.add(scanKey);

        try {
          const cachedProduct = typeof window !== "undefined" ? window.sessionStorage.getItem(`skaren:${scan.barcode}`) : null;
          let product = cachedProduct ? (JSON.parse(cachedProduct) as ProductResult) : null;

          if (!product) {
            const response = await fetch("/api/scan", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ barcode: scan.barcode })
            });
            const data = (await response.json()) as { product?: ProductResult };
            product = data.product ?? null;
          }

          if (!product || cancelled) continue;

          const environmentalGrade = hasEcoData(product) ? product.ecoGradeLetter ?? getEcoGrade(product) : null;
          const healthGrade = product.healthGrade;

          if (!healthGrade || cancelled) continue;

          setGradeOverrides((current) => ({ ...current, [scanKey]: healthGrade }));

          if (isSupabaseConfigured && supabase && scan.id) {
            await supabase
              .from("scans")
              .update({
                skaren_grade: null,
                health_grade: healthGrade,
                environmental_grade: environmentalGrade,
                ecoscan_score: gradeLetterToScore(healthGrade)
              })
              .eq("id", scan.id);
          }
        } catch (error) {
          console.warn("[Dashboard] Could not refresh saved health grade:", error);
        }
      }
    }

    void refreshLegacyGrades();

    return () => {
      cancelled = true;
    };
  }, [scans, scansLoading]);

  const monthlyScans = useMemo(() => {
    const now = new Date();
    return scans.filter((scan) => {
      const date = new Date(scan.created_at ?? "");
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
  }, [scans]);

  const monthlyAverage = monthlyScans.length
    ? Math.round(monthlyScans.reduce((total, scan) => total + getScanGradeScore(scan, gradeOverrides), 0) / monthlyScans.length)
    : 0;
  const best = scans.length ? [...scans].sort((a, b) => getScanGradeScore(b, gradeOverrides) - getScanGradeScore(a, gradeOverrides))[0] : null;
  const worst = scans.length ? [...scans].sort((a, b) => getScanGradeScore(a, gradeOverrides) - getScanGradeScore(b, gradeOverrides))[0] : null;
  const loading = userLoading || scansLoading;
  const monthGrade = monthlyScans.length ? scoreToGrade(monthlyAverage) : "–";
  const tone = gradeTone(monthlyAverage);
  const monthProgress = Math.min(100, monthlyAverage);
  const earnedBadges = badges.filter((badge) => badge.test(scans)).length;

  return (
    <>
      <AppHeader />
      <OnboardingSlides open={showOnboarding} onComplete={() => setShowOnboarding(false)} />
      <main className="page-fade-up mx-auto w-full max-w-[430px] overflow-x-hidden px-4 pb-44 pt-4 sm:max-w-6xl sm:py-8">
        <div className="flex w-full min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <p className="type-section-label text-forest">{text.overview}</p>
            <h1 className="type-display-lg mt-1 text-ink sm:mt-2">{text.title}</h1>
            <p className="type-body-lg mt-2 max-w-xl text-soil-600">
              {text.subtitle}
            </p>
          </div>
          <button
            onClick={() => router.push("/scan")}
            className="focus-ring tap-feedback type-button inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-white shadow-soft"
          >
            <ScanBarcode className="h-5 w-5" />
            {text.newScan}
          </button>
        </div>

        {loading ? (
          <div className="mt-5 grid w-full gap-4 sm:mt-8">
            <div className="skeleton-shimmer h-64 rounded-[2rem] bg-white/70" />
            <div className="skeleton-shimmer h-40 rounded-[2rem] bg-white/70" />
          </div>
        ) : scans.length === 0 ? (
          <div className="mt-5 sm:mt-8">
            <EmptyState />
          </div>
        ) : (
          <>
            <section className="mt-5 grid w-full min-w-0 gap-4 sm:mt-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div className={`relative min-w-0 overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br ${tone.bg} p-5 shadow-glass backdrop-blur-xl sm:rounded-[2.25rem] sm:p-8`}>
                <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/65 blur-3xl" />
                <div className="absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-leaf-100/70 blur-3xl" />
                <div className="relative z-10 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
                  <div className="grid place-items-center">
                    <div
                      className="grid h-36 w-36 place-items-center rounded-full bg-white shadow-soft"
                      style={{
                        background: `conic-gradient(${tone.ring} ${monthProgress * 3.6}deg, var(--sk-brand-mist-dark) 0deg)`
                      }}
                    >
                      <div className="grid h-28 w-28 place-items-center rounded-full bg-white">
                        <span className={`type-grade text-6xl ${tone.text}`}>{monthGrade}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="type-section-label inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-forest shadow-sm">
                      <CalendarDays className="h-4 w-4" />
                      {text.monthlyGrade}
                    </div>
                    <h2 className="type-heading-1 mt-4 text-ink">{text.gradeLabel[tone.grade]}</h2>
                    <p className="type-body-lg mt-3 text-soil-600">
                      {monthlyScans.length
                        ? `${text.gradeDetail[tone.grade]} ${text.basedOn(monthlyScans.length)}`
                        : text.monthPrompt}
                    </p>
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <div className="rounded-2xl bg-white/75 p-3 shadow-sm">
                        <p className="type-section-label text-soil-500">{text.scans}</p>
                        <p className="type-heading-2 mt-1 text-ink">{monthlyScans.length}</p>
                      </div>
                      <div className="rounded-2xl bg-white/75 p-3 shadow-sm">
                        <p className="type-section-label text-soil-500">{text.bestGrade}</p>
                        <p className="type-heading-2 mt-1 text-ink">{best ? getScanGrade(best, gradeOverrides) : "–"}</p>
                      </div>
                      <div className="rounded-2xl bg-white/75 p-3 shadow-sm">
                        <p className="type-section-label text-soil-500">{text.badges}</p>
                        <p className="type-heading-2 mt-1 text-ink">{earnedBadges}/{badges.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid w-full min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <StatCard label={text.productsScanned} value={String(scans.length)} icon={ScanBarcode} detail={text.productsScannedDetail} tone="dark" />
                <StatCard label={text.currentStreak} value={`${streak || 0} ${streak === 1 ? text.day : text.days}`} icon={Flame} detail={streak ? text.streakOn : text.streakOff} tone={streak ? "green" : "neutral"} />
              </div>
            </section>

            <section className="mt-4 grid w-full min-w-0 gap-4 sm:grid-cols-2">
              <StatCard label={text.bestHealthGrade} value={best ? `${text.grade} ${getScanGrade(best, gradeOverrides)}` : "–"} icon={Trophy} detail={best?.product_name ?? text.noBest} tone="green" />
              <StatCard label={text.lowestHealthGrade} value={worst ? `${text.grade} ${getScanGrade(worst, gradeOverrides)}` : "–"} icon={Leaf} detail={worst?.product_name ?? text.noWorst} tone={worst && getScanGradeScore(worst, gradeOverrides) < 40 ? "red" : "amber"} />
            </section>

            <section className="mt-4 grid w-full min-w-0 gap-4 sm:mt-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="min-w-0 overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-glass backdrop-blur-xl">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="type-section-label text-forest">{text.milestones}</p>
                    <h2 className="type-heading-2 mt-1 text-ink">{text.badges}</h2>
                  </div>
                  <span className="type-body-sm rounded-full bg-leaf-50 px-3 py-1 font-bold text-forest">{earnedBadges}/{badges.length}</span>
                </div>
                <div className="mt-4 grid min-w-0 gap-3">
                  {badges.map((badge) => {
                    const earned = badge.test(scans);
                    return (
                      <BadgeCard
                        key={badge.nameEn}
                        name={lang === "no" ? badge.nameNo : badge.nameEn}
                        earned={earned}
                        earnedLabel={text.earned}
                        lockedLabel={text.locked}
                        icon={Award}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="min-w-0 overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-glass backdrop-blur-xl">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="type-section-label text-forest">{text.latestProducts}</p>
                    <h2 className="type-heading-2 mt-1 text-ink">{text.recentScans}</h2>
                  </div>
                  <BarChart3 className="h-5 w-5 text-forest" />
                </div>
                <div className="mt-4 space-y-3">
                  {scans.slice(0, 6).map((scan) => {
                    const grade = getScanGrade(scan, gradeOverrides);
                    const score = gradeLetterToScore(grade);
                    const recentTone = gradeTone(score);

                    return (
                      <div key={`${scan.barcode}-${scan.created_at}`} className="flex min-w-0 items-center gap-3 rounded-[1.35rem] border border-black/5 bg-white p-3 shadow-sm">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-leaf-50">
                          {scan.product_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={scan.product_image} alt={`${scan.product_name} packaging`} className="h-full w-full object-contain p-1" loading="lazy" />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="type-heading-3 truncate text-soil-900">{scan.product_name}</p>
                          <p className="type-body-sm truncate text-soil-600">{scan.brand || scan.barcode}</p>
                          <p className="type-caption mt-1 text-soil-500">{formatDate(scan.created_at, lang, text.noDate)}</p>
                        </div>
                        <span className={`type-grade grid h-11 w-11 shrink-0 place-items-center rounded-full border-[4px] text-lg ${recentTone.text}`} style={{ borderColor: recentTone.ring }}>
                          {grade}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
