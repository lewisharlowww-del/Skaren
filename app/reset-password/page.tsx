"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { SkarenMark, SkarenWordmark } from "@/components/SkarenLogo";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = (await supabase?.auth.updateUser({ password })) ?? {
      error: new Error("The reset link has expired. Request a new one.")
    };
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }
    setComplete(true);
  }

  return (
    <main className="sk-auth-background grid min-h-[100dvh] place-items-center px-4 py-8">
      <section className="w-full max-w-sm rounded-[1.5rem] border border-white/70 bg-white/90 p-6 shadow-glass">
        <div className="flex items-center gap-3">
          <SkarenMark className="h-10 w-10" />
          <SkarenWordmark className="text-[1.4rem]" />
        </div>

        {complete ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-forest" />
            <h1 className="type-heading-2 mt-4 text-ink">Password updated</h1>
            <p className="type-body-sm mt-2 text-soil-600">You can now sign in with your new password.</p>
            <Link href="/login?next=%2Faccount" className="focus-ring type-button mt-6 inline-flex min-h-12 items-center rounded-full bg-ink px-6 text-white">
              Return to login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="type-heading-1 mt-6 text-ink">Choose a new password</h1>
            <p className="type-body-sm mt-2 text-soil-600">Use at least six characters.</p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="type-body-sm block font-bold text-soil-900">
                New password
                <span className="relative mt-2 block">
                  <input
                    type={showPassword ? "text" : "password"}
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    className="focus-ring min-h-12 w-full rounded-2xl border border-black/10 px-4 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((shown) => !shown)}
                    className="focus-ring absolute right-1 top-1 grid h-10 w-10 place-items-center rounded-xl text-soil-500"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </span>
              </label>
              <label className="type-body-sm block font-bold text-soil-900">
                Confirm password
                <input
                  type={showPassword ? "text" : "password"}
                  minLength={6}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  className="focus-ring mt-2 min-h-12 w-full rounded-2xl border border-black/10 px-4"
                  required
                />
              </label>
              {message ? <p className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">{message}</p> : null}
              <button disabled={loading} className="focus-ring type-button min-h-14 w-full rounded-full bg-ink px-5 text-white disabled:opacity-60">
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
