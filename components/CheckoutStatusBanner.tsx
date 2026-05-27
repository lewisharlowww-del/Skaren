"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, XCircle } from "lucide-react";
import { SupporterBadge } from "@/components/SupporterBadge";
import { getSupporterBadge } from "@/lib/premium";
import { supabase } from "@/lib/supabase";

type CheckoutStatusBannerProps = {
  status?: string;
  amountNok?: number;
  sessionId?: string;
};

type VerifySupportResponse = {
  verified?: boolean;
  saved?: boolean;
  belongsToSignedInUser?: boolean;
  amountNok?: number;
  email?: string | null;
  error?: string;
};

export function CheckoutStatusBanner({ status, amountNok = 0, sessionId }: CheckoutStatusBannerProps) {
  const [saved, setSaved] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [checking, setChecking] = useState(status === "success");
  const [verifiedAmount, setVerifiedAmount] = useState(amountNok);
  const checkoutSucceeded = status === "success";
  const checkoutCancelled = status === "cancelled";
  const badge = getSupporterBadge(verifiedAmount);

  useEffect(() => {
    if (!checkoutSucceeded) return;

    async function saveSupporter() {
      setChecking(true);
      setSaved(false);
      setVerifyError("");

      if (!sessionId) {
        setVerifyError("We could not verify this Stripe payment. Please open your account or try again.");
        setChecking(false);
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
        if (verification?.error === "support_save_failed") {
          setVerifyError(
            "Stripe confirmed this payment, but Skaren could not save the supporter badge yet. Check the Supabase service role key and Stripe webhook setup."
          );
        } else if (verification?.error === "payment_belongs_to_different_account") {
          setVerifyError("This Stripe payment belongs to a different Skaren account.");
        } else {
          setVerifyError("Stripe has not confirmed this payment. Your card was not charged, and no supporter badge was added.");
        }
        setChecking(false);
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
        setChecking(false);
        return;
      }

      setVerifiedAmount(resolvedAmount);
      setSaved(true);
      setChecking(false);
    }

    void saveSupporter();
  }, [amountNok, checkoutSucceeded, sessionId]);

  if (checkoutSucceeded) {
    return (
      <section className="mx-auto mb-8 max-w-2xl rounded-[2rem] border border-leaf-200 bg-gradient-to-br from-leaf-50 to-white p-6 text-center shadow-soft">
        <span className={`mx-auto grid h-14 w-14 place-items-center rounded-full shadow-sm ${saved ? "bg-forest text-white" : verifyError ? "bg-amber-50 text-amber-700" : "bg-leaf-50 text-forest"}`}>
          {checking ? <Loader2 className="h-7 w-7 animate-spin" /> : saved ? <Check className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}
        </span>
        <h1 className="mt-4 text-3xl font-black text-ink">
          {saved ? "Thank you for supporting Skaren" : checking ? "Checking your payment" : "Payment not confirmed"}
        </h1>
        <p className="mt-3 text-base font-medium leading-7 text-soil-600">
          {saved
            ? `Your payment was confirmed. You now have a ${badge} badge for this account.`
            : checking
              ? "We are checking Stripe before updating your account."
              : "Skaren only adds supporter badges after Stripe confirms a successful payment."}
        </p>
        {saved ? <SupporterBadge badge={badge} amountNok={verifiedAmount} className="mx-auto mt-5 max-w-md text-left" /> : null}
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
