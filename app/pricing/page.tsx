"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Crown, LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import { useLang } from "@/lib/language-context";
import { configurePurchases, getSubscriptionPlans, purchaseMonthly, purchaseYearly, restorePurchases } from "@/lib/revenuecat";
import type { SubscriptionPlanInfo, SubscriptionPlans, SubscriptionTrial } from "@/lib/revenuecat";

const freeFeatures = {
  en: [
    "Scan any product barcode",
    "Health and Eco grades",
    "Ingredients list",
    "Basic nutrition table (per 100g)",
    "30 days of scan history",
  ],
  no: [
    "Skann alle produktstrekkoder",
    "Helse- og miljøkarakterer",
    "Ingrediensliste",
    "Grunnleggende næringstabel (per 100g)",
    "30 dagers skannehistorikk",
  ],
};

const proFeatures = {
  en: [
    "NOVA processing level, additives & allergens",
    "Daily intake progress bars for every nutrient",
    "AI-powered key health insights per product",
    "Shopping list with health grade tracking",
    "Complete scan history — no 30-day limit",
    "Product search without scanning",
  ],
  no: [
    "NOVA-prosesseringsnivå, tilsetningsstoffer og allergener",
    "Daglige inntaksindikatorer for alle næringsstoffer",
    "AI-drevne helseinnsikter per produkt",
    "Handleliste med helsekarakter-sporing",
    "Komplett skannehistorikk — ingen 30-dagersgrense",
    "Produktsøk uten skanning",
  ],
};

type Toast = { type: "success" | "error"; msg: string } | null;

function getPurchaseErrorMessage(isNo: boolean) {
  return isNo
    ? "Abonnementet er midlertidig utilgjengelig. Prøv igjen om litt."
    : "Subscriptions are temporarily unavailable. Please try again in a moment.";
}

function getRestoreErrorMessage(isNo: boolean) {
  return isNo
    ? "Kjøp kunne ikke gjenopprettes akkurat nå. Prøv igjen om litt."
    : "Purchases could not be restored right now. Please try again in a moment.";
}

// Marketing fallbacks used on web (no StoreKit) and before live prices load.
// On a real device these are replaced by the values StoreKit reports, so the
// displayed terms always match what App Store Connect will actually charge.
const FALLBACK_PRICES = {
  monthly: { price: "49 kr", perMonth: null as string | null },
  yearly: { price: "490 kr", perMonth: "~41 kr" },
} as const;

function pluralizeUnit(unit: string, count: number, isNo: boolean): string {
  const u = unit.toUpperCase();
  const plural = count !== 1;
  if (isNo) {
    if (u === "DAY") return plural ? "dager" : "dag";
    if (u === "WEEK") return plural ? "uker" : "uke";
    if (u === "MONTH") return plural ? "måneder" : "måned";
    if (u === "YEAR") return plural ? "år" : "år";
    return "";
  }
  if (u === "DAY") return plural ? "days" : "day";
  if (u === "WEEK") return plural ? "weeks" : "week";
  if (u === "MONTH") return plural ? "months" : "month";
  if (u === "YEAR") return plural ? "years" : "year";
  return "";
}

/** "7 days free" / "7 dager gratis" derived from the real StoreKit intro offer. */
function formatTrialBadge(trial: SubscriptionTrial | null, isNo: boolean): string | null {
  if (!trial || !trial.isFree || trial.periodNumberOfUnits <= 0) return null;
  const unit = pluralizeUnit(trial.periodUnit, trial.periodNumberOfUnits, isNo);
  if (!unit) return null;
  return isNo
    ? `${trial.periodNumberOfUnits} ${unit} gratis`
    : `${trial.periodNumberOfUnits} ${unit} free`;
}

function formatTrialSubtitle(trial: SubscriptionTrial | null, isNo: boolean): string | null {
  if (!trial || !trial.isFree || trial.periodNumberOfUnits <= 0) return null;
  return isNo ? "Ingen betaling før prøveperioden er over" : "No charge until trial ends";
}

/** CTA label: trial-aware, falls back to a plain subscribe label when no trial exists. */
function formatCtaLabel(trial: SubscriptionTrial | null, isNo: boolean): string {
  if (trial && trial.isFree && trial.periodNumberOfUnits > 0) {
    const unit = pluralizeUnit(trial.periodUnit, trial.periodNumberOfUnits, isNo);
    if (unit) {
      return isNo
        ? `Prøv gratis i ${trial.periodNumberOfUnits} ${unit}`
        : `Try free for ${trial.periodNumberOfUnits} ${unit}`;
    }
  }
  return isNo ? "Abonner" : "Subscribe";
}

/**
 * App Store Guideline 3.1.2 disclosure shown directly under the CTA: the exact
 * price charged, the billing period, that it auto-renews, and how to cancel —
 * plus the trial length when an intro offer exists. Built from the live StoreKit
 * price (with a marketing fallback) so it always matches what Apple charges.
 */
function formatRenewalTerms(
  plan: "monthly" | "yearly",
  priceLabel: string,
  trial: SubscriptionTrial | null,
  isNo: boolean,
): string {
  const period = plan === "yearly" ? (isNo ? "år" : "year") : isNo ? "måned" : "month";
  const priceClause = `${priceLabel} per ${period}`;

  const hasTrial = !!trial && trial.isFree && trial.periodNumberOfUnits > 0;
  const trialClause =
    hasTrial && trial
      ? (() => {
          const unit = pluralizeUnit(trial.periodUnit, trial.periodNumberOfUnits, isNo);
          return isNo
            ? `${trial.periodNumberOfUnits} ${unit} gratis, deretter `
            : `${trial.periodNumberOfUnits} ${unit} free, then `;
        })()
      : "";

  if (isNo) {
    return `${trialClause}${priceClause}. Fornyes automatisk til samme pris til du sier opp. Si opp når som helst i App Store-innstillingene minst 24 timer før perioden er over.`;
  }
  return `${trialClause}${priceClause}. Auto-renews at the same price until you cancel. Cancel anytime in App Store settings at least 24 hours before the period ends.`;
}

export default function PricingPage() {
  const { lang } = useLang();
  const isNo = lang === "no";
  const router = useRouter();

  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [pendingAction, setPendingAction] = useState<"purchase" | "restore" | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [plans, setPlans] = useState<SubscriptionPlans | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void configurePurchases();
    void getSubscriptionPlans()
      .then((loaded) => {
        if (!cancelled && loaded) setPlans(loaded);
      })
      .catch((error) => {
        console.warn("[RevenueCat][Skaren] Failed to load live pricing", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activePlan: SubscriptionPlanInfo | null =
    selectedPlan === "yearly" ? plans?.yearly ?? null : plans?.monthly ?? null;
  const fallback = FALLBACK_PRICES[selectedPlan];
  const priceLabel = activePlan?.priceString || fallback.price;
  const perMonthLabel = activePlan?.pricePerMonthString ?? fallback.perMonth;
  const trialBadge = formatTrialBadge(activePlan?.trial ?? null, isNo);
  const trialSubtitle = formatTrialSubtitle(activePlan?.trial ?? null, isNo);
  const ctaLabel = formatCtaLabel(activePlan?.trial ?? null, isNo);
  const renewalTerms = formatRenewalTerms(selectedPlan, priceLabel, activePlan?.trial ?? null, isNo);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function handlePurchase() {
    setPendingAction("purchase");
    setToast(null);
    try {
      const result = selectedPlan === "yearly"
        ? await purchaseYearly()
        : await purchaseMonthly();
      const isPremium = result.customerInfo.entitlements.active["Skaren Pro"] !== undefined;
      if (isPremium) {
        setPurchaseSuccess(true);
      } else {
        showToast("success", isNo ? "Kjøp fullført. Tilgang oppdateres snart." : "Purchase completed. Access is being updated.");
      }
    } catch (error) {
      console.error("[RevenueCat][Skaren] Purchase failed", error);
      showToast("error", getPurchaseErrorMessage(isNo));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRestore() {
    setPendingAction("restore");
    setToast(null);
    try {
      const { customerInfo } = await restorePurchases();
      const isPremium = customerInfo.entitlements.active["Skaren Pro"] !== undefined;
      if (isPremium) {
        setPurchaseSuccess(true);
      } else {
        showToast("error", isNo ? "Ingen aktivt kjøp funnet." : "No active purchase found.");
      }
    } catch (error) {
      console.error("[RevenueCat][Skaren] Restore failed", error);
      showToast("error", getRestoreErrorMessage(isNo));
    } finally {
      setPendingAction(null);
    }
  }

  if (purchaseSuccess) {
    return (
      <main
        className="relative mx-auto flex w-full max-w-[430px] flex-col items-center justify-center px-6 text-center sm:max-w-2xl"
        style={{ background: "#f5f0e8", minHeight: "100dvh", paddingTop: "calc(env(safe-area-inset-top) + 20px)" }}
      >
        <div className="relative mb-6 grid h-24 w-24 place-items-center rounded-full bg-[#2d4a26]">
          <Sparkles className="absolute -right-1 -top-1 h-6 w-6 text-amber-300" />
          <Check className="h-12 w-12 text-white" strokeWidth={3} />
        </div>

        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-bold text-amber-800">
          <Crown className="h-4 w-4" />
          {isNo ? "Skaren Pro er aktivt" : "Skaren Pro is active"}
        </span>

        <h1 className="text-[1.9rem] font-black leading-tight tracking-tight text-[#1A2410]">
          {isNo ? "Du er klar!" : "You're all set!"}
        </h1>
        <p className="mt-3 max-w-sm text-sm font-medium text-[#7a6e5e]">
          {isNo
            ? "Takk for at du oppgraderte. Alle Pro-funksjonene er nå låst opp."
            : "Thanks for upgrading. All Pro features are now unlocked."}
        </p>

        <button
          type="button"
          onClick={() => router.replace("/scan")}
          className="mt-9 flex h-13 w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-[#2d4a26] py-3.5 text-sm font-bold text-white"
        >
          <Crown className="h-4 w-4" />
          {isNo ? "Begynn å skanne" : "Start scanning"}
        </button>

        <Link
          href="/account"
          className="mt-3 flex h-11 w-full max-w-sm items-center justify-center text-sm font-bold text-[#1A5C3A]"
        >
          {isNo ? "Gå til kontoen min" : "Go to my account"}
        </Link>
      </main>
    );
  }

  return (
    <main
      className="relative mx-auto w-full max-w-[430px] px-4 pb-36 sm:max-w-2xl"
      style={{ background: "#f5f0e8", minHeight: "100dvh", paddingTop: "calc(env(safe-area-inset-top) + 20px)" }}
    >
      {/* Back */}
      <Link
        href="/scan"
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#1A5C3A]"
      >
        <ArrowLeft className="h-4 w-4" />
        {isNo ? "Tilbake" : "Back"}
      </Link>

      {/* Header */}
      <div className="mb-8 text-center">
        <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-bold text-amber-800">
          <Crown className="h-4 w-4" />
          {isNo ? "Oppgrader til Pro" : "Upgrade to Pro"}
        </span>
        <h1 className="text-[1.9rem] font-black leading-tight tracking-tight text-[#1A2410]">
          {isNo ? "Skaren Premium" : "Skaren Premium"}
        </h1>
        <p className="mt-2 text-sm font-medium text-[#7a6e5e]">
          {isNo ? "Forstå hva som er i maten din." : "Understand what's in your food."}
        </p>
      </div>

      {/* Plan toggle */}
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-white/60 p-1.5">
        <button
          type="button"
          onClick={() => setSelectedPlan("monthly")}
          className={`rounded-xl px-3 py-2.5 text-sm font-bold transition ${
            selectedPlan === "monthly"
              ? "bg-white text-[#1A5C3A] shadow-sm"
              : "text-[#7a6e5e]"
          }`}
        >
          {isNo ? "Månedlig" : "Monthly"}
        </button>
        <button
          type="button"
          onClick={() => setSelectedPlan("yearly")}
          className={`relative rounded-xl px-3 py-2.5 text-sm font-bold transition ${
            selectedPlan === "yearly"
              ? "bg-white text-[#1A5C3A] shadow-sm"
              : "text-[#7a6e5e]"
          }`}
        >
          {isNo ? "Årlig" : "Yearly"}
          {selectedPlan !== "yearly" && (
            <span className="absolute -right-1 -top-2 rounded-full bg-[#4a8c5c] px-1.5 py-0.5 text-[10px] font-bold text-white">
              -17%
            </span>
          )}
        </button>
      </div>

      {/* Pro card */}
      <div className="relative mb-4 overflow-hidden rounded-[1.8rem] border-2 border-[#2d4a26] bg-[#2d4a26] p-5 sm:p-6">
        {selectedPlan === "yearly" && (
          <div className="absolute right-5 top-5 rounded-full bg-[#4a8c5c] px-3 py-1 text-xs font-bold text-[#c8f0c8]">
            {isNo ? "ANBEFALT" : "RECOMMENDED"}
          </div>
        )}

        <div className="mb-1 flex items-end gap-3">
          <p className="text-[2.2rem] font-black leading-none text-white">
            {priceLabel}
          </p>
          {trialBadge && (
            <span className="mb-1 rounded-full bg-[#4a8c5c] px-2.5 py-0.5 text-xs font-bold text-[#c8f0c8]">
              {trialBadge}
            </span>
          )}
        </div>
        <p className="mb-1 text-sm text-[#a0c8a0]">
          {selectedPlan === "yearly"
            ? perMonthLabel
              ? (isNo ? `per år · ${perMonthLabel}/mnd` : `per year · ${perMonthLabel}/mo`)
              : (isNo ? "per år" : "per year")
            : (isNo ? "per måned" : "per month")}
        </p>
        {trialSubtitle && (
          <p className="mb-5 text-xs text-[#79a879]">
            {trialSubtitle}
          </p>
        )}

        <ul className="mb-6 space-y-2.5">
          {(isNo ? proFeatures.no : proFeatures.en).map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-[#c8f0c8]">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#4a8c5c]">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              {f}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => void handlePurchase()}
          disabled={pendingAction !== null}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-bold text-[#1A5C3A] disabled:opacity-60"
        >
          {pendingAction === "purchase"
            ? <LoaderCircle className="h-4 w-4 animate-spin" />
            : <Crown className="h-4 w-4" />}
          {ctaLabel}
        </button>

        {/* Guideline 3.1.2: exact charge, billing period, auto-renew + cancel, shown with the CTA. */}
        <p className="mt-3 text-center text-[12px] leading-snug text-white/90">
          {renewalTerms}
        </p>

        <button
          type="button"
          onClick={() => void handleRestore()}
          disabled={pendingAction !== null}
          className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-[#a0c8a0] disabled:opacity-60"
        >
          {pendingAction === "restore"
            ? <LoaderCircle className="h-4 w-4 animate-spin" />
            : <RotateCcw className="h-3.5 w-3.5" />}
          {isNo ? "Gjenopprett kjøp" : "Restore purchase"}
        </button>

        <p className="mt-4 text-center text-[12px] text-white/90">
          {isNo ? "Ved å abonnere godtar du våre" : "By subscribing you agree to our"}{" "}
          <Link href="/terms" className="underline underline-offset-2 text-white font-bold">{isNo ? "Brukervilkår" : "Terms of Use"}</Link>
          {" "}{isNo ? "og" : "and"}{" "}
          <Link href="/privacy" className="underline underline-offset-2 text-white font-bold">{isNo ? "Personvernerklæring" : "Privacy Policy"}</Link>.
        </p>
      </div>

      {/* Free card */}
      <div className="rounded-[1.8rem] border border-black/8 bg-white p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-black text-[#2d3028]">Free</h2>
          <span className="rounded-full bg-[#f0ebe0] px-3 py-1 text-xs font-bold text-[#7a6e5e]">
            {isNo ? "Nåværende plan" : "Current plan"}
          </span>
        </div>
        <p className="mb-1 text-2xl font-black text-[#2d3028]">0 kr</p>
        <p className="mb-4 text-sm text-[#9a8e7e]">
          {isNo ? "Alltid gratis, ingen konto nødvendig" : "Always free, no account needed"}
        </p>
        <ul className="space-y-2">
          {(isNo ? freeFeatures.no : freeFeatures.en).map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-[#7a6e5e]">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#eaf3de] text-[#2d4a26]">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              {f}
            </li>
          ))}
        </ul>
        <Link
          href="/scan"
          className="mt-5 flex h-11 w-full items-center justify-center rounded-2xl border border-[#e0d8cc] bg-[#f7f2ea] text-sm font-bold text-[#2d3028]"
        >
          {isNo ? "Fortsett gratis" : "Keep scanning free"}
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-[#7a6e5e]">
        {isNo
          ? "Abonnementer fornyes automatisk. Avbestill når som helst i App Store."
          : "Subscriptions renew automatically. Cancel anytime in App Store settings."}
      </p>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-2xl px-5 py-3 text-sm font-bold shadow-lg transition-all ${
            toast.type === "success"
              ? "bg-[#2d4a26] text-[#c8f0c8]"
              : "bg-rose-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </main>
  );
}
