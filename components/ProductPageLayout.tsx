"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronRight, Crown, Info, ListPlus } from "lucide-react";
import { DailyIntake } from "@/components/DailyIntake";
import { Additives } from "@/components/Additives";
import { getGradeLabel } from "@/components/ScoreBadge";
import { useShoppingList } from "@/hooks/useShoppingList";
import { hasEcoData } from "@/lib/ecoscore";
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

function getTypedInsightTone(type: ProductInsight["type"]) {
  if (type === "positive") {
    return { icon: CheckCircle2, bg: "var(--sk-grade-a-bg)", border: "var(--sk-grade-a-border)", text: "var(--sk-grade-a-text)" };
  }
  if (type === "warning") {
    return { icon: AlertTriangle, bg: "var(--sk-grade-e-bg)", border: "var(--sk-grade-e-border)", text: "var(--sk-grade-e-text)" };
  }
  return { icon: Info, bg: PAGE_BG, border: CARD_BORDER, text: "var(--sk-text-secondary)" };
}

function polishInsightText(text: string) {
  return text
    .replace(/\bmentioned\b/gi, "found")
    .replace(/\bseems\b/gi, "is")
    .replace(/\bappears\b/gi, "is");
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
  if (/sulphite|sulfit|svovl/.test(lower)) return "⚗️";
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

  const hasOfficialEcoData = hasEcoData(product);
  const ecoGrade = hasOfficialEcoData ? product.ecoGradeLetter ?? getEcoGrade(product) : null;
  const healthGrade = hasNutritionSignal(product) ? product.healthGrade : null;
  const nutritionRows = getNutritionRows(product);
  const ingredients = visibleIngredients(product);

  // Build additive list: use product.additives if present, otherwise parse from ingredients text
  const rawAdditives = product.additives ?? [];
  const allAdditives: typeof rawAdditives | string[] =
    rawAdditives.length > 0
      ? rawAdditives
      : extractAdditivesFromIngredients(ingredients ?? "");
  const quickFacts = nutritionRows.slice(0, 4);
  const insights = getKeyInsights(product)
    .map((insight) => ({ ...insight, text: polishInsightText(insight.text) }))
    .filter((insight) => {
      const text = insight.text.toLowerCase();
      return !text.includes("limited eco data") && !text.includes("eco score is missing") && !text.includes("weak eco score");
    })
    .slice(0, 3);
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
          <span
            className="truncate max-w-[160px]"
            style={{ color: "var(--sk-text-primary)", fontSize: 13, fontWeight: 700, fontFamily: "Manrope, sans-serif" }}
          >
            {product.name}
          </span>
          {healthGrade ? (
            <span style={{ fontSize: 12, fontWeight: 800, borderRadius: 6, padding: "2px 7px", background: GRADE_BACKGROUNDS[healthGrade], color: GRADE_COLORS[healthGrade], flexShrink: 0 }}>
              {healthGrade}
            </span>
          ) : null}
          {ecoGrade ? (
            <span style={{ fontSize: 12, fontWeight: 800, borderRadius: 6, padding: "2px 7px", background: GRADE_BACKGROUNDS[ecoGrade], color: GRADE_COLORS[ecoGrade], flexShrink: 0 }}>
              {ecoGrade}
            </span>
          ) : null}
        </div>
        <span ref={scanResultRef} style={{ opacity: 1, color: MUTED, fontFamily: "Manrope, sans-serif", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", willChange: "opacity" }}>
          {t('scan_result', lang)}
        </span>
        <div className="h-10 w-10" aria-hidden="true" />
      </div>

      {/* ── HERO — G4: warm cream, blurred orbs, circular image, green left border ── */}
      <div
        ref={heroRef}
        className="relative mx-4 mt-2 overflow-hidden rounded-2xl"
        style={{
          background: "var(--sk-brand-mist-card)",
          borderLeft: "4px solid var(--sk-brand-leaf)",
          border: "0.5px solid var(--sk-border-default)",
          borderLeftWidth: 4,
          borderLeftColor: "var(--sk-brand-leaf)",
          willChange: "opacity",
        }}
      >
        {/* Content row */}
        <div
          ref={heroContentRef}
          style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 18px 18px 14px", position: "relative", zIndex: 1, willChange: "opacity, transform" }}
        >
          {/* Circular image */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "rgba(255,255,255,0.88)",
              border: "2.5px solid var(--sk-border-green)",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
            }}>
              {product.displayImage ? (
                <img
                  ref={(node) => { heroMediaRef.current = node; }}
                  src={product.displayImage}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6 }}
                />
              ) : (
                <div
                  ref={(node) => { heroMediaRef.current = node; }}
                  style={{ fontSize: 36, lineHeight: 1 }}
                >
                  {product.placeholderEmoji}
                </div>
              )}
            </div>
            {/* Green checkmark badge */}
            <div style={{
              position: "absolute", bottom: -2, right: -2,
              width: 22, height: 22, borderRadius: "50%",
              background: "var(--sk-brand-forest)",
              border: "2px solid var(--sk-brand-mist-card)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 2,
            }}>
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L4 7L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: "var(--sk-text-primary)",
                fontFamily: "Satoshi, sans-serif",
                lineHeight: 1.25,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {product.name}
            </h1>
            {product.brand && (
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--sk-text-muted)", marginTop: 3 }}>
                {product.brand}
              </p>
            )}
            <span
              style={{
                display: "inline-flex", alignItems: "center",
                marginTop: 8,
                background: "var(--sk-grade-a-bg)",
                border: "0.5px solid var(--sk-grade-a-border)",
                borderRadius: 20,
                padding: "3px 10px",
                fontSize: 12,
                color: "var(--sk-grade-a-text)",
                fontWeight: 600,
              }}
            >
              {product.norwegianDataStatus === "kassalapp" ? `✓ ${t('product_store_data', lang)}` : t('product_limited_data', lang)}
            </span>
          </div>
        </div>
      </div>

      {/* ── GRADES ──────────────────────────────────────────────────────── */}
      <section ref={gradeHelpRef} className="relative mx-4 mt-3">
        <div className="mb-2 flex items-center justify-between px-0.5">
          <SectionLabel>{t("product_grades", lang)}</SectionLabel>
          <button
            ref={gradeHelpButtonRef}
            type="button"
            aria-label="Explain grades"
            aria-expanded={gradeHelpOpen}
            onClick={() => setGradeHelpOpen((open) => !open)}
            className="focus-ring grid h-11 w-11 place-items-center rounded-full"
            style={{
              background: CARD_BG,
              border: `0.5px solid ${CARD_BORDER}`,
              color: MUTED,
            }}
          >
            <Info className="h-4 w-4" />
          </button>
        </div>

        <div
          className="overflow-hidden rounded-2xl"
          style={{ background: CARD_BG, border: `0.5px solid ${CARD_BORDER}` }}
        >
          <div className="grid grid-cols-2">
            <div className="flex flex-col items-center gap-2 px-4 py-4">
              <div style={{ width: 72, height: 72, borderRadius: "50%", border: `2.5px solid ${getGradeBorder(healthGrade)}`, background: getGradeBackground(healthGrade), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
                <span className="type-grade" style={{ fontSize: 24, color: getColor(healthGrade), fontFamily: "Manrope, sans-serif" }}>
                  {healthGrade ?? "–"}
                </span>
                {healthGrade ? (
                  <span style={{ fontSize: 9, fontWeight: 700, lineHeight: 1, color: getColor(healthGrade), textTransform: "uppercase", letterSpacing: 0, whiteSpace: "nowrap" }}>
                    {getGradeLabel(healthGrade, lang)}
                  </span>
                ) : null}
              </div>
              <span className="type-section-label" style={{ color: MUTED }}>
                {t("product_health", lang)}
              </span>
              <span className="type-caption text-center" style={{ color: getColor(healthGrade), textTransform: "none", letterSpacing: 0 }}>
                {getGradeSummary(healthGrade, "health", lang)}
              </span>
            </div>

            <div
              className="flex flex-col items-center gap-2 border-l px-4 py-4"
              style={{
                borderColor: CARD_BORDER,
                opacity: hasOfficialEcoData ? 1 : 0.55,
              }}
            >
              <div style={{ width: 72, height: 72, borderRadius: "50%", border: hasOfficialEcoData ? `2.5px solid ${getGradeBorder(ecoGrade)}` : `2px dashed ${CARD_BORDER}`, background: hasOfficialEcoData ? getGradeBackground(ecoGrade) : CARD_BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
                <span className="type-grade" style={{ fontSize: 24, color: hasOfficialEcoData ? getColor(ecoGrade) : MUTED, fontFamily: "Manrope, sans-serif" }}>
                  {ecoGrade ?? "–"}
                </span>
                {ecoGrade ? (
                  <span style={{ fontSize: 9, fontWeight: 700, lineHeight: 1, color: getColor(ecoGrade), textTransform: "uppercase", letterSpacing: 0, whiteSpace: "nowrap" }}>
                    {getGradeLabel(ecoGrade, lang)}
                  </span>
                ) : null}
              </div>
              <span className="type-section-label" style={{ color: MUTED }}>
                {t("product_eco", lang)}
              </span>
              <span className="type-caption text-center" style={{ color: hasOfficialEcoData ? getColor(ecoGrade) : MUTED, textTransform: "none", letterSpacing: 0 }}>
                {getGradeSummary(ecoGrade, "eco", lang)}
              </span>
            </div>
          </div>
        </div>

        {/* Grade help popover */}
        {gradeHelpOpen ? (
          <div
            style={{ position: "absolute", right: 0, top: 54, zIndex: 30, width: "min(18rem, calc(100vw - 3rem))", background: CARD_BG, borderRadius: 16, border: `0.5px solid ${CARD_BORDER}`, padding: 16, boxShadow: "0 18px 60px rgba(50,42,31,0.15)", textAlign: "left" }}
          >
            <p className="type-section-label" style={{ color: "var(--sk-text-green)", marginBottom: 12 }}>
              {t('product_how_grades_work', lang)}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 13, color: "var(--sk-text-secondary)" }}>
                <span style={{ fontWeight: 700, color: "var(--sk-text-primary)" }}>{t('product_health', lang)}: </span>
                {getHealthGradeBasis(product, Boolean(healthGrade), lang)}
              </p>
              <p style={{ fontSize: 13, color: "var(--sk-text-secondary)" }}>
                <span style={{ fontWeight: 700, color: "var(--sk-text-primary)" }}>{t('product_eco', lang)}: </span>
                {getEcoGradeBasis(hasOfficialEcoData, lang)}
              </p>
            </div>
          </div>
        ) : null}
      </section>

      {/* ── SCROLLABLE CONTENT ──────────────────────────────────────────── */}
      <div
        className="px-4 pb-4 pt-1"
      >

        {/* 2. PROCESSING LEVEL */}
        {product.novaGroup ? (
          <div className="mb-4 flex flex-col gap-2.5">
            <SectionLabel>{t('product_processing', lang)}</SectionLabel>
            {isPremium ? (
              <div style={{ background: CARD_BG, borderRadius: 16, border: `0.5px solid ${CARD_BORDER}`, padding: 16 }}>
                {/* Top row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p className="type-body-lg" style={{ fontWeight: 700, color: NOVA_TONES[product.novaGroup]?.text ?? MUTED }}>{novaLabels[product.novaGroup]}</p>
                    <p className="type-caption" style={{ color: MUTED, marginTop: 2 }}>
                      NOVA {product.novaGroup} · {novaLabels[product.novaGroup]}
                    </p>
                  </div>
                  <div style={{ background: NOVA_TONES[product.novaGroup]?.bg ?? CARD_BG, border: `0.5px solid ${NOVA_TONES[product.novaGroup]?.border ?? CARD_BORDER}`, borderRadius: 12, minWidth: 58, padding: "7px 10px", textAlign: "center" }}>
                    <p className="type-section-label" style={{ color: NOVA_TONES[product.novaGroup]?.text ?? MUTED }}>NOVA</p>
                    <p style={{ fontSize: 20, fontWeight: 900, color: NOVA_TONES[product.novaGroup]?.text ?? MUTED, lineHeight: 1 }}>{product.novaGroup}</p>
                  </div>
                </div>
                {/* Scale bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 10, minHeight: 9 }}>
                  {([1, 2, 3, 4] as const).map((level) => {
                    const tone = NOVA_TONES[level];
                    const isActive = product.novaGroup === level;
                    return (
                      <div
                        key={level}
                        style={{
                          flex: 1,
                          height: isActive ? 9 : 7,
                          borderRadius: 4,
                          background: tone.bg,
                          border: `${isActive ? 1.5 : 0.5}px solid ${tone.border}`,
                        }}
                      />
                    );
                  })}
                </div>
                {/* Scale labels */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6, marginTop: 7 }}>
                  {novaSegmentLabels.map((label, index) => (
                    <span
                      key={label}
                      style={{
                        fontSize: 12,
                        lineHeight: 1.25,
                        textAlign:
                          index === 0
                            ? "left"
                            : index === novaSegmentLabels.length - 1
                              ? "right"
                              : "center",
                        color:
                          product.novaGroup === index + 1
                            ? NOVA_TONES[product.novaGroup]?.text
                            : MUTED,
                        fontWeight: product.novaGroup === index + 1 ? 700 : 400,
                      }}
                    >
                      {label}
                      {product.novaGroup === index + 1 ? " ●" : ""}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <PremiumNudge label={t('product_processing', lang)} lang={lang} />
            )}
          </div>
        ) : null}

        {/* 3. ALLERGENS */}
        <div className="mb-4 flex flex-col gap-2.5">
          <SectionLabel>{t('product_allergens', lang)}</SectionLabel>
          {!isPremium ? (
            <PremiumNudge label={t('product_allergens', lang)} lang={lang} />
          ) : product.allergens.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
              {product.allergens.map((a) => (
                <div
                  key={a}
                  style={{ background: CARD_BG, borderRadius: 16, border: `0.5px solid ${CARD_BORDER}`, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}
                >
                  <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{getAllergenEmoji(a)}</span>
                  <div style={{ minWidth: 0 }}>
                    <p className="type-body-sm" style={{ fontWeight: 700, color: "var(--sk-text-primary)" }}>{a}</p>
                    <p className="type-caption" style={{ color: MUTED, marginTop: 2, textTransform: "none", letterSpacing: 0 }}>{t('product_contains', lang)} {a.toLowerCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: "var(--sk-grade-a-bg)", borderRadius: 16, border: "0.5px solid var(--sk-grade-a-border)", padding: "12px 16px" }}>
              <p className="type-body-sm" style={{ fontWeight: 600, color: "var(--sk-grade-a-text)" }}>{t('product_no_allergens', lang)}</p>
            </div>
          )}
        </div>

        {/* 4. NUTRITION PER 100G */}
        {nutritionRows.length > 0 && (
          <div className="mb-4 flex flex-col gap-2.5">
            <SectionLabel>{t('product_nutrition', lang)}</SectionLabel>
            <div style={{ background: CARD_BG, borderRadius: 16, border: `0.5px solid ${CARD_BORDER}`, overflow: "hidden" }}>
              {nutritionRows.map((row, index) => (
                <div
                  key={row.label}
                  className="flex min-h-12 items-center justify-between px-4 py-3"
                  style={index < nutritionRows.length - 1 ? { borderBottom: `1px solid ${CARD_BORDER}` } : undefined}
                >
                  <span className="type-body-sm" style={{ fontWeight: 600, color: "var(--sk-text-primary)" }}>{row.label}</span>
                  <span className={`type-body-sm rounded-full px-3 py-1 font-bold ${row.tone}`}>
                    {row.displayAmount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. DAILY IMPACT */}
        <div className="mb-4 flex flex-col gap-2.5">
          <SectionLabel>{t('product_daily_impact', lang)}</SectionLabel>
          {isPremium ? (
            <DailyIntake nutrition={product.kassalappNutrition} lang={lang} />
          ) : (
            <PremiumNudge label={t('product_daily_impact', lang)} lang={lang} />
          )}
        </div>

        {/* 6. ADDITIVES */}
        <div className="mb-4 flex flex-col gap-2.5">
          <SectionLabel>{t('product_additives', lang)}</SectionLabel>
          {isPremium ? (
            <Additives additives={allAdditives} lang={lang} />
          ) : (
            <PremiumNudge label={t('product_additives', lang)} lang={lang} />
          )}
        </div>

        {/* 7. KEY INSIGHTS — premium only */}
        {isPremium && insights.length > 0 && (
          <div className="mb-4 flex flex-col gap-2.5">
            <SectionLabel>{t('product_key_insights', lang)}</SectionLabel>
            {insights.map((insight) => {
              const tone = getTypedInsightTone(insight.type);
              const Icon = tone.icon;
              return (
                <div
                  key={insight.text}
                  className="flex items-start gap-3 rounded-2xl border px-4 py-3.5"
                  style={{ background: tone.bg, borderColor: tone.border, color: tone.text }}
                >
                  <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>{insight.text}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* 8. INGREDIENTS — free for all users */}
        {ingredients != null && (
          <div className="mb-4 flex flex-col gap-2.5">
            <SectionLabel>{t('product_ingredients', lang)}</SectionLabel>
            <div style={{ background: CARD_BG, borderRadius: 14, border: `0.5px solid ${CARD_BORDER}`, padding: "12px 14px" }}>
              <p style={{ fontSize: 13, color: "var(--sk-text-secondary)", lineHeight: 1.6 }}>{ingredients}</p>
            </div>
          </div>
        )}

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
