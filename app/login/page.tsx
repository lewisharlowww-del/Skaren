"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  UserRound
} from "lucide-react";
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

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next");
  const next =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/account";
  const confirmed = searchParams.get("confirmed") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const destinationLabel = next.startsWith("/account")
    ? "your account"
    : next.startsWith("/stats")
      ? "your stats"
      : next.startsWith("/history")
        ? "your history"
        : "Skaren";

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

      if (!active) return;

      setSignedInEmail(data.user?.email ?? null);
      setCheckingSession(false);
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  async function signOut() {
    await supabase?.auth.signOut();
    document.cookie = "sb-skaren-auth-token=; path=/; max-age=0; SameSite=Lax";
    setSignedInEmail(null);
    router.refresh();
  }

  async function handleOAuthSignIn(provider: "google" | "apple") {
    setLoading(true);
    setMessage("");
    setEmailError("");
    setPasswordError("");

    if (!supabase) {
      setMessage("Supabase is not configured yet.");
      setLoading(false);
      return;
    }

    const { Capacitor } = await import("@capacitor/core");
    const isNative = Capacitor.isNativePlatform();

    const redirectTo = isNative
      ? `no.skaren.app://auth/callback?next=${encodeURIComponent(next)}`
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
    setEmailError("");
    setPasswordError("");

    const action = await supabase?.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (action?.error) {
      const errorText = action.error.message.toLowerCase();
      if (errorText.includes("email")) {
        setEmailError(action.error.message);
      } else if (
        errorText.includes("credential") ||
        errorText.includes("password")
      ) {
        setPasswordError("The email or password is incorrect.");
      } else {
        setMessage(action.error.message);
      }
      return;
    }

    if (action?.data.session) {
      document.cookie = "sb-skaren-auth-token=true; path=/; max-age=604800; SameSite=Lax";
    }

    router.push(next);
  }

  async function handleForgotPassword() {
    setMessage("");
    setEmailError("");
    if (!email.trim()) {
      setEmailError("Enter your email address first.");
      return;
    }

    setResettingPassword(true);
    const { error } = (await supabase?.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`
    })) ?? { error: new Error("Supabase is not configured yet.") };
    setResettingPassword(false);

    if (error) {
      setEmailError(error.message);
      return;
    }
    setMessage("Password reset link sent. Check your email.");
  }

  return (
    <div className="sk-auth-background min-h-[100dvh]">
      <header className="border-b border-black/[0.06] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between px-5 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <Link href="/" className="focus-ring flex items-center gap-2.5">
            <SkarenMark className="h-9 w-9" />
            <SkarenWordmark className="text-[1.45rem]" />
          </Link>
          <Link
            href="/scan"
            className="focus-ring inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-[12px] font-bold text-forest"
          >
            Skip login
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Link>
        </div>
      </header>

      <main className="page-fade-up mx-auto w-full max-w-[430px] px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-5">
        <section className="mx-auto w-full max-w-[24rem]">
          <div className="mb-5">
            <p className="type-section-label text-forest">Welcome back</p>
            <h1 className="type-heading-1 mt-1.5 text-ink">Sign in to Skaren</h1>
            <p className="type-body-sm mt-2 text-soil-600">
              Continue to {destinationLabel} and keep your product reports synced.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/70 bg-white/90 p-5 shadow-glass backdrop-blur-xl sm:p-7">

          {!isSupabaseConfigured ? <SupabaseNotice /> : null}

          {checkingSession ? (
            <div className="mt-6 space-y-3">
              <div className="h-14 animate-pulse rounded-2xl bg-soil-100" />
              <div className="h-14 animate-pulse rounded-2xl bg-soil-100" />
              <div className="h-14 animate-pulse rounded-full bg-soil-100" />
            </div>
          ) : signedInEmail ? (
            <div className="mt-6">
              <div className="rounded-[1.5rem] bg-leaf-50 p-5 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-forest shadow-sm">
                  <CheckCircle2 className="h-6 w-6" />
                </span>
                <p className="type-section-label mt-3 text-soil-500">Logged in</p>
                <p className="type-heading-3 mt-1 truncate text-ink">{signedInEmail}</p>
              </div>
              <div className="mt-5 grid gap-3">
                <Link
                  href={next}
                className="focus-ring tap-feedback type-button inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-ink px-5 py-4 text-white shadow-phone"
                >
                  <UserRound className="h-5 w-5" />
                  Continue to {destinationLabel}
                </Link>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="focus-ring tap-feedback type-button inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-white px-5 py-4 text-soil-700 shadow-sm"
                >
                  <LogOut className="h-5 w-5" />
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <button
                type="button"
                onClick={() => void handleAppleSignIn()}
                disabled={loading || !isSupabaseConfigured}
                className="focus-ring tap-feedback type-button inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-black px-5 py-4 text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                <AppleIcon />
                {loading ? "Connecting..." : "Continue with Apple"}
              </button>

              <button
                type="button"
                onClick={() => void handleGoogleSignIn()}
                disabled={loading || !isSupabaseConfigured}
                className="focus-ring tap-feedback type-button inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-4 text-ink shadow-sm ring-1 ring-black/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <GoogleIcon />
                {loading ? "Connecting..." : "Continue with Google"}
              </button>

              <div className="type-section-label flex items-center gap-3 text-soil-400">
                <span className="h-px flex-1 bg-black/10" />
                or
                <span className="h-px flex-1 bg-black/10" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="type-body-sm block font-bold text-soil-900">
                  Email
                  <input
                    className={`focus-ring mt-2 min-h-12 w-full rounded-2xl border bg-white px-4 py-3 font-medium ${
                      emailError ? "border-rose-400" : "border-black/10"
                    }`}
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setEmailError("");
                    }}
                    autoComplete="email"
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? "login-email-error" : undefined}
                    disabled={loading || resettingPassword}
                    required
                  />
                  {emailError ? (
                    <span id="login-email-error" className="mt-1.5 block text-xs font-semibold text-rose-700">
                      {emailError}
                    </span>
                  ) : null}
                </label>
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="login-password" className="type-body-sm font-bold text-soil-900">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => void handleForgotPassword()}
                      disabled={loading || resettingPassword || !isSupabaseConfigured}
                      className="focus-ring min-h-9 text-[11px] font-bold text-forest disabled:opacity-50"
                    >
                      {resettingPassword ? "Sending..." : "Forgot password?"}
                    </button>
                  </div>
                  <div className="relative mt-2">
                    <input
                      id="login-password"
                      className={`focus-ring min-h-12 w-full rounded-2xl border bg-white py-3 pl-4 pr-12 font-medium ${
                        passwordError ? "border-rose-400" : "border-black/10"
                      }`}
                      type={showPassword ? "text" : "password"}
                      minLength={6}
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setPasswordError("");
                      }}
                      autoComplete="current-password"
                      aria-invalid={Boolean(passwordError)}
                      aria-describedby={passwordError ? "login-password-error" : undefined}
                      disabled={loading || resettingPassword}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((shown) => !shown)}
                      className="focus-ring absolute right-1 top-1 grid h-10 w-10 place-items-center rounded-xl text-soil-500"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {passwordError ? (
                    <p id="login-password-error" className="mt-1.5 text-xs font-semibold text-rose-700">
                      {passwordError}
                    </p>
                  ) : null}
                </div>
                <button
                  disabled={loading || resettingPassword || !isSupabaseConfigured}
                  className="focus-ring tap-feedback type-button inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-4 text-white shadow-phone disabled:cursor-not-allowed disabled:bg-soil-600"
                >
                  <LogIn className="h-5 w-5" />
                  {loading ? "Logging in..." : "Log in"}
                </button>
              </form>
              {confirmed ? <p className="rounded-2xl bg-leaf-50 p-4 text-sm font-bold text-forest">Email confirmed. You can log in now.</p> : null}
              {message ? (
                <p
                  className={`rounded-2xl p-4 text-sm font-bold ${
                    message.startsWith("Password reset")
                      ? "bg-leaf-50 text-forest"
                      : "bg-rose-50 text-rose-700"
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  {message}
                </p>
              ) : null}
            </div>
          )}

          {!signedInEmail ? (
            <p className="mt-6 text-center text-sm font-medium text-soil-600">
              New to Skaren?{" "}
              <Link href="/auth" className="font-black text-forest underline decoration-leaf-300 decoration-2 underline-offset-4">
                Create an account
              </Link>
            </p>
          ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
