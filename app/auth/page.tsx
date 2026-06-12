"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { PhoneFrame } from "@/components/PhoneFrame";
import { SkarenMark, SkarenWordmark } from "@/components/SkarenLogo";
import { SupabaseNotice } from "@/components/SupabaseNotice";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="var(--sk-status-neutral)" d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.52Z" />
      <path fill="var(--sk-status-positive)" d="M12 22c2.7 0 4.97-.9 6.62-2.25l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z" />
      <path fill="var(--sk-grade-c-text)" d="M6.4 14.08A6 6 0 0 1 6.08 12c0-.72.12-1.42.32-2.08V7.33H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.67l3.34-2.59Z" />
      <path fill="var(--sk-grade-e-text)" d="M12 5.8c1.47 0 2.8.5 3.84 1.5l2.86-2.86A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.33L6.4 9.92C7.2 7.56 9.4 5.8 12 5.8Z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="white">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.4.07 2.38.74 3.2.8 1.22-.24 2.38-.93 3.68-.84 1.56.12 2.74.7 3.51 1.77-3.22 1.94-2.46 5.9.61 7.06-.65 1.62-1.5 3.24-3 4.09ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" />
    </svg>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleOAuthSignIn(provider: "google" | "apple") {
    setLoading(true);
    setMessage("");

    if (!supabase) {
      setMessage("Supabase is not configured yet.");
      setLoading(false);
      return;
    }

    const { Capacitor } = await import("@capacitor/core");
    const isNative = Capacitor.isNativePlatform();
    const next = "/account";

    const redirectTo = isNative
      ? "no.skaren.app://auth/callback"
      : `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        ...(provider === "google" ? { queryParams: { prompt: "select_account" } } : {}),
        skipBrowserRedirect: isNative,
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (isNative && data?.url) {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url: data.url });
    }

    setLoading(false);
  }

  function handleGoogleSignIn() {
    return handleOAuthSignIn("google");
  }

  function handleAppleSignIn() {
    return handleOAuthSignIn("apple");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const action =
      mode === "signup"
        ? await supabase?.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/login?confirmed=1`
            }
          })
        : await supabase?.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (action?.error) {
      setMessage(action.error.message);
      return;
    }

    if (action?.data.session) {
      document.cookie = "sb-skaren-auth-token=true; path=/; max-age=604800; SameSite=Lax";
      router.push(mode === "signup" ? "/account" : "/dashboard");
      return;
    }

    if (mode === "signup") {
      setMessage("Account created. Check your email to confirm it, then log in to Skaren.");
      return;
    }
  }

  return (
    <>
      <AppHeader />
      <main className="page-fade-up mx-auto grid w-full max-w-[430px] items-start gap-4 px-4 pb-36 pt-4 md:min-h-[calc(100vh-5rem)] md:max-w-6xl md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-8 md:py-10">
        <section className="mx-auto max-w-xl text-center md:mx-0 md:text-left">
          <SkarenMark className="mx-auto mb-3 h-11 w-11 md:mx-0 md:mb-5 md:h-14 md:w-14" iconClassName="h-6 w-6 text-white md:h-8 md:w-8" />
          <h1 className="type-display-lg text-ink">Track smarter choices instantly.</h1>
          <p className="type-body-lg mx-auto mt-3 max-w-md text-soil-600 md:mx-0 md:mt-4">
            Save your scans, follow your progress, and unlock deeper product insights.
          </p>
        </section>

        <PhoneFrame className="mx-auto w-full max-w-[20.5rem] md:max-w-[22rem]" contentClassName="min-h-0 px-5 pb-6 pt-7 sm:px-7 sm:pb-8 sm:pt-9">
          <section>
          <div className="mb-4 text-center sm:mb-6">
            <SkarenMark className="mx-auto mb-3 h-11 w-11 sm:mb-4 sm:h-14 sm:w-14" iconClassName="h-6 w-6 text-white sm:h-8 sm:w-8" />
            <h2 className="type-heading-2 text-ink"><SkarenWordmark /></h2>
            <p className="type-body-sm mt-2 text-soil-600">Create your Skaren account in a minute.</p>
          </div>
          {!isSupabaseConfigured ? <SupabaseNotice /> : null}
          <div className="mt-5 grid grid-cols-2 rounded-full bg-soil-100 p-1">
            <button
              onClick={() => setMode("signup")}
              className={`tap-feedback type-button rounded-full px-4 py-3 ${mode === "signup" ? "bg-ink text-white shadow-sm" : "text-soil-600"}`}
            >
              Sign up
            </button>
            <button
              onClick={() => setMode("login")}
              className={`tap-feedback type-button rounded-full px-4 py-3 ${mode === "login" ? "bg-ink text-white shadow-sm" : "text-soil-600"}`}
            >
              Log in
            </button>
          </div>

          <div className="mt-5 space-y-4 sm:mt-6">
            <button
              type="button"
              onClick={() => void handleAppleSignIn()}
              disabled={loading || !isSupabaseConfigured}
              className="focus-ring tap-feedback type-button inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-black px-5 py-4 text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              <AppleIcon />
              Continue with Apple
            </button>

            <button
              type="button"
              onClick={() => void handleGoogleSignIn()}
              disabled={loading || !isSupabaseConfigured}
              className="focus-ring tap-feedback type-button inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-4 text-ink shadow-sm ring-1 ring-black/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="type-section-label flex items-center gap-3 text-soil-400">
              <span className="h-px flex-1 bg-black/10" />
              or
              <span className="h-px flex-1 bg-black/10" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <label className="type-body-sm block font-bold text-soil-900">
              Email
              <input
                className="focus-ring mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 font-normal"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="type-body-sm block font-bold text-soil-900">
              Password
              <input
                className="focus-ring mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 font-normal"
                type="password"
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <button
              disabled={loading || !isSupabaseConfigured}
              className="focus-ring tap-feedback type-button w-full rounded-full bg-ink px-5 py-4 text-white shadow-phone disabled:cursor-not-allowed disabled:bg-soil-600"
            >
              {loading ? "Working..." : mode === "signup" ? "Create account" : "Log in"}
            </button>
            {message ? <p className="rounded-2xl bg-soil-50 p-4 text-sm text-soil-600">{message}</p> : null}
          </form>
          </section>
        </PhoneFrame>
      </main>
    </>
  );
}
