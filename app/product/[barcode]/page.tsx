"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Barcode, ChevronDown, CircleHelp, Leaf, MapPin, Package, RotateCcw, Share2, ShoppingBag, Tags } from "lucide-react";
import { Additives } from "@/components/Additives";
import { AppHeader } from "@/components/AppHeader";
import { DailyIntake } from "@/components/DailyIntake";
import { NovaScore } from "@/components/NovaScore";
import { ScoreBadge, gradeDescriptions } from "@/components/ScoreBadge";
import { getEcoGrade, getNutritionGrade, scoreToGrade } from "@/lib/ecoscore";
import { calculateHealthGrade, hasNokkelhullLabel, nutritionDataFromKassalapp } from "@/lib/healthscore";
import { getProductEmoji } from "@/lib/kassalapp";
import { cacheProductLocally, readLocalProduct } from "@/lib/localProducts";
import { supabase } from "@/lib/supabase";
import type { GradeLetter, ProductResult } from "@/lib/types";

type ProductPageProps = {
  params: {
    barcode: string;
  };
};

type ProductError = {
  message: string;
  type: "not-found" | "retry";
};

const productLoadingMessages = ["Checking product data...", "Checking ingredients...", "Building Skaren grade...", "Analyzing nutrition..."];

function ProductLoadingState({ barcode }: { barcode: string }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex((index) => (index + 1) % productLoadingMessages.length);
    }, 1050);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.99 }}
      transition={{ type: "spring", stiffness: 160, damping: 25 }}
      className="mt-3 overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-glass backdrop-blur-2xl"
    >
      <div className="rounded-[1.7rem] bg-gradient-to-br from-cream via-white to-leaf-100 p-5">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-forest text-cream shadow-phone scan-glow">
          <Barcode className="h-12 w-12" />
        </div>
        <p className="mt-5 text-center text-xs font-black uppercase tracking-[0.18em] text-forest">Product report</p>
        <h1 className="mt-2 text-center text-2xl font-black tracking-[-0.04em] text-ink">{productLoadingMessages[messageIndex]}</h1>
        <p className="mt-2 text-center text-sm font-semibold text-soil-600">Barcode {barcode}</p>

        <div className="mt-6 overflow-hidden rounded-full bg-white">
          <div className="scan-progress-line h-2 rounded-full bg-forest" />
        </div>

        <div className="mt-6 grid gap-3">
          <div className="skeleton-shimmer h-48 rounded-[1.5rem] bg-white/80" />
          <div className="grid grid-cols-[5rem_1fr] gap-3">
            <div className="skeleton-shimmer h-20 rounded-[1.25rem] bg-white/80" />
            <div className="space-y-3">
              <div className="skeleton-shimmer h-5 rounded-full bg-white/80" />
              <div className="skeleton-shimmer h-5 w-2/3 rounded-full bg-white/80" />
              <div className="skeleton-shimmer h-9 rounded-full bg-white/80" />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function withProductDefaults(product: ProductResult): ProductResult {
  const productWithDefaults = {
    ...product,
    displayImage: product.displayImage ?? null,
    displayImageSource: product.displayImageSource ?? "placeholder",
    placeholderEmoji: product.placeholderEmoji ?? "🌿",
    norwegianDataStatus: product.norwegianDataStatus ?? "limited",
    storePrices: product.storePrices ?? [],
    currentPrice: product.currentPrice ?? null,
    store: product.store ?? null,
    allergens: product.allergens ?? [],
    labels: product.labels ?? [],
    kassalappCategories: product.kassalappCategories ?? [],
    kassalappNutrition: product.kassalappNutrition ?? [],
    additives: product.additives ?? [],
    novaGroup: product.novaGroup ?? null,
    hasNokkelhull: product.hasNokkelhull ?? hasNokkelhullLabel(product.labels ?? []),
    aiSummary: product.aiSummary ?? []
  };

  return {
    ...productWithDefaults,
    ecoGradeLetter: product.ecoGradeLetter ?? getEcoGrade(productWithDefaults),
    nutritionGradeLetter: product.nutritionGradeLetter ?? getNutritionGrade(productWithDefaults),
    healthGrade: product.healthGrade ?? calculateHealthGrade({
      nutrition: nutritionDataFromKassalapp(productWithDefaults.kassalappNutrition),
      labels: productWithDefaults.labels,
      category: productWithDefaults.categories
    })
  };
}

function NorwayDataBadge({ status }: { status: ProductResult["norwegianDataStatus"] }) {
  return status === "kassalapp" ? (
    <span className="inline-flex rounded-full bg-lime-100 px-3 py-1 text-xs font-black text-lime-800">✓ Store data available</span>
  ) : (
    <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">⚠ Limited store data</span>
  );
}

function ProductStoreDetails({ product }: { product: ProductResult }) {
  const hasStore = Boolean(product.store?.name || product.currentPrice);
  const visibleLabels = product.labels.slice(0, 3);

  if (!hasStore && visibleLabels.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      {hasStore ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-soil-50 p-3">
          <div className="flex min-w-0 items-center gap-3">
            {product.store?.logo ? (
              <img src={product.store.logo} alt={`${product.store.name} logo`} className="h-9 w-9 shrink-0 rounded-full bg-white object-contain p-1" />
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-ink">{product.store?.name ?? "Store"}</p>
            </div>
          </div>
          {product.currentPrice !== null ? (
            <span className="shrink-0 rounded-full bg-lime-100 px-3 py-1 text-sm font-black text-lime-800">
              {product.currentPrice.toFixed(2)} NOK
            </span>
          ) : null}
        </div>
      ) : null}

      {visibleLabels.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {visibleLabels.map((label) => (
            <span key={label} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
              {label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProductVisual({ product }: { product: ProductResult }) {
  const emoji = getProductEmoji(`${product.name} ${product.brand} ${product.categories}`) || product.placeholderEmoji;

  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 125, damping: 24 }}
      className="group relative min-h-[22rem] w-full max-w-full overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-cream via-white to-leaf-100 p-5 shadow-phone sm:min-h-[34rem] sm:rounded-[2.25rem] md:h-full md:min-h-[38rem] md:p-6"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(255,255,255,0.95),transparent_30%),radial-gradient(circle_at_20%_15%,rgba(82,183,136,0.22),transparent_26%),radial-gradient(circle_at_88%_82%,rgba(244,162,97,0.16),transparent_28%)]" />
      <div className="absolute inset-x-8 top-[18%] h-[48%] rounded-full bg-forest/10 blur-3xl" />
      <div className="absolute inset-x-12 bottom-24 h-16 rounded-full bg-black/15 blur-2xl" />
      <div className="absolute inset-3 rounded-[1.5rem] border border-white/70 bg-white/25 backdrop-blur-[1px] sm:inset-4 sm:rounded-[2rem]" />
      <div className="absolute inset-0 opacity-70 transition duration-700 group-hover:opacity-90">
        <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-leaf-200/25 blur-3xl" />
        <div className="absolute -bottom-16 right-0 h-72 w-72 rounded-full bg-white/50 blur-3xl" />
      </div>

      {product.displayImage ? (
        <>
          <div className="absolute inset-x-5 top-6 flex h-[55%] items-center justify-center sm:inset-x-8 sm:top-10 sm:h-[62%]">
            <img
              alt={`${product.name} product packaging`}
              className="max-h-full max-w-full object-contain object-center drop-shadow-[0_28px_34px_rgba(16,21,18,0.28)] transition duration-700 group-hover:scale-[1.025]"
              fetchPriority="high"
              src={product.displayImage}
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/72 via-ink/20 to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <div className="grid h-56 w-56 place-items-center rounded-[2.5rem] border border-white/30 bg-white/15 text-8xl shadow-phone backdrop-blur-md transition duration-700 group-hover:scale-105">
            {emoji}
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-7">
        <h2 className="font-display line-clamp-2 break-words text-[2rem] font-black leading-[0.95] tracking-[-0.055em] text-white drop-shadow [overflow-wrap:anywhere] sm:text-5xl md:text-6xl">{product.name}</h2>
        <p className="mt-2 text-base font-semibold text-white/75 sm:mt-3 sm:text-lg">{product.brand || "Brand not listed"}</p>
      </div>
    </motion.div>
  );
}

function findNutrition(product: ProductResult, terms: string[]) {
  return product.kassalappNutrition.find((entry) => {
    const text = `${entry.code} ${entry.displayName}`.toLowerCase();
    return terms.some((term) => text.includes(term));
  }) ?? null;
}

function normalizeCalories(amount: number, unit: string) {
  return unit.toLowerCase().includes("kj") ? amount / 4.184 : amount;
}

function getFactTone(label: string, amount: number) {
  if (label === "Calories") {
    if (amount < 150) return "bg-emerald-50 text-emerald-800 border-emerald-100";
    if (amount <= 400) return "bg-amber-50 text-amber-800 border-amber-100";
    return "bg-rose-50 text-rose-800 border-rose-100";
  }

  if (label === "Sugar") {
    if (amount < 5) return "bg-emerald-50 text-emerald-800 border-emerald-100";
    if (amount <= 15) return "bg-amber-50 text-amber-800 border-amber-100";
    return "bg-rose-50 text-rose-800 border-rose-100";
  }

  if (label === "Fat") {
    if (amount < 5) return "bg-emerald-50 text-emerald-800 border-emerald-100";
    if (amount <= 17) return "bg-amber-50 text-amber-800 border-amber-100";
    return "bg-rose-50 text-rose-800 border-rose-100";
  }

  if (label === "Protein") {
    if (amount >= 15) return "bg-emerald-50 text-emerald-800 border-emerald-100";
    if (amount >= 8) return "bg-amber-50 text-amber-800 border-amber-100";
    return "bg-soil-50 text-soil-700 border-soil-100";
  }

  if (amount < 0.3) return "bg-emerald-50 text-emerald-800 border-emerald-100";
  if (amount <= 1.5) return "bg-amber-50 text-amber-800 border-amber-100";
  return "bg-rose-50 text-rose-800 border-rose-100";
}

function getQuickFacts(product: ProductResult) {
  const facts = [
    { label: "Calories", entry: findNutrition(product, ["energy", "energi", "calories", "calorie", "kcal", "kj"]) },
    { label: "Sugar", entry: findNutrition(product, ["sugars", "sugar", "sukker", "sukkerarter"]) },
    { label: "Fat", entry: findNutrition(product, ["fat", "fett"]) },
    { label: "Protein", entry: findNutrition(product, ["protein", "proteins"]) },
    { label: "Salt", entry: findNutrition(product, ["salt"]) }
  ];

  return facts.map((fact) => {
    if (!fact.entry) return null;

    const amount = fact.label === "Calories" ? normalizeCalories(fact.entry.amount, fact.entry.unit) : fact.entry.amount;
    const value = fact.label === "Calories"
      ? `${Math.round(amount)} kcal`
      : `${Number.isInteger(fact.entry.amount) ? fact.entry.amount : fact.entry.amount.toFixed(1)}${fact.entry.unit ? ` ${fact.entry.unit}` : ""}`;

    return {
      label: fact.label,
      value,
      tone: getFactTone(fact.label, amount)
    };
  }).filter((fact): fact is { label: string; value: string; tone: string } => Boolean(fact));
}

function hasEcoSignal(product: ProductResult) {
  return product.ecoGrade !== "unknown"
    || product.packaging !== "Packaging info unavailable"
    || product.origins !== "Origin unknown"
    || product.categories !== "General Product";
}

function hasNutritionSignal(product: ProductResult) {
  const nutri = product.nutriGrade.toLowerCase();
  return ["a", "b", "c", "d", "e"].includes(nutri) || product.kassalappNutrition.length > 0 || product.norwegianDataStatus === "kassalapp";
}

function gradeToScore(grade: GradeLetter) {
  return { A: 90, B: 75, C: 55, D: 35, E: 15 }[grade];
}

function getOverallSkarenGrade(healthGrade: GradeLetter | null, ecoGrade: GradeLetter | null) {
  if (healthGrade && ecoGrade) return scoreToGrade(Math.round((gradeToScore(healthGrade) + gradeToScore(ecoGrade)) / 2));
  return healthGrade ?? ecoGrade;
}

function getHealthGradeReason(product: ProductResult, grade: GradeLetter | null) {
  if (!grade) return "Health grade needs product nutrition data or an official Nutri-Score.";
  if (product.hasNokkelhull) return "Based on nutrition data and the Norwegian Nøkkelhull healthy-choice label.";
  if (product.kassalappNutrition.length > 0) return "Based on sugar, salt, fat, protein, fiber, calories, and available allergens.";
  return "Based on the official Nutri-Score from Open Food Facts.";
}

function getEcoGradeReason(product: ProductResult, grade: GradeLetter | null) {
  if (!grade) return "Environmental grade needs official Eco-Score, packaging, origin, or category data.";
  if (product.ecoGrade !== "unknown") return "Based on the official Open Food Facts Eco-Score for this product.";
  return "Estimated from available packaging, origin, product category, and ingredient signals.";
}

function getOverallGradeReason(healthGrade: GradeLetter | null, ecoGrade: GradeLetter | null) {
  if (healthGrade && ecoGrade) return "Combines the health grade and environmental grade into one simple Skaren view.";
  if (healthGrade) return "Uses the health grade because environmental data is limited for this product.";
  if (ecoGrade) return "Uses the environmental grade because nutrition data is limited for this product.";
  return "Not enough product data to calculate a reliable Skaren grade yet.";
}

function ProductGradeCard({ product }: { product: ProductResult }) {
  const [showExplanation, setShowExplanation] = useState(false);
  const ecoGrade = hasEcoSignal(product) ? product.ecoGradeLetter ?? getEcoGrade(product) : null;
  const healthGrade = hasNutritionSignal(product) ? product.healthGrade : null;
  const overallGrade = getOverallSkarenGrade(healthGrade, ecoGrade);
  const facts = getQuickFacts(product);
  const overallExplanation = overallGrade
    ? `${gradeDescriptions[overallGrade]} overall profile. ${getOverallGradeReason(healthGrade, ecoGrade)}`
    : getOverallGradeReason(healthGrade, ecoGrade);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 150, damping: 24, delay: 0.05 }}
      className="rounded-[1.65rem] border border-black/5 bg-white p-5 shadow-soft sm:rounded-[2rem] sm:p-6"
    >
      <div className="relative flex flex-col items-center text-center">
        <button
          type="button"
          onClick={() => setShowExplanation((open) => !open)}
          aria-label="How Skaren grades are calculated"
          className={`absolute right-0 top-0 grid h-11 w-11 place-items-center rounded-full transition ${showExplanation ? "bg-forest text-white" : "bg-soil-50 text-soil-600"}`}
        >
          <CircleHelp className="h-5 w-5" />
        </button>
        <ScoreBadge grade={overallGrade} label="SKAREN GRADE" size="lg" />
        {showExplanation ? (
          <div className="mt-4 w-full rounded-3xl border border-leaf-100 bg-leaf-50 p-4 text-left shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-forest">How this grade works</p>
            <p className="mt-2 text-[0.95rem] font-semibold leading-6 text-soil-700">{overallExplanation}</p>
            <div className="mt-3 grid gap-2">
              <div className="rounded-2xl bg-white p-3">
                <p className="text-sm font-black text-ink">Health grade</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-soil-600">{getHealthGradeReason(product, healthGrade)}</p>
              </div>
              <div className="rounded-2xl bg-white p-3">
                <p className="text-sm font-black text-ink">Environmental grade</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-soil-600">{getEcoGradeReason(product, ecoGrade)}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="my-5 h-px bg-black/5 sm:my-6" />

      <div className="grid gap-2.5 sm:gap-3">
        <div className="rounded-2xl border border-black/5 bg-white p-4 text-center shadow-sm">
          <ScoreBadge grade={healthGrade} label="🥗 Health" />
          {product.hasNokkelhull ? (
            <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
              🔑 Nøkkelhull certified
            </span>
          ) : null}
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-4 text-center shadow-sm">
          <ScoreBadge grade={ecoGrade} label="🌍 Environmental" />
        </div>
      </div>

      {facts.length > 0 ? (
          <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 sm:mt-5">
          {facts.map((fact) => (
            <div key={fact.label} className={`min-h-11 min-w-fit rounded-full border px-4 py-2 ${fact.tone}`}>
              <p className="text-[0.94rem] font-black leading-5">{fact.label}</p>
              <p className="mt-0.5 whitespace-nowrap text-base font-black">{fact.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </motion.section>
  );
}

function inferProductCategory(product: ProductResult) {
  const text = `${product.name} ${product.brand} ${product.categories}`.toLowerCase();
  const rawCategory = product.categories === "General Product" ? "" : product.categories;

  if (text.includes("vegetar") && (text.includes("pølse") || text.includes("polse") || text.includes("sausage"))) return "Plant-based sausages";
  if (text.includes("pølse") || text.includes("polse") || text.includes("sausage")) return "Sausages";
  if (text.includes("sjokolade") || text.includes("chocolate")) return "Chocolate";
  if (text.includes("melk") || text.includes("milk")) return "Milk & dairy";
  if (text.includes("chips") || text.includes("potetgull")) return "Snacks";

  return rawCategory || "General grocery item";
}

function getNutriSignal(product: ProductResult) {
  const grade = product.nutriGrade.toLowerCase();

  if (grade === "not rated" || grade === "unknown") {
    return {
      value: "Not rated",
      tone: "bg-soil-100 text-soil-700",
      note: "No official Nutri-Score was available, so nutrition has a neutral impact in the estimate."
    };
  }

  const gradeLabel = grade.toUpperCase();
  const notes: Record<string, string> = {
    a: "Strong nutrition profile compared with similar products.",
    b: "Good nutrition profile, with some room for improvement.",
    c: "Middle-of-the-road nutrition profile.",
    d: "Lower nutrition quality affects the estimate.",
    e: "Poor nutrition profile strongly lowers the estimate."
  };

  return {
    value: `Nutri-Score ${gradeLabel}`,
    tone: grade === "a" || grade === "b" ? "bg-lime-100 text-lime-800" : grade === "c" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-700",
    note: notes[grade] ?? "Nutrition data was available for this product."
  };
}

function getPackagingSignal(product: ProductResult) {
  if (product.packaging === "Packaging info unavailable") {
    return {
      value: "Not listed",
      tone: "bg-soil-100 text-soil-700",
      note: "Packaging data is missing, so Skaren uses a neutral packaging assumption."
    };
  }

  const packaging = product.packaging.toLowerCase();
  const impact = packaging.includes("plastic")
    ? "Plastic packaging can lower the score."
    : packaging.includes("glass") || packaging.includes("paper") || packaging.includes("cardboard")
      ? "This packaging type is usually easier to recycle."
      : "Packaging was included in the estimate.";

  return {
    value: product.packaging,
    tone: packaging.includes("plastic") ? "bg-rose-100 text-rose-700" : "bg-lime-100 text-lime-800",
    note: impact
  };
}

function getOriginSignal(product: ProductResult) {
  if (product.origins === "Origin unknown") {
    return {
      value: "Unknown",
      tone: "bg-soil-100 text-soil-700",
      note: "Origin data is missing, so transport impact is estimated conservatively."
    };
  }

  const origins = product.origins.split(",").map((origin) => origin.trim()).filter(Boolean);

  return {
    value: product.origins,
    tone: origins.length > 2 ? "bg-amber-100 text-amber-800" : "bg-lime-100 text-lime-800",
    note: origins.length > 2
      ? "Multiple listed origins may mean more complex transport."
      : "Fewer listed origins can mean simpler transport."
  };
}

function ProductSignals({ product }: { product: ProductResult }) {
  const category = inferProductCategory(product);
  const nutri = getNutriSignal(product);
  const packaging = getPackagingSignal(product);
  const origin = getOriginSignal(product);
  const signals = [
    {
      label: "Product type",
      value: category,
      note: category === "General grocery item" ? "Skaren could not identify a precise category from the available data." : "Used to understand the product type.",
      icon: Tags,
      tone: "bg-leaf-50 text-forest"
    },
    {
      label: "Nutrition",
      value: nutri.value,
      note: nutri.note,
      icon: Leaf,
      tone: nutri.tone
    },
    {
      label: "Packaging",
      value: packaging.value,
      note: packaging.note,
      icon: Package,
      tone: packaging.tone
    },
    {
      label: "Origin",
      value: origin.value,
      note: origin.note,
      icon: MapPin,
      tone: origin.tone
    },
    {
      label: "Barcode",
      value: product.barcode,
      note: "This is the unique product ID used to look up store and eco data.",
      icon: Barcode,
      tone: "bg-soil-100 text-soil-700",
      secondary: true
    }
  ];

  return (
    <section className="mt-4 rounded-[1.75rem] border border-white/70 bg-white/85 p-4 shadow-glass backdrop-blur-xl sm:mt-5 sm:rounded-[2rem] sm:p-5">
      <div className="mb-3 flex items-end justify-between gap-4 sm:mb-4">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-leaf-600 sm:text-xs">Product signals</p>
          <h2 className="font-display mt-1 text-2xl font-black tracking-[-0.04em] text-ink">What we know</h2>
        </div>
        <span className="hidden rounded-full bg-soil-50 px-3 py-1 text-xs font-bold text-soil-600 sm:inline-flex">
          Used in the Skaren estimate
        </span>
      </div>

      <div className="grid gap-2.5 sm:gap-3 md:grid-cols-2 xl:grid-cols-5">
        {signals.map((signal) => {
          const Icon = signal.icon;

          return (
            <div key={signal.label} className={`${"secondary" in signal ? "hidden sm:block" : ""} rounded-[1.25rem] border border-black/5 bg-white p-3 shadow-sm sm:p-4`}>
              <div className="flex gap-3 sm:block">
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-2xl sm:mb-3 sm:h-10 sm:w-10 ${signal.tone}`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.67rem] font-black uppercase tracking-[0.12em] text-soil-600 sm:text-xs">{signal.label}</p>
                  <p className="mt-1 line-clamp-1 text-sm font-black leading-5 text-ink sm:mt-2 sm:line-clamp-2 sm:text-lg sm:leading-6">{signal.value}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-soil-600 sm:mt-2 sm:text-sm sm:leading-6">{signal.note}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function formatNutritionAmount(amount: number, unit: string) {
  const formatted = Number.isInteger(amount) ? String(amount) : amount.toFixed(1);
  return `${formatted}${unit ? ` ${unit}` : ""}`;
}

function findNutritionForRow(product: ProductResult, matches: string[], excludes: string[] = [], preferredUnits: string[] = []) {
  const candidates = product.kassalappNutrition.filter((entry) => {
    if (entry.amount === 0) return false;

    const text = `${entry.code} ${entry.displayName}`.toLowerCase();
    const isMatch = matches.some((match) => text.includes(match));
    const isExcluded = excludes.some((exclude) => text.includes(exclude));

    return isMatch && !isExcluded;
  });

  return preferredUnits.length > 0
    ? candidates.find((entry) => preferredUnits.some((unit) => entry.unit.toLowerCase().includes(unit))) ?? candidates[0] ?? null
    : candidates[0] ?? null;
}

function getNutritionValueTone(label: string, amount: number) {
  if (label === "Calories") {
    if (amount < 150) return "bg-emerald-50 text-emerald-800";
    if (amount <= 400) return "bg-amber-50 text-amber-800";
    return "bg-rose-50 text-rose-800";
  }

  if (label === "Sugars") {
    if (amount < 5) return "bg-emerald-50 text-emerald-800";
    if (amount <= 15) return "bg-amber-50 text-amber-800";
    return "bg-rose-50 text-rose-800";
  }

  if (label === "Fat") {
    if (amount < 5) return "bg-emerald-50 text-emerald-800";
    if (amount <= 17) return "bg-amber-50 text-amber-800";
    return "bg-rose-50 text-rose-800";
  }

  if (label === "Saturated fat") {
    if (amount < 1.5) return "bg-emerald-50 text-emerald-800";
    if (amount <= 5) return "bg-amber-50 text-amber-800";
    return "bg-rose-50 text-rose-800";
  }

  if (label === "Salt") {
    if (amount < 0.3) return "bg-emerald-50 text-emerald-800";
    if (amount <= 1.5) return "bg-amber-50 text-amber-800";
    return "bg-rose-50 text-rose-800";
  }

  if (label === "Protein") {
    if (amount > 15) return "bg-emerald-50 text-emerald-800";
    if (amount >= 5) return "bg-amber-50 text-amber-800";
    return "bg-soil-100 text-soil-700";
  }

  if (label === "Fiber") {
    if (amount >= 6) return "bg-emerald-50 text-emerald-800";
    if (amount >= 3) return "bg-amber-50 text-amber-800";
    return "bg-soil-100 text-soil-700";
  }

  return "bg-soil-100 text-soil-700";
}

function getNutritionRows(product: ProductResult) {
  const wanted = [
    { label: "Calories", matches: ["energy", "energi", "calories", "calorie", "kcal", "kj"], calories: true, preferredUnits: ["kcal"] },
    { label: "Fat", matches: ["fat", "fett"], excludes: ["saturated", "mettede", "mettet"] },
    { label: "Saturated fat", matches: ["saturated", "mettede", "mettet"] },
    { label: "Carbs", matches: ["carbohydrate", "karbohydrat"] },
    { label: "Sugars", matches: ["sugars", "sugar", "sukker", "sukkerarter"] },
    { label: "Fiber", matches: ["fiber", "fibre", "kostfiber"] },
    { label: "Protein", matches: ["protein", "proteins"] },
    { label: "Salt", matches: ["salt"] }
  ];

  return wanted
    .map((item) => {
      const nutrition = findNutritionForRow(
        product,
        item.matches,
        "excludes" in item ? item.excludes : [],
        "preferredUnits" in item ? item.preferredUnits : []
      );

      if (!nutrition) return null;
      const amount = "calories" in item ? normalizeCalories(nutrition.amount, nutrition.unit) : nutrition.amount;

      return {
        label: item.label,
        amount,
        displayAmount: item.label === "Calories" ? `${Math.round(amount)} kcal` : formatNutritionAmount(nutrition.amount, nutrition.unit),
        tone: getNutritionValueTone(item.label, amount)
      };
    })
    .filter((row): row is { label: string; amount: number; displayAmount: string; tone: string } => Boolean(row));
}

function visibleIngredients(product: ProductResult) {
  const ingredients = product.ingredients.trim();
  if (!ingredients || ingredients === "Ingredients unavailable") return null;
  return ingredients;
}

const insightGoodKeywords = [
  "minimally processed",
  "minimal processing",
  "whole food",
  "whole-food",
  "organic",
  "certified",
  "fairtrade",
  "nokkelhull",
  "nøkkelhull",
  "natural",
  "no additives",
  "no additive",
  "no artificial",
  "simple ingredients",
  "no sugar",
  "no added sugar",
  "low sugar",
  "low salt",
  "low sodium",
  "protein",
  "fiber",
  "fibre",
  "plant-based",
  "plant based",
  "recyclable",
  "sustainable"
];

const insightBadKeywords = [
  "saturated fat",
  "ultra-processed",
  "ultra processed",
  "high sugar",
  "added sugar",
  "additive",
  "additives",
  "preservative",
  "preservatives",
  "avoid",
  "limit",
  "limiting",
  "unhealthy",
  "high salt",
  "high sodium",
  "palm oil",
  "artificial",
  "high fat"
];

function getInsightTone(insight: string) {
  const text = insight.toLowerCase();
  const positive = insightGoodKeywords.some((keyword) => text.includes(keyword));
  const negative = insightBadKeywords.some((keyword) => text.includes(keyword));
  const protectivePositive = [
    "no additives",
    "no additive",
    "no artificial",
    "no sugar",
    "no added sugar",
    "low sugar",
    "low salt",
    "low sodium",
    "simple ingredients",
    "minimally processed",
    "whole food"
  ].some((keyword) => text.includes(keyword));

  if (protectivePositive) return { icon: "✅", className: "border-emerald-200 bg-emerald-50 text-emerald-900" };
  if (negative) return { icon: "⚠️", className: "border-rose-200 bg-rose-50 text-rose-900" };
  if (positive) return { icon: "✅", className: "border-emerald-200 bg-emerald-50 text-emerald-900" };
  return { icon: "ℹ️", className: "border-soil-100 bg-white text-soil-800" };
}

function getKeyInsights(product: ProductResult) {
  const scoredInsights = product.aiSummary
    .map((insight, index) => {
      const text = insight.replace(/^[-•\d.\s]+/, "").trim();
      const lower = text.toLowerCase();
      const tone = getInsightTone(lower);
      const isBad = tone.className.includes("rose");
      const isGood = tone.className.includes("emerald");

      return {
        text,
        priority: isBad ? 0 : isGood ? 1 : 2,
        index
      };
    })
    .filter((insight) => insight.text.length > 0)
    .sort((a, b) => a.priority - b.priority || a.index - b.index);

  return scoredInsights.slice(0, 3).map((insight) => insight.text);
}

function NutritionInsights({ product, isPremium }: { product: ProductResult; isPremium: boolean }) {
  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const nutritionRows = getNutritionRows(product);
  const ingredients = visibleIngredients(product);
  const insights = isPremium ? getKeyInsights(product) : [];
  const hasDetails = nutritionRows.length > 0 || product.allergens.length > 0 || Boolean(ingredients) || insights.length > 0;

  if (!hasDetails) return null;

  return (
    <section className="mt-4 rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-soft sm:mt-5 sm:rounded-[2rem] sm:p-6">
      <div className="mb-4 flex items-center gap-2 text-lime-500 sm:mb-5">
        <ShoppingBag className="h-5 w-5" />
        <h2 className="font-display text-2xl font-black tracking-[-0.04em] text-ink sm:text-xl">Nutrition & Insights</h2>
      </div>

      <div className="grid gap-4">
        {nutritionRows.length > 0 ? (
          <div className="rounded-[1.5rem] border border-black/5 bg-soil-50 p-4 sm:p-5">
            <h3 className="font-black text-soil-900">Nutritional content per 100g</h3>
            <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 bg-white">
              <table className="w-full text-left text-[0.95rem]">
                <tbody className="divide-y divide-black/5">
                  {nutritionRows.map((row) => (
                    <tr key={row.label}>
                      <th className={`px-3 py-3.5 sm:px-4 ${row.label === "Calories" ? "font-black text-ink" : "font-bold text-soil-700"}`}>
                        {row.label}
                      </th>
                      <td className="px-3 py-3.5 text-right sm:px-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-black ${row.tone}`}>
                          {row.displayAmount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <DailyIntake nutrition={product.kassalappNutrition} />

        {insights.length > 0 ? (
          <div className="rounded-[1.5rem] border border-black/5 bg-soil-50 p-4 sm:p-5">
            <h3 className="font-black text-soil-900">Key insights</h3>
            <ul className="mt-3 space-y-2">
              {insights.map((insight) => {
                const tone = getInsightTone(insight);

                return (
                  <li key={insight} className={`flex gap-3 rounded-2xl border p-3 text-[0.95rem] font-semibold leading-6 ${tone.className}`}>
                    <span className="mt-0.5" aria-hidden="true">{tone.icon}</span>
                    <span>{insight}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div className="rounded-[1.5rem] border border-black/5 bg-soil-50 p-4 sm:p-5">
          <h3 className="font-black text-soil-900">Allergens</h3>
          {product.allergens.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {product.allergens.map((allergen) => (
                <span key={allergen} className="min-h-10 rounded-full bg-rose-100 px-4 py-2 text-[0.95rem] font-black text-rose-700">
                  {allergen}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2 text-[0.95rem] font-black text-emerald-700">No major allergens detected</p>
          )}
        </div>

        {ingredients ? (
          <div className="rounded-[1.5rem] border border-black/5 bg-soil-50 p-4 sm:p-5">
            <h3 className="font-black text-soil-900">Ingredients</h3>
            <p className={`mt-3 text-[0.95rem] font-medium leading-7 text-soil-700 ${ingredientsOpen ? "" : "line-clamp-2"}`}>
              {ingredients}
            </p>
            {ingredients.length > 120 ? (
              <button
                type="button"
                onClick={() => setIngredientsOpen((open) => !open)}
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-forest shadow-sm"
              >
                {ingredientsOpen ? "Show less" : "Show more"}
                <ChevronDown className={`h-4 w-4 transition ${ingredientsOpen ? "rotate-180" : ""}`} />
              </button>
            ) : null}
          </div>
        ) : null}

      </div>
    </section>
  );
}

export default function ProductPage({ params }: ProductPageProps) {
  const [product, setProduct] = useState<ProductResult | null>(null);
  const [error, setError] = useState<ProductError | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  async function loadProduct(options: { skipCache?: boolean } = {}) {
    setLoading(true);
    setError(null);

    try {
      if (options.skipCache) {
        sessionStorage.removeItem(`skaren-error:${params.barcode}`);
      }

      const cachedError = sessionStorage.getItem(`skaren-error:${params.barcode}`);
      if (cachedError && !options.skipCache) {
        setProduct(null);
        setError(JSON.parse(cachedError) as ProductError);
        setLoading(false);
        return;
      }

      const cached = sessionStorage.getItem(`skaren:${params.barcode}`);
      if (cached && !options.skipCache) {
        const cachedProduct = withProductDefaults(JSON.parse(cached) as ProductResult);
        const canUseCachedProduct = cachedProduct.displayImageSource === "kassalapp" || !navigator.onLine;

        if (canUseCachedProduct) {
          setProduct(cachedProduct);
          setLoading(false);

          return;
        }
      }

      const localProduct = readLocalProduct(params.barcode);
      if (localProduct && !options.skipCache && !navigator.onLine) {
        setProduct(withProductDefaults(localProduct));
        setLoading(false);
        return;
      }

      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode: params.barcode })
      });
      const data = (await response.json()) as { product?: ProductResult; error?: string; code?: string };

      if (!response.ok || !data.product) {
        setProduct(null);
        setError({
          message:
            data.code === "PRODUCT_NOT_FOUND"
              ? "We couldn't find this product. Try another barcode or check the number is correct."
              : "Something went wrong. Please try again.",
          type: data.code === "PRODUCT_NOT_FOUND" ? "not-found" : "retry"
        });
        return;
      }

      const productWithDefaults = withProductDefaults(data.product);
      sessionStorage.setItem(`skaren:${productWithDefaults.barcode}`, JSON.stringify(productWithDefaults));
      cacheProductLocally(productWithDefaults);
      setProduct(productWithDefaults);
    } catch {
      const localProduct = readLocalProduct(params.barcode);
      if (localProduct) {
        setProduct(withProductDefaults(localProduct));
        setError(null);
      } else {
        setProduct(null);
        setError({ message: "Something went wrong. Please try again.", type: "retry" });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const shouldSkipCache = new URLSearchParams(window.location.search).has("fresh");
    loadProduct({ skipCache: shouldSkipCache });
    // loadProduct intentionally depends only on the route barcode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.barcode]);

  useEffect(() => {
    let active = true;

    async function loadPremiumStatus() {
      const { data: sessionData } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
      const response = sessionData.session?.access_token
        ? await fetch("/api/stripe/premium-status", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionData.session.access_token}`
            }
          }).catch(() => null)
        : null;
      const premiumStatus = (await response?.json().catch(() => null)) as { premium?: boolean } | null;
      if (active) setIsPremium(Boolean(premiumStatus?.premium));
    }

    loadPremiumStatus();

    const listener = supabase?.auth.onAuthStateChange((_event, session) => {
      if (!session?.access_token) {
        setIsPremium(false);
        return;
      }

      void fetch("/api/stripe/premium-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        }
      })
        .then((response) => response.json())
        .then((status: { premium?: boolean }) => setIsPremium(Boolean(status?.premium)))
        .catch(() => setIsPremium(false));
    });

    return () => {
      active = false;
      listener?.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!product || product.displayImage || !product.barcode) return;

    let isMounted = true;

    async function rescueKassalappImage() {
      try {
        const response = await fetch("/api/kassalapp-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barcode: product?.barcode })
        });
        const data = (await response.json()) as { image?: string | null };

        if (!isMounted || !data.image) return;

        setProduct((current) => {
          if (!current || current.barcode !== product?.barcode) return current;

          const updated = withProductDefaults({
            ...current,
            image: data.image ?? current.image,
            displayImage: data.image ?? current.displayImage,
            displayImageSource: "kassalapp"
          });
          sessionStorage.setItem(`skaren:${updated.barcode}`, JSON.stringify(updated));
          cacheProductLocally(updated);

          return updated;
        });
      } catch {
        // The green placeholder remains the designed fallback if Kassalapp has no official image.
      }
    }

    void rescueKassalappImage();

    return () => {
      isMounted = false;
    };
  }, [product]);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <AppHeader />
      <main className="page-fade-up mx-auto w-full max-w-[430px] overflow-x-hidden px-3 pb-48 pt-3 sm:max-w-2xl sm:px-4 sm:py-8 md:max-w-6xl">
        <Link href="/scan" className="tap-feedback inline-flex min-h-10 items-center gap-2 rounded-full px-1 text-sm font-bold text-soil-600 hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          Scan another product
        </Link>

        {loading ? (
          <ProductLoadingState barcode={params.barcode} />
        ) : error ? (
          <div className="mx-auto mt-8 max-w-xl rounded-[2rem] border border-black/5 bg-white p-6 text-center shadow-soft sm:mt-10 sm:p-8">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-rose-600">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-3xl font-black text-ink">{error.type === "not-found" ? "Product not found" : "Scan failed"}</h1>
            <p className="mt-3 leading-7 text-soil-600">{error.message}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {error.type === "retry" ? (
                <button
                  onClick={() => void loadProduct({ skipCache: true })}
                className="focus-ring tap-feedback inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 font-bold text-white shadow-soft"
                >
                  <RotateCcw className="h-5 w-5" />
                  Retry
                </button>
              ) : null}
              <Link
                href="/scan"
                className="focus-ring tap-feedback inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 font-bold text-ink"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to scan
              </Link>
            </div>
          </div>
        ) : product ? (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 1 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.08 }
              }
            }}
          >
            <motion.section
              variants={{
                hidden: { opacity: 0, y: 18, scale: 0.99 },
                show: { opacity: 1, y: 0, scale: 1 }
              }}
              transition={{ type: "spring", stiffness: 120, damping: 24 }}
              className="mt-2 w-full max-w-full overflow-hidden rounded-[1.8rem] border border-white/70 bg-white/72 shadow-glass backdrop-blur-2xl sm:mt-6 sm:rounded-[2.5rem]"
            >
              <div className="grid min-w-0 gap-2.5 p-2 md:grid-cols-[1.05fr_0.95fr] md:gap-5 md:p-5">
                <div className="min-w-0">
                  <ProductVisual product={product} />
                </div>

                <div className="min-w-0 space-y-2.5 md:flex md:min-h-[38rem] md:flex-col md:justify-center md:space-y-3">
                  <ProductGradeCard product={product} />
                  <div className="rounded-[1.65rem] border border-white/70 bg-white/90 p-4 shadow-soft backdrop-blur-xl sm:rounded-[2rem] sm:p-5">
                    <div>
                      <NorwayDataBadge status={product.norwegianDataStatus} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 140, damping: 24 }}>
              <NovaScore novaGroup={product.novaGroup} />
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 140, damping: 24 }}>
              <Additives additives={product.additives} />
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 140, damping: 24 }}>
              <NutritionInsights product={product} isPremium={isPremium} />
            </motion.div>

          </motion.div>
        ) : null}
      </main>
      {product ? (
        <div className="fixed inset-x-3 bottom-[6.4rem] z-40 grid grid-cols-2 gap-2 rounded-[1.5rem] border border-white/70 bg-white/90 p-2 shadow-phone backdrop-blur-2xl sm:hidden">
          <button
            onClick={() => void handleShare()}
            className="focus-ring tap-feedback inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3 text-[0.95rem] font-black text-white"
          >
            <Share2 className="h-5 w-5" />
            {copied ? "Copied" : "Share"}
          </button>
          <Link
            href="/scan"
            className="focus-ring tap-feedback inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-leaf-100 px-4 py-3 text-[0.95rem] font-black text-forest"
          >
            <Barcode className="h-5 w-5" />
            Scan another
          </Link>
        </div>
      ) : null}
    </>
  );
}
