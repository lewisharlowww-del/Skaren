"use client";

import Link from "next/link";
import { Check, Crown, Lock } from "lucide-react";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/language-context";

const freeFeatures = [
  "Scan any product barcode",
  "Health and Eco grades",
  "Ingredients list",
  "Basic nutrition table (per 100g)",
  "30 days of scan history",
];

const proFeatures = [
  "NOVA processing level, additives & allergens",
  "Daily intake progress bars for every nutrient",
  "AI-powered key health insights per product",
  "Shopping list with health grade tracking",
  "Complete scan history — no 30-day limit",
  "Product search without scanning",
];

export default function PricingPage() {
  const { lang } = useLang();

  return (
    <main className="mx-auto w-full max-w-[430px] px-4 pb-36 pt-5 sm:max-w-2xl sm:pt-12" style={{ background: "#faf7f2", minHeight: "100dvh" }}>
      {/* Header */}
      <div className="mx-auto max-w-xl text-center mb-8 sm:mb-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-bold text-amber-800 mb-4">
          <Crown className="h-4 w-4" />
          {t('account_upgrade', lang)}
        </span>
        <h1
          className="text-[2rem] font-black leading-tight text-[#2d3028] tracking-tight sm:text-4xl"
          style={{ fontFamily: "Satoshi, sans-serif" }}
        >
          {t('pricing_title', lang)}
        </h1>
        <p className="mt-3 text-[0.95rem] font-medium leading-7 text-[#7a6e5e] sm:mt-4">
          {t('pricing_subtitle', lang)}
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Free */}
        <div className="rounded-[1.8rem] border border-black/8 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[1.2rem] font-black text-[#2d3028]">Free</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0ebe0] px-3 py-1 text-xs font-bold text-[#7a6e5e]">
              <Lock className="h-3.5 w-3.5" />
              Current plan
            </span>
          </div>
          <p className="text-[2rem] font-black text-[#2d3028] mb-1">0 kr</p>
          <p className="text-sm text-[#9a8e7e] mb-5">Always free, no account needed</p>
          <ul className="space-y-2.5">
            {freeFeatures.map((f) => (
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
            className="mt-6 flex h-12 w-full items-center justify-center rounded-full border border-[#e0d8cc] bg-[#f7f2ea] font-bold text-[#2d3028] text-sm"
          >
            Keep scanning free
          </Link>
        </div>

        {/* Pro */}
        <div className="rounded-[1.8rem] border-2 border-[#2d4a26] bg-[#2d4a26] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[1.2rem] font-black text-white">Pro</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4a8c5c] px-3 py-1 text-xs font-bold text-[#c8f0c8]">
              <Crown className="h-3.5 w-3.5" />
              Full access
            </span>
          </div>
          <p className="text-[2rem] font-black text-white mb-1">Coming soon</p>
          <p className="text-sm text-[#a0c8a0] mb-5">All features, one-time price</p>
          <ul className="space-y-2.5">
            {proFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-[#c8f0c8]">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#4a8c5c] text-[#c8f0c8]">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[#dceedd]/30 font-bold text-[#a0c8a0] text-sm cursor-default select-none">
            Launching soon
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-[#b0a090]">
        No credit card required to use Skaren free.
        Pro pricing and availability will be announced soon.
      </p>

      <div className="mt-4 text-center">
        <Link
          href="/scan"
          className="font-bold text-[#2d3028] underline decoration-[#4a8c5c] decoration-2 underline-offset-4 text-sm"
        >
          {t('back', lang)}
        </Link>
      </div>
    </main>
  );
}
