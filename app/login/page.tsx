"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, LogIn, LogOut, ScanBarcode, UserRound } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
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

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const confirmed = searchParams.get("confirmed") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);

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

  async function handleGoogleSignIn() {
    setLoading(true);
    setMessage("");

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = (await supabase?.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo }
    })) ?? { error: new Error("Supabase is not configured yet.") };

    setLoading(false);

    if (error) {
      setMessage(error.message);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const action = await supabase?.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (action?.error) {
      setMessage(action.error.message);
      return;
    }

    if (action?.data.session) {
      document.cookie = "sb-skaren-auth-token=true; path=/; max-age=604800; SameSite=Lax";
    }

    router.push(next);
  }

  return (
    <>
      <AppHeader />
      <main className="page-fade-up mx-auto grid w-full max-w-[430px] items-start gap-4 px-4 pb-36 pt-4 md:min-h-[calc(100vh-5rem)] md:max-w-6xl md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-8 md:py-10">
        <section className="mx-auto max-w-xl text-center md:mx-0 md:text-left">
          <SkarenMark className="mx-auto mb-3 h-11 w-11 md:mx-0 md:mb-4 md:h-14 md:w-14" iconClassName="h-6 w-6 text-white md:h-8 md:w-8" />
          <p className="type-section-label text-forest">Welcome back</p>
          <h1 className="type-display-lg mt-2 text-ink">
            Track smarter choices instantly.
          </h1>
          <p className="type-body-lg mx-auto mt-3 max-w-md text-soil-600 md:mx-0">
            Save your scans, follow your progress, and unlock deeper product insights.
          </p>
          <Link
            href="/scan"
            className="focus-ring tap-feedback type-button mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-forest shadow-sm"
          >
            <ScanBarcode className="h-5 w-5" />
            Scan without logging in
          </Link>
        </section>

        <section className="mx-auto w-full max-w-[24rem] rounded-[2rem] border border-white/70 bg-white/88 p-5 shadow-glass backdrop-blur-xl sm:p-7">
          <div className="text-center">
            <SkarenMark className="mx-auto mb-3 h-11 w-11" iconClassName="h-6 w-6 text-white" />
            <h2 className="type-heading-2 text-ink">
              <SkarenWordmark />
            </h2>
            <p className="type-body-sm mt-2 text-soil-600">
              {signedInEmail ? "Your account is active on this device." : "Sign in to keep your product reports synced."}
            </p>
          </div>

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
                  href="/account"
                className="focus-ring tap-feedback type-button inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-ink px-5 py-4 text-white shadow-phone"
                >
                  <UserRound className="h-5 w-5" />
                  Go to account
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

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="type-body-sm block font-bold text-soil-900">
                  Email
                  <input
                    className="focus-ring mt-2 min-h-12 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 font-medium"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </label>
                <label className="type-body-sm block font-bold text-soil-900">
                  Password
                  <input
                    className="focus-ring mt-2 min-h-12 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 font-medium"
                    type="password"
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </label>
                <button
                  disabled={loading || !isSupabaseConfigured}
                  className="focus-ring tap-feedback type-button inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-4 text-white shadow-phone disabled:cursor-not-allowed disabled:bg-soil-600"
                >
                  <LogIn className="h-5 w-5" />
                  {loading ? "Logging in..." : "Log in"}
                </button>
              </form>
              {confirmed ? <p className="rounded-2xl bg-leaf-50 p-4 text-sm font-bold text-forest">Email confirmed. You can log in now.</p> : null}
              {message ? <p className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700">{message}</p> : null}
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
          <Link href="/scan" className="mt-5 inline-flex w-full items-center justify-center gap-2 text-sm font-black text-forest">
            Continue to scan
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
