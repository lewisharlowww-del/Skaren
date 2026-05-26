"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, XCircle } from "lucide-react";
import { SupporterBadge } from "@/components/SupporterBadge";
import { getSupporterBadge, saveStoredSupportStatus } from "@/lib/premium";
import { supabase } from "@/lib/supabase";

type CheckoutStatusBannerProps = {
  status?: string;
  amountNok?: number;
  sessionId?: string;
};

type VerifySupportResponse = {
  verified?: boolean;
  amountNok?: number;
  email?: string | null;
  error?: string;
};

export function CheckoutStatusBanner({ status, amountNok = 0, sessionId }: CheckoutStatusBannerProps) {
  const [saved, setSaved] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifiedAmount, setVerifiedAmount] = useState(amountNok);
  const checkoutSucceeded = status === "success";
  const checkoutCancelled = status === "cancelled";
  const badge = getSupporterBadge(verifiedAmount);

  useEffect(() => {
    if (!checkoutSucceeded) return;

    async function saveSupporter() {
      if (!sessionId) {
        setVerifyError("We could not verify this Stripe payment. Please open your account or try again.");
        return;
      }

      const { data: sessionData } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
      const verificationResponse = await fetch("/api/stripe/verify-support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionData.session?.access_token ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {})
        },
        body: JSON.stringify({ sessionId })
      }).catch(() => null);
      const verification = (await verificationResponse?.json().catch(() => null)) as VerifySupportResponse | null;

      if (!verification?.verified) {
        setVerifyError("Stripe has not confirmed this support payment yet.");
        return;
      }

      const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
      const email = data.user?.email ?? null;
      const verifiedEmail = verification.email?.trim().toLowerCase();
      const signedInEmail = email?.trim().toLowerCase();
      const resolvedAmount = verification.amountNok ?? amountNok;
      const resolvedBadge = getSupporterBadge(resolvedAmount);

      if (verifiedEmail && signedInEmail && verifiedEmail !== signedInEmail) {
        setVerifyError("This Stripe payment belongs to a different email address.");
        return;
      }

      setVerifiedAmount(resolvedAmount);
      saveStoredSupportStatus({ email, amountNok: resolvedAmount, badge: resolvedBadge });

      if (data.user) {
        await supabase?.auth.updateUser({
          data: {
            plan: "supporter",
            premium: true,
            supporter: true,
            supporter_badge: resolvedBadge,
            support_amount_nok: resolvedAmount,
            premium_source: "stripe_checkout"
          }
        });
      }

      setSaved(true);
    }

    void saveSupporter();
  }, [amountNok, checkoutSucceeded, sessionId]);

  if (checkoutSucceeded) {
    return (
      <section className="mx-auto mb-8 max-w-2xl rounded-[2rem] border border-leaf-200 bg-gradient-to-br from-leaf-50 to-white p-6 text-center shadow-soft">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-forest text-white shadow-sm">
          <Check className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-3xl font-black text-ink">Thank you for supporting Skaren</h1>
        <p className="mt-3 text-base font-medium leading-7 text-soil-600">
          Your payment was confirmed. You now have a {badge} badge and supporter access for this account.
        </p>
        <SupporterBadge badge={badge} amountNok={verifiedAmount} className="mx-auto mt-5 max-w-md text-left" />
        {verifyError ? (
          <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-800">{verifyError}</p>
        ) : (
          <p className="mt-3 text-sm font-bold text-forest">{saved ? "Supporter status saved for this account." : "Verifying Stripe payment..."}</p>
        )}
        <Link
          href="/account"
          className="mt-6 inline-flex min-h-14 w-full items-center justify-center rounded-full bg-ink px-5 py-4 font-black text-white shadow-phone transition hover:bg-forest sm:w-auto"
        >
          View account
        </Link>
      </section>
    );
  }

  if (checkoutCancelled) {
    return (
      <section className="mx-auto mb-8 max-w-2xl rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-center shadow-soft">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white text-amber-700 shadow-sm">
          <XCircle className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-3xl font-black text-ink">Checkout cancelled</h1>
        <p className="mt-3 text-base font-medium leading-7 text-soil-600">
          No worries. Your free Skaren access still works, and you can support the app whenever you are ready.
        </p>
      </section>
    );
  }

  return null;
}
