"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Crown, LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import { useLang } from "@/lib/language-context";
import { configurePurchases, getSubscriptionPlans, purchaseMonthly, purchaseYearly, restorePurchases } from "@/lib/revenuecat";
import type { SubscriptionPlanInfo, SubscriptionPlans, SubscriptionTrial } from "@/lib/revenuecat";

const proFeatures = {
  en: [
    "Processing level, additives & allergens",
    "Daily intake progress per nutrient",
    "AI health insights per product",
    "Unlimited history + product search",
  ],
  no: [
    "Prosesseringsnivå, tilsetningsstoffer og allergener",
    "Daglig inntaksprogresjon per næringsstoff",
    "AI-helseinnsikter per produkt",
    "Ubegrenset historikk + produktsøk",
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

  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
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

  // Per-plan prices for BOTH cards (so monthly and yearly are always visible
  // and never misleading about which one is being charged).
  const monthlyPrice = plans?.monthly?.priceString || FALLBACK_PRICES.monthly.price;
  const yearlyPrice = plans?.yearly?.priceString || FALLBACK_PRICES.yearly.price;
  const yearlyPerMonth = plans?.yearly?.pricePerMonthString ?? FALLBACK_PRICES.yearly.perMonth;

  const activePlan: SubscriptionPlanInfo | null =
    selectedPlan === "yearly" ? plans?.yearly ?? null : plans?.monthly ?? null;
  const priceLabel = selectedPlan === "yearly" ? yearlyPrice : monthlyPrice;
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

  const planLabel = (plan: "monthly" | "yearly") =>
    plan === "yearly" ? (isNo ? "Årlig" : "Yearly") : isNo ? "Månedlig" : "Monthly";

  return (
    <main
      className="relative mx-auto flex w-full max-w-[430px] flex-col px-5 sm:max-w-md"
      style={{
        background: "#f5f0e8",
        minHeight: "100dvh",
        paddingTop: "calc(env(safe-area-inset-top) + 16px)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)",
      }}
    >
      {/* Top bar: Back + Restore */}
      <div className="mb-4 flex items-center justify-between">
        <Link href="/scan" className="inline-flex items-center gap-1.5 text-[15px] font-bold text-[#2d4a26]">
          <ArrowLeft className="h-[18px] w-[18px]" />
          {isNo ? "Tilbake" : "Back"}
        </Link>
        <button
          type="button"
          onClick={() => void handleRestore()}
          disabled={pendingAction !== null}
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#4a8c5c] disabled:opacity-60"
        >
          {pendingAction === "restore" ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" />
          )}
          {isNo ? "Gjenopprett" : "Restore"}
        </button>
      </div>

      {/* Hero */}
      <div className="mb-4 text-center">
        <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#f6ecd2] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#b8923e]">
          {isNo ? "Oppgrader til Pro" : "Upgrade to Pro"}
        </span>
        <h1 className="text-[26px] font-black leading-[1.08] tracking-tight text-[#1e1e18]">
          {isNo ? (
            <>Vit <span className="text-[#2d4a26]">nøyaktig</span> hva<br />som er i maten din</>
          ) : (
            <>Know <span className="text-[#2d4a26]">exactly</span> what&apos;s<br />in your food</>
          )}
        </h1>
        <p className="mx-auto mt-2 max-w-[280px] text-[13.5px] font-medium leading-snug text-[#786858]">
          {isNo
            ? "Dypere analyse på hver skanning. Si opp når som helst."
            : "Deeper analysis on every scan. Cancel anytime."}
        </p>
      </div>

      {/* Pro features */}
      <div className="mb-4 rounded-[20px] border border-black/[0.08] bg-white px-4 py-1 shadow-[0_8px_24px_rgba(40,33,22,0.05)]">
        {(isNo ? proFeatures.no : proFeatures.en).map((f, i, arr) => (
          <div
            key={f}
            className={`flex items-center gap-3 py-2.5 text-[13.5px] font-semibold leading-tight text-[#1e1e18] ${
              i < arr.length - 1 ? "border-b border-black/[0.08]" : ""
            }`}
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#eaf3de] text-[#2d4a26]">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <span className="min-w-0 flex-1">{f}</span>
          </div>
        ))}
      </div>

      {/* Plan picker label */}
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[12.5px] font-extrabold text-[#1e1e18]">
          {isNo ? "Velg plan" : "Choose your plan"}
        </p>
        <span className="rounded-full bg-[#eaf3de] px-2.5 py-1 text-[11px] font-bold text-[#4a8c5c]">
          {isNo ? "7 dager gratis" : "7 days free"}
        </span>
      </div>

      {/* Both plans, always visible */}
      <div className="mb-3 flex flex-col gap-2.5">
        {/* Monthly */}
        <button
          type="button"
          onClick={() => setSelectedPlan("monthly")}
          className={`relative flex items-center gap-3 rounded-2xl border-[1.5px] bg-white p-3.5 text-left transition ${
            selectedPlan === "monthly"
              ? "border-[#2d4a26] bg-[#fbfdfa] shadow-[0_10px_26px_rgba(45,74,38,0.12)]"
              : "border-black/[0.13]"
          }`}
        >
          <span
            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
              selectedPlan === "monthly" ? "border-[#2d4a26] bg-[#2d4a26]" : "border-[#cdc6b8]"
            }`}
          >
            {selectedPlan === "monthly" && <span className="h-[7px] w-[7px] rounded-full bg-white" />}
          </span>
          <span className="flex-1">
            <span className="block text-[15px] font-extrabold text-[#1e1e18]">{planLabel("monthly")}</span>
            <span className="mt-0.5 block text-[12px] font-medium text-[#786858]">
              {isNo ? `Belastes ${monthlyPrice} hver måned` : `Billed ${monthlyPrice} every month`}
            </span>
          </span>
          <span className="text-right">
            <span className="block text-[17px] font-black tracking-tight text-[#1e1e18]">{monthlyPrice}</span>
            <span className="mt-0.5 block text-[11px] font-semibold text-[#8a7a68]">
              {isNo ? "per måned" : "per month"}
            </span>
          </span>
        </button>

        {/* Yearly */}
        <button
          type="button"
          onClick={() => setSelectedPlan("yearly")}
          className={`relative flex items-center gap-3 rounded-2xl border-[1.5px] bg-white p-3.5 text-left transition ${
            selectedPlan === "yearly"
              ? "border-[#2d4a26] bg-[#fbfdfa] shadow-[0_10px_26px_rgba(45,74,38,0.12)]"
              : "border-black/[0.13]"
          }`}
        >
          <span className="absolute -top-[9px] right-3.5 rounded-md bg-[#2d4a26] px-2.5 py-1 text-[9px] font-extrabold tracking-[0.06em] text-[#d8f0d2]">
            {isNo ? "SPAR 17%" : "SAVE 17%"}
          </span>
          <span
            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
              selectedPlan === "yearly" ? "border-[#2d4a26] bg-[#2d4a26]" : "border-[#cdc6b8]"
            }`}
          >
            {selectedPlan === "yearly" && <span className="h-[7px] w-[7px] rounded-full bg-white" />}
          </span>
          <span className="flex-1">
            <span className="block text-[15px] font-extrabold text-[#1e1e18]">{planLabel("yearly")}</span>
            <span className="mt-0.5 block text-[12px] font-medium text-[#786858]">
              {isNo ? `Belastes ${yearlyPrice} én gang i året` : `Billed ${yearlyPrice} once a year`}
            </span>
          </span>
          <span className="text-right">
            <span className="block text-[17px] font-black tracking-tight text-[#1e1e18]">{yearlyPrice}</span>
            {yearlyPerMonth && (
              <span className="mt-0.5 block text-[11px] font-semibold text-[#8a7a68]">
                {isNo ? `≈ ${yearlyPerMonth}/mnd` : `≈ ${yearlyPerMonth}/mo`}
              </span>
            )}
          </span>
        </button>
      </div>

      {/* Trial reassurance */}
      <div className="mb-auto flex items-center justify-center gap-1.5 text-[12px] font-bold text-[#4a8c5c]">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
        {isNo ? "Gratis i 7 dager · ingenting belastes i dag" : "Free for 7 days · nothing charged today"}
      </div>

      {/* CTA */}
      <div className="mt-3.5">
        <button
          type="button"
          onClick={() => void handlePurchase()}
          disabled={pendingAction !== null}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#2d4a26] text-[16px] font-extrabold text-white shadow-[0_12px_28px_rgba(45,74,38,0.30)] transition active:scale-[0.985] disabled:opacity-60"
        >
          {pendingAction === "purchase" ? (
            <LoaderCircle className="h-[18px] w-[18px] animate-spin" />
          ) : (
            <Crown className="h-[18px] w-[18px]" />
          )}
          {ctaLabel}
        </button>

        {/* Guideline 3.1.2 disclosure: exact plan, charge, auto-renew + cancel */}
        <p className="mt-2.5 px-1.5 text-center text-[10.5px] leading-relaxed text-[#9a8e7e]">
          {isNo ? "Du valgte " : "You selected "}
          <b className="text-[#2d4a26]">{planLabel(selectedPlan)}</b>
          {": "}
          {renewalTerms}{" "}
          <Link href="/terms" className="font-bold text-[#2d4a26]">{isNo ? "Vilkår" : "Terms"}</Link>
          {" · "}
          <Link href="/privacy" className="font-bold text-[#2d4a26]">{isNo ? "Personvern" : "Privacy"}</Link>
        </p>

        <Link
          href="/scan"
          className="mt-2.5 block text-center text-[12.5px] font-bold text-[#786858]"
        >
          {isNo ? "Kanskje senere — " : "Maybe later — "}
          <span className="underline underline-offset-[3px]">
            {isNo ? "fortsett gratis" : "keep the free plan"}
          </span>
        </Link>
      </div>

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
