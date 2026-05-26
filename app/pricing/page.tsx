import Link from "next/link";
import { Check, Lock, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { CheckoutStatusBanner } from "@/components/CheckoutStatusBanner";
import { SupportCheckout } from "@/components/SupportCheckout";
import { stripePlans } from "@/lib/stripe";

type PricingPageProps = {
  searchParams?: {
    checkout?: string;
    amount?: string;
    session_id?: string;
  };
};

export default function PricingPage({ searchParams }: PricingPageProps) {
  const checkoutStatus = searchParams?.checkout;
  const supportAmount = Number(searchParams?.amount ?? "0");
  const sessionId = searchParams?.session_id;

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <CheckoutStatusBanner status={checkoutStatus} amountNok={Number.isFinite(supportAmount) ? supportAmount : 0} sessionId={sessionId} />

        <div className="mx-auto max-w-2xl text-center">
          <p className="font-bold text-forest">Support Skaren</p>
          <h1 className="mt-2 text-4xl font-black text-ink">Help us keep Skaren independent and improving</h1>
          <p className="mt-4 leading-7 text-soil-600">
            Free is for quick checks. Supporters help fund better product data, clearer insights, and future features. Support once from 50 kr and help shape what Skaren becomes.
          </p>
        </div>

        <section className="mt-10 grid gap-5 md:grid-cols-2">
          {Object.values(stripePlans).map((plan) => (
            <div
              key={plan.name}
              className={`rounded-[2rem] border p-6 shadow-soft ${
                plan.name === "Support Skaren" ? "border-forest/20 bg-ink text-white ring-2 ring-leaf-100" : "border-black/5 bg-white/75"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-black ${plan.name === "Support Skaren" ? "text-white" : "text-soil-900"}`}>{plan.name}</h2>
                {plan.name === "Support Skaren" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-lime-100 px-3 py-1 text-sm font-bold text-ink">
                    <Sparkles className="h-4 w-4" />
                    One-time
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-soil-100 px-3 py-1 text-sm font-bold text-soil-600">
                    <Lock className="h-4 w-4" />
                    Starter
                  </span>
                )}
              </div>
              <p className={`mt-3 min-h-12 text-sm font-medium leading-6 ${plan.name === "Support Skaren" ? "text-white/70" : "text-soil-600"}`}>
                {plan.description}
              </p>
              <p className={`mt-4 text-4xl font-black ${plan.name === "Support Skaren" ? "text-white" : "text-soil-900"}`}>{plan.price}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className={`flex items-center gap-3 ${plan.name === "Support Skaren" ? "text-white/80" : "text-soil-600"}`}>
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lime-100 text-ink">
                      <Check className="h-4 w-4" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              {plan.name === "Support Skaren" ? (
                <div className="mt-8">
                  <SupportCheckout />
                </div>
              ) : (
                <Link href="/scan" className="mt-8 inline-flex min-h-14 w-full items-center justify-center rounded-full bg-white px-5 py-4 font-bold text-ink shadow-sm">
                  Continue free
                </Link>
              )}
            </div>
          ))}
        </section>

        <div className="mt-8 text-center">
          <Link href="/scan" className="font-bold text-ink underline decoration-lime-400 decoration-2 underline-offset-4">
            Keep using Skaren for free
          </Link>
        </div>
      </main>
    </>
  );
}
