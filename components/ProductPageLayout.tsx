"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronRight, Crown, Info, ListPlus } from "lucide-react";
import { DailyIntake } from "@/components/DailyIntake";
import { Additives } from "@/components/Additives";
import { gradeDescriptions } from "@/components/ScoreBadge";
import { useShoppingList } from "@/hooks/useShoppingList";
import { hasEcoData } from "@/lib/ecoscore";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/language-context";
import type { ProductInsight, ProductResult, GradeLetter } from "@/lib/types";

// ── Design tokens ──────────────────────────────────────────────────────────────
const PAGE_BG   = "#faf7f2";
const CARD_BG   = "#ffffff";
const CARD_BORDER = "#e0d8cc";
const MUTED     = "#9a8e7e";

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
  A: "#2a5030",
  B: "#486020",
  C: "#706030",
  D: "#704830",
  E: "#703030",
};

const GRADE_BACKGROUNDS: Record<string, string> = {
  A: "#ddeedd",
  B: "#e8f0dc",
  C: "#f0e8d0",
  D: "#ece0d4",
  E: "#e8d8d4",
};

const GRADE_BORDERS: Record<string, string> = {
  A: "#88bb88",
  B: "#a8c880",
  C: "#c8a860",
  D: "#c09878",
  E: "#c09090",
};

// NOVA labels are built inside the component from translations (see novaLabels array in component body)
const NOVA_TONES: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: "#ddeedd", text: "#2a5030", border: "#88bb88" },
  2: { bg: "#e8f0dc", text: "#486020", border: "#a8c880" },
  3: { bg: "#f0e8d0", text: "#706030", border: "#c8a860" },
  4: { bg: "#e8d8d4", text: "#703030", border: "#c09090" },
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

function getHealthGradeBasis(product: ProductResult, hasNutrition: boolean) {
  if (!hasNutrition) return "Needs nutrition data to grade.";
  if (product.hasNokkelhull) return "Uses nutrition data + Norwegian Nøkkelhull label.";
  if (product.kassalappNutrition.length > 0) return "Uses calories, sugar, salt, fat, protein & fiber.";
  return "Based on the official Nutri-Score.";
}

function getEcoGradeBasis(hasEco: boolean) {
  return hasEco
    ? "Based on the official Open Food Facts Eco-Score."
    : "No official Eco-Score available yet.";
}

function getTypedInsightTone(type: ProductInsight["type"]) {
  if (type === "positive") {
    return { icon: CheckCircle2, bg: "#ddeedd", border: "#88bb88", text: "#2a5030" };
  }
  if (type === "warning") {
    return { icon: AlertTriangle, bg: "#e8d8d4", border: "#c09090", text: "#703030" };
  }
  return { icon: Info, bg: PAGE_BG, border: CARD_BORDER, text: "#5a4a38" };
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
    <p style={{
      fontSize: 9,
      fontWeight: 700,
      color: MUTED,
      textTransform: "uppercase",
      letterSpacing: "0.07em",
      padding: "10px 2px 5px",
      fontFamily: "Manrope, sans-serif",
    }}>
      {children}
    </p>
  );
}

function PremiumNudge({ label }: { label: string }) {
  return (
    <Link
      href="/pricing"
      className="flex items-center gap-3 rounded-2xl border px-4 py-3.5"
      style={{ borderColor: "#e8d080", backgroundColor: "#fff8e6" }}
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
        <Crown className="h-4 w-4 text-amber-600" />
      </div>
      <div className="flex-1">
        <p className="type-body-sm font-bold" style={{ color: "#7a5800" }}>Pro feature</p>
        <p className="type-caption" style={{ color: "#9a7830" }}>{label} · Upgrade to unlock</p>
      </div>
      <ChevronRight className="h-4 w-4 text-amber-400" />
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
  const [scrollY, setScrollY] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gradeHelpRef = useRef<HTMLDivElement>(null);
  const gradeHelpButtonRef = useRef<HTMLButtonElement>(null);

  const hasOfficialEcoData = hasEcoData(product);
  const ecoGrade = hasOfficialEcoData ? product.ecoGradeLetter ?? getEcoGrade(product) : null;
  const healthGrade = hasNutritionSignal(product) ? product.healthGrade : null;
  const nutritionRows = getNutritionRows(product);
  const ingredients = visibleIngredients(product);
  const quickFacts = nutritionRows.slice(0, 4);
  const insights = getKeyInsights(product)
    .map((insight) => ({ ...insight, text: polishInsightText(insight.text) }))
    .filter((insight) => {
      const text = insight.text.toLowerCase();
      return !text.includes("limited eco data") && !text.includes("eco score is missing") && !text.includes("weak eco score");
    })
    .slice(0, 3);
  const heroOpacity = Math.max(0, 1 - scrollY / 120);
  const heroHeight = Math.max(0, 130 - scrollY * 0.8);
  const gradesOpacity = Math.max(0, 1 - (scrollY - 80) / 80);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = () => setScrollY(element.scrollTop);
    element.addEventListener("scroll", handleScroll, { passive: true });
    return () => element.removeEventListener("scroll", handleScroll);
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

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <div
        className="flex flex-shrink-0 items-center justify-between px-4 pb-2"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
        <Link
          href="/scan"
          aria-label="Back to scanner"
          className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-black/5"
          style={{ color: "#2d4a26" }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div style={{ opacity: scrollY > 100 ? Math.min(1, (scrollY - 100) / 60) : 0, transition: "opacity 0.2s linear", display: "flex", alignItems: "center", gap: 6, position: "absolute", left: "50%", transform: "translateX(-50%)", pointerEvents: scrollY > 100 ? "auto" : "none" }}>
          <span
            className="truncate max-w-[160px]"
            style={{ color: "#2d3028", fontSize: 13, fontWeight: 700, fontFamily: "Manrope, sans-serif" }}
          >
            {product.name}
          </span>
          {healthGrade ? (
            <span style={{ fontSize: 10, fontWeight: 800, borderRadius: 6, padding: "2px 6px", background: GRADE_BACKGROUNDS[healthGrade], color: GRADE_COLORS[healthGrade], flexShrink: 0 }}>
              {healthGrade}
            </span>
          ) : null}
          {ecoGrade ? (
            <span style={{ fontSize: 10, fontWeight: 800, borderRadius: 6, padding: "2px 6px", background: GRADE_BACKGROUNDS[ecoGrade], color: GRADE_COLORS[ecoGrade], flexShrink: 0 }}>
              {ecoGrade}
            </span>
          ) : null}
        </div>
        <span style={{ opacity: scrollY > 100 ? Math.max(0, 1 - (scrollY - 100) / 60) : 1, transition: "opacity 0.2s linear", color: MUTED, fontFamily: "Manrope, sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {t('scan_result', lang)}
        </span>
        <div className="h-10 w-10" aria-hidden="true" />
      </div>

      {/* ── HERO — glass blur ────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0"
        style={{
          position: "relative",
          minHeight: heroHeight,
          opacity: heroOpacity,
          overflow: "hidden",
          transition: "opacity 0.1s linear",
          willChange: "opacity",
          background: "linear-gradient(135deg, #f0ece0 0%, #fff 45%, #eaf3e8 100%)",
        }}
      >
        {/* Ambient glow blobs */}
        <div style={{ position: "absolute", top: -20, left: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(74,140,92,.25)", filter: "blur(36px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -20, right: -20, width: 110, height: 110, borderRadius: "50%", background: "rgba(244,162,97,.2)", filter: "blur(30px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, right: 20, width: 70, height: 70, borderRadius: "50%", background: "rgba(74,140,92,.14)", filter: "blur(22px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: 20, width: 60, height: 60, borderRadius: "50%", background: "rgba(200,220,160,.18)", filter: "blur(20px)", pointerEvents: "none" }} />

        {/* Frosted glass inner frame */}
        <div style={{ position: "absolute", inset: 8, borderRadius: 20, border: "1px solid rgba(255,255,255,.75)", background: "rgba(255,255,255,.22)", pointerEvents: "none" }} />

        {/* Ground shadow */}
        <div style={{ position: "absolute", left: "20%", right: "20%", bottom: 48, height: 14, borderRadius: "50%", background: "rgba(0,0,0,.14)", filter: "blur(8px)", pointerEvents: "none" }} />

        {/* Product image / emoji */}
        {product.displayImage ? (
          <img
            src={product.displayImage}
            alt={product.name}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -55%)",
              maxHeight: "80%",
              maxWidth: "40%",
              objectFit: "contain",
              filter: "drop-shadow(0 12px 20px rgba(16,21,18,.2))",
              zIndex: 1,
            }}
          />
        ) : (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -60%)", fontSize: 52, lineHeight: 1, zIndex: 1 }}>
            {product.placeholderEmoji}
          </div>
        )}

        {/* Bottom gradient overlay */}
        <div
          style={{
            position: "absolute",
            insetInline: 0,
            bottom: 0,
            height: "60%",
            background: "linear-gradient(to top, rgba(10,25,10,.92) 0%, rgba(10,25,10,.5) 40%, transparent 100%)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />

        {/* Product text overlay */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 16px 12px", zIndex: 3 }}>
          <div style={{ marginBottom: 4 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "rgba(0,0,0,.35)",
                border: "1px solid rgba(255,255,255,.25)",
                borderRadius: 20,
                padding: "2px 8px",
                fontSize: 11,
                color: "rgba(255,255,255,.95)",
              }}
            >
              {product.norwegianDataStatus === "kassalapp" ? t('product_store_data', lang) : t('product_limited_data', lang)}
            </span>
          </div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: "white",
              fontFamily: "Satoshi, sans-serif",
              textShadow: "0 1px 8px rgba(0,0,0,.4)",
              lineHeight: 1.2,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {product.name}
          </h2>
          {product.brand ? (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", marginTop: 2 }}>{product.brand}</p>
          ) : null}
        </div>
      </div>

      {/* ── GRADES ──────────────────────────────────────────────────────── */}
      <div ref={gradeHelpRef} className="relative mx-4 flex-shrink-0" style={{ display: "flex", gap: 12, opacity: gradesOpacity, overflow: "hidden", maxHeight: scrollY > 160 ? 0 : 500, transition: "max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s linear", willChange: "opacity, max-height", marginTop: scrollY > 160 ? 0 : 12, paddingTop: scrollY > 160 ? 0 : undefined }}>

        {/* Health card */}
        <div style={{ flex: 1, background: CARD_BG, borderRadius: 16, border: `0.5px solid ${CARD_BORDER}`, padding: "14px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ width: 68, height: 68, borderRadius: "50%", border: `2.5px solid ${getGradeBorder(healthGrade)}`, background: getGradeBackground(healthGrade), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: getColor(healthGrade), fontFamily: "Manrope, sans-serif", lineHeight: 1 }}>
              {healthGrade ?? "–"}
            </span>
            {healthGrade ? (
              <span style={{ fontSize: 7, fontWeight: 700, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.04em", color: getColor(healthGrade), lineHeight: 1 }}>
                {gradeDescriptions[healthGrade]}
              </span>
            ) : null}
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "Manrope, sans-serif" }}>
            {t('product_health', lang)}
          </span>
        </div>

        {/* Eco card */}
        <div style={{ flex: 1, background: CARD_BG, borderRadius: 16, border: `0.5px solid ${CARD_BORDER}`, padding: "14px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: hasOfficialEcoData ? 1 : 0.4 }}>
          <div style={{ width: 68, height: 68, borderRadius: "50%", border: hasOfficialEcoData ? `2.5px solid ${getGradeBorder(ecoGrade)}` : `2px dashed ${CARD_BORDER}`, background: hasOfficialEcoData ? getGradeBackground(ecoGrade) : CARD_BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: hasOfficialEcoData ? getColor(ecoGrade) : MUTED, fontFamily: "Manrope, sans-serif", lineHeight: 1 }}>
              {ecoGrade ?? "–"}
            </span>
            {ecoGrade ? (
              <span style={{ fontSize: 7, fontWeight: 700, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.04em", color: getColor(ecoGrade), lineHeight: 1 }}>
                {gradeDescriptions[ecoGrade]}
              </span>
            ) : null}
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "Manrope, sans-serif" }}>
            {t('product_eco', lang)}
          </span>
        </div>

        {/* Info button */}
        <button
          ref={gradeHelpButtonRef}
          type="button"
          aria-label="Explain grades"
          aria-expanded={gradeHelpOpen}
          onClick={() => setGradeHelpOpen((open) => !open)}
          style={{ position: "absolute", right: 6, top: 6, width: 28, height: 28, borderRadius: "50%", background: PAGE_BG, border: `1px solid ${CARD_BORDER}`, color: MUTED, display: "grid", placeItems: "center", cursor: "pointer" }}
        >
          <Info className="h-3.5 w-3.5" />
        </button>

        {/* Grade help popover */}
        {gradeHelpOpen ? (
          <div
            style={{ position: "absolute", right: 8, top: 40, zIndex: 30, width: "min(18rem, calc(100vw - 3rem))", background: CARD_BG, borderRadius: 16, border: `0.5px solid ${CARD_BORDER}`, padding: 16, boxShadow: "0 18px 60px rgba(50,42,31,0.15)", textAlign: "left" }}
          >
            <p style={{ fontSize: 9, fontWeight: 700, color: "#2d4a26", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12, fontFamily: "Manrope, sans-serif" }}>
              {t('product_how_grades_work', lang)}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 13, color: "#5a4a38" }}>
                <span style={{ fontWeight: 700, color: "#1e1e18" }}>{t('product_health', lang)}: </span>
                {getHealthGradeBasis(product, Boolean(healthGrade))}
              </p>
              <p style={{ fontSize: 13, color: "#5a4a38" }}>
                <span style={{ fontWeight: 700, color: "#1e1e18" }}>{t('product_eco', lang)}: </span>
                {getEcoGradeBasis(hasOfficialEcoData)}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── SCROLLABLE CONTENT ──────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-1"
        style={{ scrollBehavior: "auto", WebkitOverflowScrolling: "touch" }}
      >

        {/* 2. PROCESSING LEVEL */}
        {product.novaGroup ? (
          <div className="mb-4 flex flex-col gap-2.5">
            <SectionLabel>{t('product_processing', lang)}</SectionLabel>
            {isPremium ? (
              <div style={{ background: CARD_BG, borderRadius: 14, border: `0.5px solid ${CARD_BORDER}`, padding: "12px 14px" }}>
                {/* Top row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: NOVA_TONES[product.novaGroup]?.text ?? MUTED }}>{novaLabels[product.novaGroup]}</p>
                    <p style={{ fontSize: 8, color: MUTED, marginTop: 2 }}>NOVA {product.novaGroup} · {novaLabels[product.novaGroup]}</p>
                  </div>
                  <div style={{ background: NOVA_TONES[product.novaGroup]?.bg ?? CARD_BG, border: `0.5px solid ${NOVA_TONES[product.novaGroup]?.border ?? CARD_BORDER}`, borderRadius: 10, padding: "5px 10px", textAlign: "center" }}>
                    <p style={{ fontSize: 7, fontWeight: 700, color: NOVA_TONES[product.novaGroup]?.text ?? MUTED }}>NOVA</p>
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
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  {novaSegmentLabels.map((label, index) => (
                    <span
                      key={label}
                      style={{
                        fontSize: 7,
                        color:
                          product.novaGroup === index + 1
                            ? NOVA_TONES[product.novaGroup]?.text
                            : "#9a8e7e",
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
              <PremiumNudge label={t('product_processing', lang)} />
            )}
          </div>
        ) : null}

        {/* 3. ALLERGENS */}
        <div className="mb-4 flex flex-col gap-2.5">
          <SectionLabel>{t('product_allergens', lang)}</SectionLabel>
          {!isPremium ? (
            <PremiumNudge label={t('product_allergens', lang)} />
          ) : product.allergens.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
              {product.allergens.map((a) => (
                <div
                  key={a}
                  style={{ background: CARD_BG, borderRadius: 12, border: `0.5px solid ${CARD_BORDER}`, padding: "8px 10px", display: "flex", alignItems: "center", gap: 7 }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{getAllergenEmoji(a)}</span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: "#3a2820", lineHeight: 1.2 }}>{a}</p>
                    <p style={{ fontSize: 8, color: "#9a8e7e", marginTop: 2 }}>{t('product_contains', lang)} {a.toLowerCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: "#ddeedd", borderRadius: 12, border: "0.5px solid #88bb88", padding: "10px 12px" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#2a5030" }}>{t('product_no_allergens', lang)}</p>
            </div>
          )}
        </div>

        {/* 4. NUTRITION PER 100G */}
        {nutritionRows.length > 0 && (
          <div className="mb-4 flex flex-col gap-2.5">
            <SectionLabel>{t('product_nutrition', lang)}</SectionLabel>
            <div style={{ background: CARD_BG, borderRadius: 14, border: `0.5px solid ${CARD_BORDER}`, overflow: "hidden" }}>
              {nutritionRows.map((row, index) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between px-4 py-3"
                  style={index < nutritionRows.length - 1 ? { borderBottom: `1px solid ${CARD_BORDER}` } : undefined}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1e1e18" }}>{row.label}</span>
                  <span className={`rounded-full px-3 py-0.5 font-bold ${row.tone}`} style={{ fontSize: 12 }}>
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
            <PremiumNudge label={t('product_daily_impact', lang)} />
          )}
        </div>

        {/* 6. ADDITIVES */}
        <div className="mb-4 flex flex-col gap-2.5">
          <SectionLabel>{t('product_additives', lang)}</SectionLabel>
          {isPremium ? (
            <Additives additives={product.additives} lang={lang} />
          ) : (
            <PremiumNudge label={t('product_additives', lang)} />
          )}
        </div>

        {/* 7. KEY INSIGHTS */}
        {insights.length > 0 && (
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

        {/* 8. INGREDIENTS */}
        {(ingredients != null || !isPremium) && (
          <div className="mb-4 flex flex-col gap-2.5">
            <SectionLabel>{t('product_ingredients', lang)}</SectionLabel>
            {!isPremium ? (
              <PremiumNudge label={t('product_ingredients', lang)} />
            ) : ingredients ? (
              <div style={{ background: CARD_BG, borderRadius: 14, border: `0.5px solid ${CARD_BORDER}`, padding: "12px 14px" }}>
                <p style={{ fontSize: 13, color: "#5a4a38", lineHeight: 1.6 }}>{ingredients}</p>
              </div>
            ) : null}
          </div>
        )}

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
          style={{ background: PAGE_BG, color: "#2d4a26", border: `1px solid ${CARD_BORDER}` }}
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
              ? { background: "#ddeedd", color: "#2a5030", border: "1px solid #88bb88" }
              : { background: "#2d4a26", color: "#dceedd" }
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
