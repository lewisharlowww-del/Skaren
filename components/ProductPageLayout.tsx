"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronRight, Crown, Info, ListPlus } from "lucide-react";
import { NutritionTable } from "@/components/NutritionTable";
import { Additives, additivesHeaderHint } from "@/components/Additives";
import { Merk, type MerkExpression } from "@/components/Merk";
import { ScoreCard, bandColour } from "@/components/ScoreCard";
import { ScoreMethodSheet, type Deduction, type SkarenExplain } from "@/components/ScoreMethodSheet";
import { ProcessingLevel, AllergenCard } from "@/components/ProcessingLevel";
import { Alternatives, MerkBuyNote } from "@/components/Alternatives";
import { getGradeLabel } from "@/components/ScoreBadge";
import { useShoppingList } from "@/hooks/useShoppingList";
import { hasEcoData } from "@/lib/ecoscore";
import {
  explainHealthScore,
  nutritionDataFromKassalapp,
  HEALTH_SCORE_BASELINE,
  type ScoreFactor
} from "@/lib/healthscore";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/language-context";
import type { ProductInsight, ProductResult, GradeLetter } from "@/lib/types";

// ── Additive extraction from ingredients text ─────────────────────────────────
function extractAdditivesFromIngredients(ingredients: string): string[] {
  if (!ingredients) return [];
  // Match patterns like e300, e-300, E300, (e300), e300,
  const matches = ingredients.match(/\b[eE]-?\d{3,4}[a-zA-Z]?\b/g);
  if (!matches) return [];
  // Deduplicate and normalise to lowercase-e form for lookupENumber
  return Array.from(new Set(matches.map((m) => m.replace(/[^eE\d]/g, "").toLowerCase())));
}

// ── Design tokens ──────────────────────────────────────────────────────────────
const PAGE_BG     = "var(--sk-brand-mist)";
const CARD_BG     = "var(--sk-surface-white)";
const CARD_BORDER = "var(--sk-border-default)";
const MUTED       = "var(--sk-text-muted)";

type Props = {
  product: ProductResult;
  getKeyInsights: (p: ProductResult) => ProductInsight[];
  getNutritionRows: (p: ProductResult) => { label: string; displayAmount: string; tone: string }[];
  visibleIngredients: (p: ProductResult) => string | null;
  hasNutritionSignal: (p: ProductResult) => boolean;
  getEcoGrade: (p: ProductResult) => GradeLetter | null;
  isPremium?: boolean;
};

const GRADE_COLORS: Record<string, string> = {
  A: "var(--sk-grade-a-text)",
  B: "var(--sk-grade-b-text)",
  C: "var(--sk-grade-c-text)",
  D: "var(--sk-grade-d-text)",
  E: "var(--sk-grade-e-text)",
};

const GRADE_BACKGROUNDS: Record<string, string> = {
  A: "var(--sk-grade-a-bg)",
  B: "var(--sk-grade-b-bg)",
  C: "var(--sk-grade-c-bg)",
  D: "var(--sk-grade-d-bg)",
  E: "var(--sk-grade-e-bg)",
};

const GRADE_BORDERS: Record<string, string> = {
  A: "var(--sk-grade-a-border)",
  B: "var(--sk-grade-b-border)",
  C: "var(--sk-grade-c-border)",
  D: "var(--sk-grade-d-border)",
  E: "var(--sk-grade-e-border)",
};

// NOVA labels are built inside the component from translations (see novaLabels array in component body)
const NOVA_TONES: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: "var(--sk-grade-a-bg)", text: "var(--sk-grade-a-text)", border: "var(--sk-grade-a-border)" },
  2: { bg: "var(--sk-grade-b-bg)", text: "var(--sk-grade-b-text)", border: "var(--sk-grade-b-border)" },
  3: { bg: "var(--sk-grade-c-bg)", text: "var(--sk-grade-c-text)", border: "var(--sk-grade-c-border)" },
  4: { bg: "var(--sk-grade-e-bg)", text: "var(--sk-grade-e-text)", border: "var(--sk-grade-e-border)" },
};
// novaSegmentLabels populated at render time from translations

// ── Helpers ────────────────────────────────────────────────────────────────────
function getColor(g: GradeLetter | null) {
  return g ? GRADE_COLORS[g] ?? MUTED : MUTED;
}
function getGradeBackground(g: GradeLetter | null) {
  return g ? GRADE_BACKGROUNDS[g] ?? CARD_BG : CARD_BG;
}
function getGradeBorder(g: GradeLetter | null) {
  return g ? GRADE_BORDERS[g] ?? CARD_BORDER : CARD_BORDER;
}

function getHealthGradeBasis(product: ProductResult, hasNutrition: boolean, lang: "en" | "no" = "en") {
  const no = lang === "no";
  if (!hasNutrition) return no ? "Trenger næringsdata for å gi karakter." : "Needs nutrition data to grade.";
  if (product.hasNokkelhull) return no ? "Bruker næringsdata + Nøkkelhull-merket." : "Uses nutrition data + Norwegian Nøkkelhull label.";
  if (product.kassalappNutrition.length > 0) return no ? "Bruker kalorier, sukker, salt, fett, protein og fiber." : "Uses calories, sugar, salt, fat, protein & fiber.";
  return no ? "Basert på offisiell Nutri-Score." : "Based on the official Nutri-Score.";
}

function getEcoGradeBasis(hasEco: boolean, lang: "en" | "no" = "en") {
  const no = lang === "no";
  return hasEco
    ? (no ? "Basert på offisiell Open Food Facts Eco-Score." : "Based on the official Open Food Facts Eco-Score.")
    : (no ? "Ingen offisiell Eco-Score tilgjengelig ennå." : "No official Eco-Score available yet.");
}

function getGradeSummary(
  grade: GradeLetter | null,
  kind: "health" | "eco",
  lang: "en" | "no"
) {
  if (!grade) {
    return lang === "no" ? "Ingen score ennå" : "No score yet";
  }

  const health = {
    A: ["Strong nutrition", "Sterk ernæring"],
    B: ["Good nutrition", "God ernæring"],
    C: ["Average nutrition", "Middels ernæring"],
    D: ["Weaker nutrition", "Svakere ernæring"],
    E: ["Poor nutrition", "Svak ernæring"],
  } as const;
  const eco = {
    A: ["Strong environmental score", "Sterk miljøscore"],
    B: ["Good environmental score", "God miljøscore"],
    C: ["Average environmental score", "Middels miljøscore"],
    D: ["Weaker environmental score", "Svakere miljøscore"],
    E: ["Poor environmental score", "Svak miljøscore"],
  } as const;

  return (kind === "health" ? health : eco)[grade][lang === "no" ? 1 : 0];
}

// Merk's one-line verdict — a single voice, category-aware where we can be.
// Expression + words move together (see the mascot bible): confident/happy for
// strong products, thinking for the middle, concern for weak ones. Never angry.
function getMerkVerdict(
  grade: GradeLetter | null,
  lang: "en" | "no"
): { expression: MerkExpression; headline: string; eyebrow: string | null; text: string } {
  const no = lang === "no";
  if (!grade) {
    return {
      expression: "unsure",
      headline: no ? "Vet ikke helt." : "Not sure yet.",
      eyebrow: null,
      text: no
        ? "Jeg mangler nok data til å gi en score her ennå."
        : "I don't have enough data to score this one yet.",
    };
  }
  const map: Record<GradeLetter, { expression: MerkExpression; headEn: string; headNo: string; ebEn: string; ebNo: string; en: string; no: string }> = {
    A: { expression: "confident", headEn: "Clean pick.", headNo: "Rent produkt.", ebEn: "Among the best on this shelf.", ebNo: "Blant de beste i hylla.", en: "One of the better choices on its shelf.", no: "Et av de bedre valgene i hylla." },
    B: { expression: "confident", headEn: "Solid choice.", headNo: "Godt valg.", ebEn: "Better than most on this shelf.", ebNo: "Bedre enn de fleste i hylla.", en: "A solid pick — little here worth worrying about.", no: "Et solid valg — lite her å bekymre seg for." },
    C: { expression: "thinking", headEn: "Middle of the shelf.", headNo: "Midt på hylla.", ebEn: "About average for its shelf.", ebNo: "Omtrent midt på hylla.", en: "Fine now and then, nothing to flag.", no: "Grei av og til, ingenting å flagge." },
    D: { expression: "curious", headEn: "Worth a look.", headNo: "Verdt en titt.", ebEn: "Below the shelf median.", ebNo: "Under medianen i hylla.", en: "Worth a closer look before it becomes a habit.", no: "Verdt en nærmere titt før det blir en vane." },
    E: { expression: "concern", headEn: "Lots of salt here.", headNo: "Mye salt her.", ebEn: "Near the bottom of this shelf.", ebNo: "Nær bunnen av hylla.", en: "There are better options next to this one.", no: "Det finnes bedre alternativer ved siden av." },
  };
  const m = map[grade];
  return { expression: m.expression, headline: no ? m.headNo : m.headEn, eyebrow: no ? m.ebNo : m.ebEn, text: no ? m.no : m.en };
}

function getShoppingCategory(product: ProductResult) {
  const text = `${product.categories} ${product.kassalappCategories.join(" ")}`.toLowerCase();
  if (/(milk|dairy|cheese|yogurt|melk|ost|yoghurt)/.test(text)) return "Dairy";
  if (/(meat|beef|pork|chicken|kjøtt|kylling|pølse)/.test(text)) return "Meat";
  if (/(fish|seafood|salmon|tuna|fisk|laks)/.test(text)) return "Fish";
  if (/(vegetable|produce|salad|grønnsak|frukt)/.test(text)) return "Vegetables";
  if (/(snack|chocolate|candy|chips|sjokolade|godteri)/.test(text)) return "Snacks";
  if (/(drink|beverage|juice|soda|water|drikke|brus|vann)/.test(text)) return "Drinks";
  return "Other";
}

function getAllergenEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (/gluten|wheat|hvete/.test(lower)) return "🌾️";
  if (/milk|dairy|melk|laktose/.test(lower)) return "🥛";
  if (/egg/.test(lower)) return "🥚";
  if (/nut|peanut|nøtter|mandel/.test(lower)) return "🥜";
  if (/fish|fisk/.test(lower)) return "🐟";
  if (/shellfish|skalldyr|reker/.test(lower)) return "🦐";
  if (/soy|soya/.test(lower)) return "🫘";
  if (/sesame|sesam/.test(lower)) return "🌿";
  if (/celery|selleri/.test(lower)) return "🌿";
  if (/mustard|sennep/.test(lower)) return "🟡";
  if (/sulphite|sulfit|svovel/.test(lower)) return "⚗️";
  return "⚠️";
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="type-section-label px-0.5 pb-1 pt-2.5" style={{ color: MUTED }}>
      {children}
    </p>
  );
}

function PremiumNudge({ label, lang = "en" }: { label: string; lang?: "en" | "no" }) {
  return (
    <Link
      href="/pricing"
      className="flex items-center gap-3 rounded-2xl border px-4 py-3.5"
      style={{ borderColor: "var(--sk-grade-c-border)", backgroundColor: "var(--sk-grade-c-bg)" }}
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--sk-grade-d-bg)" }}>
        <Crown className="h-4 w-4" style={{ color: "var(--sk-grade-d-text)" }} />
      </div>
      <div className="flex-1">
        <p className="type-body-sm font-bold" style={{ color: "var(--sk-grade-d-text)" }}>{t('pro_feature', lang)}</p>
        <p className="type-caption" style={{ color: MUTED }}>{label} · {t('upgrade_to_unlock', lang)}</p>
      </div>
      <ChevronRight className="h-4 w-4" style={{ color: "var(--sk-grade-c-text)" }} />
    </Link>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function ProductPageLayout({
  product,
  getKeyInsights,
  getNutritionRows,
  visibleIngredients,
  hasNutritionSignal,
  getEcoGrade,
  isPremium = false,
}: Props) {
  const router = useRouter();
  const { addItem } = useShoppingList();
  const { lang } = useLang();

  // Build translated label arrays inside render so they react to lang changes
  const novaLabels = [
    "",
    t('product_nova_unprocessed', lang),
    t('product_nova_processed_ingredients', lang),
    t('product_nova_processed', lang),
    t('product_nova_ultra', lang),
  ];
  const novaSegmentLabels = [
    t('product_nova_natural', lang),
    t('product_nova_culinary', lang),
    t('product_nova_processed', lang),
    t('product_nova_ultra', lang),
  ];

  const [gradeHelpOpen, setGradeHelpOpen] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);
  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  // The shelf median is a second network call, so it arrives after the score
  // and the slider simply does not render until it does.
  const [shelfMedian, setShelfMedian] = useState<number | null>(null);
  const [addedToList, setAddedToList] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const topBarRef = useRef<HTMLDivElement>(null);
  const compactHeaderRef = useRef<HTMLDivElement>(null);
  const scanResultRef = useRef<HTMLSpanElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroMediaRef = useRef<HTMLElement | null>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const gradeHelpRef = useRef<HTMLDivElement>(null);
  const gradeHelpButtonRef = useRef<HTMLButtonElement>(null);
  const alternativesRef = useRef<HTMLDivElement>(null);

  const hasOfficialEcoData = hasEcoData(product);
  const ecoGrade = hasOfficialEcoData ? product.ecoGradeLetter ?? getEcoGrade(product) : null;
  const healthGrade = hasNutritionSignal(product) ? product.healthGrade : null;
  // Merk speaks. Prefer his AI-authored verdict about THIS product (he actually
  // read its ingredients and numbers); fall back to the static grade map when
  // there's no AI verdict (free users, model offline, or a data-poor product).
  //
  // Voice precedence: the v1 four-slot copy (headline + verdict) is the richest
  // and most tightly validated, so prefer it; then the single-line AI verdict;
  // then the static grade map. The face comes from the AI verdict when present,
  // else a grade-derived default.
  const staticVerdict = getMerkVerdict(healthGrade, lang);
  const aiVerdict = product.merkVerdict ?? null;
  const merkCopy = product.merkCopy ?? null;
  const merkVerdict = merkCopy
    ? {
        expression: (aiVerdict?.expression ?? staticVerdict.expression) as MerkExpression,
        headline: merkCopy.headline,
        eyebrow: null as string | null,
        text: merkCopy.verdict,
      }
    : aiVerdict
    ? {
        expression: aiVerdict.expression as MerkExpression,
        headline: aiVerdict.headline,
        eyebrow: null as string | null,
        text: aiVerdict.text,
      }
    : staticVerdict;
  // Context line — the product's shelf. Prefer the first Kassalapp category,
  // fall back to the OFF category, then to a generic "shelf" word.
  const shelfContext = (() => {
    const raw = product.kassalappCategories?.[0]
      ?? (product.categories ? product.categories.split(",")[0]?.trim() : "");
    if (!raw) return null;
    const label = raw.length > 28 ? raw.slice(0, 28) : raw;
    return `${label} · ${lang === "no" ? "hylle" : "shelf"}`.toUpperCase();
  })();
  const nutritionRows = getNutritionRows(product);
  const ingredients = visibleIngredients(product);
  const ingredientCount = ingredients
    ? ingredients.split(/,(?![^(]*\))/).filter((part) => part.trim().length > 1).length
    : 0;

  // Build additive list: use product.additives if present, otherwise parse from ingredients text
  const rawAdditives = product.additives ?? [];
  const allAdditives: typeof rawAdditives | string[] =
    rawAdditives.length > 0
      ? rawAdditives
      : extractAdditivesFromIngredients(ingredients ?? "");

  // ── Score + provenance ────────────────────────────────────────────────────
  // Prefer the Skaren Score (category-relative — "a good one of these?"). It is
  // computed server-side against the shipped category stats. Fall back to the
  // old health score, then to the grade-band midpoint when neither is present.
  const GRADE_MIDPOINT: Record<GradeLetter, number> = { A: 90, B: 70, C: 50, D: 30, E: 12 };
  const hasSkaren = typeof product.skarenScore === "number";
  const score = hasSkaren
    ? (product.skarenScore as number)
    : product.healthScore ?? (healthGrade ? GRADE_MIDPOINT[healthGrade] : null);
  // The shelf median chip prefers the Skaren shelf median; the Alternatives
  // fetch can still supply one for products the category stats cannot place.
  const skarenShelfMedian = product.skarenShelfMedian ?? null;

  // Build the Skaren "how this scored" breakdown when the category-relative
  // score is present, so the sheet reflects the number actually shown.
  const NUTRIENT_LABEL: Record<"salt" | "satFat" | "sugar" | "protein" | "fibre", string> = {
    salt: t("factor_salt", lang),
    satFat: t("factor_saturated_fat", lang),
    sugar: t("factor_sugars", lang),
    protein: t("factor_protein", lang),
    fibre: t("factor_fiber", lang),
  };
  const NOVA_WORD = ["", t("product_nova_unprocessed", lang), t("product_nova_processed_ingredients", lang), t("product_nova_processed", lang), t("product_nova_ultra", lang)];
  const skarenExplain: SkarenExplain | null =
    hasSkaren && product.skarenBreakdown
      ? {
          bucketLabel: (product.skarenBucket ?? "").replace(/^cat:/, "").replace(/-/g, " "),
          sampleSize: product.skarenSampleSize ?? 0,
          shelfMedian: skarenShelfMedian,
          percentiles: (Object.keys(NUTRIENT_LABEL) as Array<keyof typeof NUTRIENT_LABEL>)
            .filter((k) => typeof product.skarenBreakdown?.percentiles[k] === "number")
            .map((k) => ({ label: NUTRIENT_LABEL[k], pct: product.skarenBreakdown!.percentiles[k] as number })),
          additivePenalty: product.skarenBreakdown.additivePenalty,
          processingPenalty: product.skarenBreakdown.processingPenalty,
          novaLabel: product.novaGroup ? NOVA_WORD[product.novaGroup] : "",
        }
      : null;

  const scoreFactors: ScoreFactor[] = explainHealthScore({
    nutrition: nutritionDataFromKassalapp(product.kassalappNutrition ?? []),
    labels: product.labels ?? [],
    category: product.categories,
    novaGroup: product.novaGroup,
    additives: rawAdditives
  });

  const FACTOR_LABEL: Record<ScoreFactor["key"], string> = {
    nokkelhull: t("factor_nokkelhull", lang),
    protein: t("factor_protein", lang),
    fiber: t("factor_fiber", lang),
    sugars: t("factor_sugars", lang),
    salt: t("factor_salt", lang),
    saturatedFat: t("factor_saturated_fat", lang),
    fat: t("factor_fat", lang),
    calories: t("factor_calories", lang),
    nova: t("factor_processing", lang),
    additives: t("factor_additives", lang)
  };

  const deductions: Deduction[] = scoreFactors.map((factor) => ({
    factor: FACTOR_LABEL[factor.key],
    reason: factor.detail ?? "",
    value: factor.value
  }));
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    let frame = 0;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const scrollTop = element.scrollTop;
        const heroProgress = Math.min(scrollTop / 180, 1);
        const headerProgress = Math.min(
          Math.max((scrollTop - 55) / 85, 0),
          1
        );

        if (!prefersReducedMotion) {
          if (heroRef.current) {
            heroRef.current.style.opacity = String(1 - heroProgress * 0.5);
            heroRef.current.style.transform = `translateY(${-heroProgress * 8}px)`;
          }
          if (heroContentRef.current) {
            heroContentRef.current.style.opacity = String(1 - heroProgress * 0.7);
          }
        }

        if (compactHeaderRef.current) {
          compactHeaderRef.current.style.opacity = String(
            headerProgress * headerProgress
          );
          compactHeaderRef.current.style.transform = `translateX(-50%) translateY(${(1 - headerProgress) * 4}px)`;
          compactHeaderRef.current.style.pointerEvents =
            headerProgress > 0.8 ? "auto" : "none";
        }
        if (scanResultRef.current) {
          scanResultRef.current.style.opacity = String(
            (1 - headerProgress) * (1 - headerProgress)
          );
        }
        if (topBarRef.current) {
          topBarRef.current.style.boxShadow =
            headerProgress > 0.05
              ? `0 8px 24px rgba(45, 40, 31, ${0.08 * headerProgress})`
              : "none";
          topBarRef.current.style.borderBottomColor = `rgba(224, 216, 204, ${0.75 * headerProgress})`;
        }

        frame = 0;
      });
    };

    element.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      element.removeEventListener("scroll", handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!gradeHelpOpen) return;

    function closeGradeHelp({ returnFocus = false } = {}) {
      setGradeHelpOpen(false);
      if (returnFocus) window.requestAnimationFrame(() => gradeHelpButtonRef.current?.focus());
    }
    function closeOnOutsideTap(event: PointerEvent) {
      if (!gradeHelpRef.current?.contains(event.target as Node)) closeGradeHelp();
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeGradeHelp({ returnFocus: true });
    }

    window.addEventListener("pointerdown", closeOnOutsideTap);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeOnOutsideTap);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [gradeHelpOpen]);

  return (
    <div
      className="flex flex-col"
      style={{ height: "100dvh", background: PAGE_BG, overflowX: "hidden" }}
    >
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: "touch" }}
      >

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <div
        ref={topBarRef}
        className="sticky top-0 z-40 flex items-center justify-between px-4 pb-2 bg-[rgba(250,247,242,0.94)] dark:bg-[rgba(26,23,20,0.94)]"
        style={{
          paddingTop: "calc(0.75rem + env(safe-area-inset-top))",
          borderBottom: "0.5px solid transparent",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <Link
          href="/scan"
          aria-label="Back to scanner"
          className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-black/5"
          style={{ color: "var(--sk-text-green)" }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div ref={compactHeaderRef} style={{ opacity: 0, display: "flex", alignItems: "center", gap: 6, position: "absolute", left: "50%", transform: "translateX(-50%)", pointerEvents: "none", willChange: "opacity" }}>
          {/* His face IS the verdict, so it is the thing that must not be lost
              on scroll — a grade letter repeated in a sticky bar is not. */}
          <Merk expression={merkVerdict.expression} size={30} limbs={false} still aria-hidden />
          <span
            className="truncate max-w-[150px]"
            style={{ color: "var(--sk-text-primary)", fontSize: 13, fontFamily: "var(--sk-font-ui)" }}
          >
            {product.name}
          </span>
          <span
            style={{
              fontFamily: "var(--sk-font-ui)",
              fontVariantNumeric: "tabular-nums",
              fontSize: 15,
              color: bandColour(score),
              flexShrink: 0
            }}
          >
            {score ?? "–"}
          </span>
        </div>
        <span
          ref={scanResultRef}
          style={{
            fontFamily: "var(--sk-font-ui)",
            fontVariantNumeric: "tabular-nums",
            fontSize: 10.5,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--sk-text-muted)",
            willChange: "opacity"
          }}
        >
          {shelfContext ?? ""}
        </span>
        <div className="h-10 w-10" aria-hidden="true" />
      </div>

      {/* ── PRODUCT HEADER — context line, then the product name is the title,
            spanning full width (no thumbnail — the label IS Merk). ────────── */}
      <div ref={heroRef} className="mx-5 mt-2" style={{ willChange: "opacity" }}>
        <div ref={heroContentRef} style={{ willChange: "opacity, transform" }}>
          <h1
            style={{
              fontFamily: "var(--sk-font-ui)",
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: "-0.025em",
              color: "var(--sk-text-primary)",
              lineHeight: 1.12,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {product.name}
          </h1>
          <p style={{ fontSize: 13, color: "var(--sk-text-muted)", marginTop: 4 }}>
            {product.brand || product.barcode}
          </p>
        </div>
      </div>

      {/* ── SCORE CARD — the number, the shelf, and two grade tiles ──────── */}
      <div className="mx-5" style={{ marginTop: 14 }}>
        <ScoreCard
          score={score}
          nutriScore={product.nutritionGradeLetter ?? null}
          ecoGrade={hasOfficialEcoData ? ecoGrade : null}
          shelfMedian={skarenShelfMedian ?? shelfMedian}
          confident={hasSkaren ? true : product.healthConfident ?? true}
          lang={lang}
          onWhy={() => setMethodOpen(true)}
        />
      </div>

      {/* ── MERK'S VERDICT — traced from the canvas: ink card, 26px folded
            corner, Merk at 94px aligned to the BOTTOM edge, one 17.5px cream
            headline carrying the sharpest single fact, then the sentence. ──── */}
      <section className="mx-5" style={{ marginTop: 12 }}>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            background: "var(--sk-verdict-bg)",
            borderRadius: 22,
            padding: "18px 20px",
            display: "flex",
            alignItems: "flex-end",
            gap: 13
          }}
        >
          {/* His silhouette signature. The fold shows the page beneath. */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 26,
              height: 26,
              background: "var(--sk-verdict-fold)",
              clipPath: "polygon(0 0, 100% 100%, 0 100%)"
            }}
          />
          <Merk expression={merkVerdict.expression} size={94} limbs={false} aria-label="Merk" />
          <div style={{ flex: 1, minWidth: 0, paddingBottom: 5 }}>
            <p style={{ fontSize: 17.5, fontWeight: 400, color: "var(--sk-verdict-text)" }}>
              {merkVerdict.eyebrow ?? merkVerdict.headline}
            </p>
            <p
              style={{
                fontFamily: "var(--sk-font-ui)",
                fontSize: 13.5,
                lineHeight: 1.45,
                color: "var(--sk-verdict-body)",
                marginTop: 4
              }}
            >
              {merkVerdict.text}
            </p>
          </div>
        </div>
      </section>

      <ScoreMethodSheet
        open={methodOpen}
        onClose={() => setMethodOpen(false)}
        product={product}
        score={score}
        deductions={deductions}
        baseline={HEALTH_SCORE_BASELINE}
        skaren={skarenExplain}
        lang={lang}
      />

      {/* ── SCROLLABLE CONTENT ──────────────────────────────────────────── */}
      <div className="px-5" style={{ paddingTop: 12, paddingBottom: 30 }}>

        {/* 2. PROCESSING LEVEL — four discrete steps, only the active one lit */}
        {product.novaGroup ? (
          <div style={{ marginTop: 16 }}>
            {isPremium ? (
              <ProcessingLevel novaGroup={product.novaGroup} lang={lang} />
            ) : (
              <PremiumNudge label={t('product_processing', lang)} lang={lang} />
            )}
          </div>
        ) : null}

        {/* 3. ALLERGENS — sits tight under processing, 9px, as one thought */}
        <div style={{ marginTop: 9 }}>
          {isPremium ? (
            <AllergenCard allergens={product.allergens} lang={lang} />
          ) : (
            <PremiumNudge label={t('product_allergens', lang)} lang={lang} />
          )}
        </div>


        {/* 3b. ADDITIVES — the marketing spearhead sits high, right under the
              verdict and above nutrition. */}
        <div className="flex flex-col" style={{ gap: 10 }}>
          <div className="flex items-baseline justify-between gap-3">
            <SectionLabel>{t('product_additives', lang)}</SectionLabel>
            <span style={{ fontSize: 12, color: "var(--sk-text-muted)" }}>
              {additivesHeaderHint(allAdditives.length, lang)}
            </span>
          </div>
          {isPremium ? (
            <Additives additives={allAdditives} lang={lang} />
          ) : (
            <PremiumNudge label={t('product_additives', lang)} lang={lang} />
          )}
          {/* Merk's one-line note on WHY this additive combination, in plain
              words. Only rendered when the v1 copy supplies it. */}
          {isPremium && merkCopy?.additiveNote ? (
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: "var(--sk-text-muted)",
                fontStyle: "italic",
                marginTop: 2,
              }}
            >
              {merkCopy.additiveNote}
            </p>
          ) : null}
        </div>

        {/* 4. NUTRITION — one merged section: grams as printed (left) +
              share of your day (right). Premium unlocks the % column. */}
        {nutritionRows.length > 0 && (
          <div style={{ marginTop: 16 }}>
            {isPremium ? (
              <NutritionTable product={product} nutrition={product.kassalappNutrition} lang={lang} />
            ) : (
              <>
                <div style={{ background: CARD_BG, borderRadius: 16, border: `0.5px solid ${CARD_BORDER}`, overflow: "hidden" }}>
                  {nutritionRows.map((row, index) => (
                    <div
                      key={row.label}
                      className="flex min-h-12 items-center justify-between px-4 py-3"
                      style={index < nutritionRows.length - 1 ? { borderBottom: `1px solid ${CARD_BORDER}` } : undefined}
                    >
                      <span className="type-body-sm" style={{ fontWeight: 600, color: "var(--sk-text-primary)" }}>{row.label}</span>
                      <span style={{ fontFamily: "var(--sk-font-data)", fontSize: 13, color: "var(--sk-text-primary)", fontVariantNumeric: "tabular-nums" }}>
                        {row.displayAmount}
                      </span>
                    </div>
                  ))}
                </div>
                <PremiumNudge label={t('product_daily_impact', lang)} lang={lang} />
              </>
            )}
          </div>
        )}

        {/* 6. KEY INSIGHTS — removed: the verdict now carries a single voice. */}

        {/* 7. WHAT WOULD MERK BUY — use-case advice, deliberately no numbers.
              Prefer the v1 copy's paragraph (premium) over the static line. */}
        <div style={{ marginTop: 16 }}>
          <MerkBuyNote
            grade={healthGrade}
            lang={lang}
            note={isPremium ? merkCopy?.wouldMerkBuy ?? null : null}
            productName={product.name}
            brand={product.brand}
            onFindAlternatives={() => {
              alternativesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          />
        </div>

        {/* 8. INGREDIENTS — free for all users */}
        {ingredients != null && (
          <div className="flex flex-col" style={{ marginTop: 14, gap: 9 }}>
            {/* Collapsed disclosure, exactly as the canvas draws it: a count,
                a one-line reassurance, and a chevron. The list itself is rarely
                what people want — knowing it is there is. */}
            <button
              type="button"
              onClick={() => setIngredientsOpen((open) => !open)}
              className="focus-ring w-full"
              aria-expanded={ingredientsOpen}
              style={{
                background: "var(--sk-surface-card)",
                borderRadius: 18,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                textAlign: "left",
                minHeight: "var(--sk-min-tap)"
              }}
            >
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontSize: 14.5, color: "var(--sk-text-primary)" }}>
                  {t('product_ingredients', lang)} · {ingredientCount}
                </span>
                <span style={{ display: "block", fontSize: 12, color: "var(--sk-text-muted)", marginTop: 2 }}>
                  {t('product_ingredients_sub', lang)}
                </span>
              </span>
              <span
                aria-hidden
                style={{
                  fontSize: 15,
                  color: "var(--sk-text-muted)",
                  transform: ingredientsOpen ? "rotate(180deg)" : undefined,
                  transition: "transform 180ms ease-out"
                }}
              >
                ⌄
              </span>
            </button>
            {ingredientsOpen ? (
              <div style={{ background: "var(--sk-surface-card)", borderRadius: 18, padding: "14px 18px" }}>
                <p style={{ fontSize: 13, color: "var(--sk-text-secondary)", lineHeight: 1.6 }}>{ingredients}</p>
              </div>
            ) : null}
          </div>
        )}

        {/* 9. ALTERNATIVES — opt-in, ranked on criteria, never sponsored */}
        <div ref={alternativesRef} style={{ marginTop: 16, scrollMarginTop: 80 }}>
          <Alternatives
            product={product}
            clean={allAdditives.length === 0 && (healthGrade === "A" || healthGrade === "B")}
            lang={lang}
            onShelfMedian={setShelfMedian}
          />
        </div>

      </div>
      </div>

      {/* ── BOTTOM ACTIONS ───────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 grid grid-cols-2 gap-2 border-t px-4 py-3"
        style={{
          background: CARD_BG,
          borderColor: CARD_BORDER,
          paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
        }}
      >
        <button
          type="button"
          onClick={() => router.push("/scan")}
          className="type-button flex items-center justify-center rounded-2xl py-3.5 transition active:scale-95"
          style={{ background: PAGE_BG, color: "var(--sk-text-green)", border: `1px solid ${CARD_BORDER}` }}
        >
          {t('scan_again', lang)}
        </button>

        <button
          type="button"
          onClick={() => {
            if (addedToList) {
              router.push("/shopping-list");
              return;
            }
            void addItem({
              name: product.name,
              category: getShoppingCategory(product),
              healthGrade: healthGrade ?? undefined,
              healthScore: score ?? undefined,
              addedFromScan: true,
            }).then(() => setAddedToList(true));
          }}
          className="type-button flex items-center justify-center gap-2 rounded-2xl py-3.5 transition active:scale-95"
          style={
            addedToList
              ? { background: "var(--sk-grade-a-bg)", color: "var(--sk-grade-a-text)", border: "1px solid var(--sk-grade-a-border)" }
              : { background: "var(--sk-brand-forest)", color: "var(--sk-text-on-dark)" }
          }
        >
          {addedToList ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              {t('product_added', lang)}
            </>
          ) : (
            <>
              <ListPlus className="h-4 w-4" />
              {t('product_add_to_list', lang)}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
