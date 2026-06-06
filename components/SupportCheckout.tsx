"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, HeartHandshake, Loader2 } from "lucide-react";
import { getSupporterBadge } from "@/lib/premium";
import { supabase } from "@/lib/supabase";
import { SupporterBadge } from "@/components/SupporterBadge";

type SupportCheckoutProps = {
  className?: string;
  activeClassName?: string;
};

type PremiumStatusResponse = {
  premium?: boolean;
  amountNok?: number;
  badge?: string;
};

const presets = [50, 100, 250, 500];

export function SupportCheckout({ className = "", activeClassName }: SupportCheckoutProps) {
  const [amount, setAmount] = useState(150);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSupporter, setIsSupporter] = useState(false);
  const [savedAmount, setSavedAmount] = useState(0);
  const [savedBadge, setSavedBadge] = useState("Supporter");

  useEffect(() => {
    let active = true;

    async function loadSupporterStatus() {
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
      const premiumStatus = (await response?.json().catch(() => null)) as PremiumStatusResponse | null;
      const amountNok = Number(premiumStatus?.amountNok ?? 0);
      const badge = String(premiumStatus?.badge ?? getSupporterBadge(amountNok));

      if (!active) return;

      setIsSupporter(Boolean(premiumStatus?.premium));
      setSavedAmount(Number.isFinite(amountNok) ? amountNok : 0);
      setSavedBadge(badge);
    }

    void loadSupporterStatus();

    return () => {
      active = false;
    };
  }, []);

  async function startCheckout() {
    setLoading(true);
    setError("");

    try {
      const { data: sessionData } = (await supabase?.auth.getSession()) ?? { data: { session: null } };

      if (!sessionData.session?.access_token) {
        window.location.href = "/login?next=%2Fpricing";
        return;
      }

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({ amountNok: amount })
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setError(data.error ?? "Payment is not ready yet.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Could not open payment. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (isSupporter) {
    const badge = savedBadge || getSupporterBadge(savedAmount);

    return (
      <Link
        href="/account"
        className={`focus-ring type-button inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full px-5 py-4 shadow-phone transition ${
          activeClassName ?? "bg-forest text-white hover:bg-ink"
        }`}
      >
        <CheckCircle2 className="h-5 w-5" />
        {badge}
      </Link>
    );
  }

  return (
    <div className={`rounded-[1.75rem] border border-white/10 bg-white/10 p-4 ${className}`}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="type-section-label text-leaf-200">Support amount</p>
          <p className="type-display-lg mt-1 text-white">{amount} kr</p>
        </div>
        <SupporterBadge badge={getSupporterBadge(amount)} amountNok={amount} compact />
      </div>

      <input
        aria-label="Support amount in NOK"
        type="range"
        min={50}
        max={5000}
        step={50}
        value={amount}
        onChange={(event) => setAmount(Number(event.target.value))}
        className="mt-5 h-2 w-full accent-leaf-200"
      />

      <div className="mt-4 grid grid-cols-4 gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setAmount(preset)}
            className={`type-button min-h-10 rounded-full px-3 transition ${
              amount === preset ? "bg-white text-ink" : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {preset}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => void startCheckout()}
        disabled={loading}
        className="focus-ring type-button mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-4 text-ink shadow-phone transition hover:bg-leaf-50 disabled:cursor-wait disabled:bg-soil-100"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <HeartHandshake className="h-5 w-5" />}
        {loading ? "Opening Stripe..." : `Support with ${amount} kr`}
      </button>

      {error ? <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-800">{error}</p> : null}
    </div>
  );
}
