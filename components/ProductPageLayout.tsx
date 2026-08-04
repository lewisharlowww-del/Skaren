"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronRight, Crown, Info, ListPlus } from "lucide-react";
import { NutritionTable } from "@/components/NutritionTable";
import { Additives } from "@/components/Additives";
import { Merk, type MerkExpression } from "@/components/Merk";
import { BarcodeMeter } from "@/components/BarcodeMeter";
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

// Merk's one-line verdict — a single voice, category-aware where we can be.
// Expression + words move together (see the mascot bible): confident/happy for
// strong products, thinking for the middle, concern for weak ones. Never angry.
function getMerkVerdict(
  grade: GradeLetter | null,
  lang: "en" | "no"
): { expression: MerkExpression; headline: string; text: string } {
  const no = lang === "no";
  if (!grade) {
    return {
      expression: "unsure",
      headline: no ? "Vet ikke helt." : "Not sure yet.",
      text: no
        ? "Jeg mangler nok data til å gi en score her ennå."
        : "I don't have enough data to score this one yet.",
    };
  }
  const map: Record<GradeLetter, { expression: MerkExpression; headEn: string; headNo: string; en: string; no: string }> = {
    A: { expression: "confident", headEn: "Clean pick.", headNo: "Rent produkt.", en: "One of the better choices on its shelf.", no: "Et av de bedre valgene i hylla." },
    B: { expression: "happy", headEn: "Solid choice.", headNo: "Godt valg.", en: "Little here worth worrying about.", no: "Lite her å bekymre seg for." },
    C: { expression: "thinking", headEn: "Middle of the shelf.", headNo: "Midt på hylla.", en: "Fine now and then.", no: "Grei av og til." },
    D: { expression: "curious", headEn: "Worth a look.", headNo: "Verdt en titt.", en: "Worth a closer look before it becomes a habit.", no: "Verdt en nærmere titt før det blir en vane." },
    E: { expression: "concern", headEn: "Lots of salt here.", headNo: "Mye salt her.", en: "There are better options next to this one.", no: "Det finnes bedre alternativer ved siden av." },
  };
  const m = map[grade];
  return { expression: m.expression, headline: no ? m.headNo : m.headEn, text: no ? m.no : m.en };
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
  const merkVerdict = getMerkVerdict(healthGrade, lang);
  const nutritionRows = getNutritionRows(product);
  const ingredients = visibleIngredients(product);

  // Build additive list: use product.additives if present, otherwise parse from ingredients text
  const rawAdditives = product.additives ?? [];
  const allAdditives: typeof rawAdditives | string[] =
    rawAdditives.length > 0
      ? rawAdditives
      : extractAdditivesFromIngredients(ingredients ?? "");
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
            style={{ color: "var(--sk-text-primary)", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-dm-sans), sans-serif" }}
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
        <span ref={scanResultRef} style={{ opacity: 1, color: MUTED, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", willChange: "opacity" }}>
          {t('scan_result', lang)}
        </span>
        <div className="h-10 w-10" aria-hidden="true" />
      </div>

      {/* ── VERDICT CARD — Merk's sentence leads, product image beside him.
            Folded top-right corner marks this as a Merk-owned card. ────────── */}
      <div ref={heroRef} className="mx-4 mt-2" style={{ willChange: "opacity" }}>
        <div className="sk-folded" style={{ padding: "16px 18px" }}>
          <div
            ref={heroContentRef}
            style={{ display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 1, willChange: "opacity, transform" }}
          >
            {/* Product image — soft square, not a circle */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: 76, height: 76, borderRadius: 14,
                background: "var(--sk-brand-mist)",
                border: "0.5px solid var(--sk-border-default)",
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
                    style={{ fontSize: 34, lineHeight: 1 }}
                  >
                    {product.placeholderEmoji}
                  </div>
                )}
              </div>
            </div>

            {/* Merk's verdict — the sentence is the headline, not the grade */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontFamily: "var(--font-familjen), sans-serif",
                  fontSize: 19,
                  fontWeight: 600,
                  letterSpacing: "-0.03em",
                  color: "var(--sk-text-primary)",
                  lineHeight: 1.1,
                }}
              >
                {merkVerdict.headline}
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.4, color: "var(--sk-text-secondary)", marginTop: 5 }}>
                {merkVerdict.text}
              </p>
            </div>

            {/* Merk himself, small, reacting to the grade */}
            <div style={{ flexShrink: 0, alignSelf: "flex-end", marginBottom: -4 }}>
              <Merk expression={merkVerdict.expression} size={54} limbs={false} aria-label="Merk" />
            </div>
          </div>
        </div>
        {/* Product name + brand as a quiet mono line under the verdict */}
        <p
          style={{
            fontFamily: "var(--sk-font-data)",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--sk-text-muted)",
            marginTop: 8,
            paddingLeft: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {product.name}{product.brand ? ` · ${product.brand}` : ""}
        </p>
      </div>

      {/* ── GRADES — ink letter + barcode density, no colour tint ─────────── */}
      <section ref={gradeHelpRef} className="relative mx-4 mt-3">
        <div className="grid grid-cols-2 gap-2.5">
          <div style={{ background: CARD_BG, border: `0.5px solid ${CARD_BORDER}`, borderRadius: "var(--sk-radius-md)", padding: "14px 16px" }}>
            <div className="flex items-center justify-between">
              <span className="type-section-label" style={{ color: MUTED }}>{t("product_health", lang)}</span>
              <button
                ref={gradeHelpButtonRef}
                type="button"
                aria-label="Explain grades"
                aria-expanded={gradeHelpOpen}
                onClick={() => setGradeHelpOpen((open) => !open)}
                className="focus-ring grid h-6 w-6 -mr-1 -mt-1 place-items-center rounded-full"
                style={{ color: MUTED }}
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-end justify-between" style={{ marginTop: 8 }}>
              <span style={{ fontFamily: "var(--font-familjen), sans-serif", fontSize: 32, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 0.85, color: "var(--sk-text-primary)" }}>
                {healthGrade ?? "–"}
              </span>
              <BarcodeMeter grade={healthGrade} />
            </div>
            <p className="type-caption" style={{ color: MUTED, textTransform: "none", letterSpacing: 0, marginTop: 8 }}>
              {getGradeSummary(healthGrade, "health", lang)}
            </p>
          </div>

          <div style={{ background: CARD_BG, border: `0.5px solid ${CARD_BORDER}`, borderRadius: "var(--sk-radius-md)", padding: "14px 16px", opacity: hasOfficialEcoData ? 1 : 0.6 }}>
            <span className="type-section-label" style={{ color: MUTED }}>{t("product_eco", lang)}</span>
            <div className="flex items-end justify-between" style={{ marginTop: 8 }}>
              <span style={{ fontFamily: "var(--font-familjen), sans-serif", fontSize: 32, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 0.85, color: hasOfficialEcoData ? "var(--sk-text-primary)" : MUTED }}>
                {ecoGrade ?? "–"}
              </span>
              <BarcodeMeter grade={hasOfficialEcoData ? ecoGrade : null} />
            </div>
            <p className="type-caption" style={{ color: MUTED, textTransform: "none", letterSpacing: 0, marginTop: 8 }}>
              {getGradeSummary(ecoGrade, "eco", lang)}
            </p>
          </div>
        </div>

        {/* Grade help popover */}
        {gradeHelpOpen ? (
          <div
            style={{ position: "absolute", right: 0, top: 96, zIndex: 30, width: "min(18rem, calc(100vw - 3rem))", background: CARD_BG, borderRadius: 16, border: `0.5px solid ${CARD_BORDER}`, padding: 16, boxShadow: "0 18px 60px rgba(50,42,31,0.15)", textAlign: "left" }}
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

        {/* 3b. ADDITIVES — the marketing spearhead sits high, right under the
              verdict and above nutrition. */}
        <div className="mb-4 flex flex-col gap-2.5">
          <SectionLabel>{t('product_additives', lang)}</SectionLabel>
          {isPremium ? (
            <Additives additives={allAdditives} lang={lang} />
          ) : (
            <PremiumNudge label={t('product_additives', lang)} lang={lang} />
          )}
        </div>

        {/* 4. NUTRITION — one merged section: grams as printed (left) +
              share of your day (right). Premium unlocks the % column. */}
        {nutritionRows.length > 0 && (
          <div className="mb-4 flex flex-col gap-2.5">
            <SectionLabel>{t('product_nutrition', lang)}</SectionLabel>
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
