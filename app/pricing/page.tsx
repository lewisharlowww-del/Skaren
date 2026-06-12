"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Crown, LoaderCircle, RotateCcw } from "lucide-react";
import { useLang } from "@/lib/language-context";
import { configurePurchases, purchaseMonthly, purchaseYearly, restorePurchases } from "@/lib/revenuecat";
import { supabase } from "@/lib/supabase";

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

async function setSupabasePremium() {
  try {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ is_premium: true }).eq("id", user.id);
  } catch {
    // non-fatal — RC is the source of truth
  }
}

type Toast = { type: "success" | "error"; msg: string } | null;

export default function PricingPage() {
  const { lang } = useLang();
  const isNo = lang === "no";

  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [pendingAction, setPendingAction] = useState<"purchase" | "restore" | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    void configurePurchases();
  }, []);

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
        await setSupabasePremium();
        showToast("success", isNo ? "Skaren Pro er nå aktivt!" : "Skaren Pro is now active!");
      } else {
        showToast("success", isNo ? "Kjøp fullført. Tilgang oppdateres snart." : "Purchase completed. Access is being updated.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : (isNo ? "Kjøpet kunne ikke fullføres." : "Purchase could not be completed.");
      showToast("error", msg);
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
        await setSupabasePremium();
        showToast("success", isNo ? "Skaren Pro-kjøpet ditt er gjenopprettet!" : "Your Skaren Pro purchase was restored!");
      } else {
        showToast("error", isNo ? "Ingen aktivt kjøp funnet." : "No active purchase found.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : (isNo ? "Kjøp kunne ikke gjenopprettes." : "Purchases could not be restored.");
      showToast("error", msg);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <main
      className="relative mx-auto w-full max-w-[430px] px-4 pb-36 pt-5 sm:max-w-2xl sm:pt-10"
      style={{ background: "#f5f0e8", minHeight: "100dvh" }}
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
            {selectedPlan === "yearly" ? "490 kr" : "49 kr"}
          </p>
          <span className="mb-1 rounded-full bg-[#4a8c5c] px-2.5 py-0.5 text-xs font-bold text-[#c8f0c8]">
            {isNo ? "7 dager gratis" : "7 days free"}
          </span>
        </div>
        <p className="mb-1 text-sm text-[#a0c8a0]">
          {selectedPlan === "yearly"
            ? (isNo ? "per år · ~41 kr/mnd" : "per year · ~41 kr/mo")
            : (isNo ? "per måned" : "per month")}
        </p>
        <p className="mb-5 text-xs text-[#79a879]">
          {isNo ? "Ingen betaling før prøveperioden er over" : "No charge until trial ends"}
        </p>

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
          {isNo ? "Prøv gratis i 7 dager" : "Try free for 7 days"}
        </button>

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

        <p className="mt-4 text-center text-[11px] text-[#79a879]">
          {isNo ? "Ved å abonnere godtar du våre" : "By subscribing you agree to our"}{" "}
          <Link href="/terms" className="underline underline-offset-2">{isNo ? "Brukervilkår" : "Terms of Use"}</Link>
          {" "}{isNo ? "og" : "and"}{" "}
          <Link href="/privacy" className="underline underline-offset-2">{isNo ? "Personvernerklæring" : "Privacy Policy"}</Link>.
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

      <p className="mt-6 text-center text-xs text-[#b0a090]">
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
