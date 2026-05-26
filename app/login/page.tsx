"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, LogIn, LogOut, ScanBarcode, UserRound } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { SkarenMark, SkarenWordmark } from "@/components/SkarenLogo";
import { SupabaseNotice } from "@/components/SupabaseNotice";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

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
      <main className="mx-auto grid max-w-6xl items-start gap-7 px-4 pb-20 pt-7 md:min-h-[calc(100vh-5rem)] md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-8 md:py-10">
        <section className="mx-auto max-w-xl text-center md:mx-0 md:text-left">
          <SkarenMark className="mx-auto mb-4 h-14 w-14 md:mx-0" iconClassName="h-8 w-8 text-white" />
          <p className="font-black uppercase tracking-[0.16em] text-forest">Welcome back</p>
          <h1 className="font-display mt-3 text-4xl font-black leading-tight tracking-[-0.05em] text-ink sm:text-5xl">
            Log in to keep your scans synced.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base font-medium leading-7 text-soil-600 md:mx-0 md:text-lg md:leading-8">
            See your history, streaks, and product stats across your phone and laptop.
          </p>
          <Link
            href="/scan"
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-black text-forest shadow-sm"
          >
            <ScanBarcode className="h-5 w-5" />
            Scan without logging in
          </Link>
        </section>

        <section className="mx-auto w-full max-w-[25rem] rounded-[2.25rem] border border-white/70 bg-white/85 p-6 shadow-glass backdrop-blur-xl sm:p-8">
          <div className="text-center">
            <SkarenMark className="mx-auto mb-4 h-14 w-14" iconClassName="h-8 w-8 text-white" />
            <h2 className="text-3xl font-black text-ink">
              <SkarenWordmark />
            </h2>
            <p className="mt-2 text-sm font-medium text-soil-600">
              {signedInEmail ? "Your account is active on this device." : "Log in to your Skaren account."}
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
                <p className="mt-3 text-sm font-black uppercase tracking-[0.14em] text-soil-500">Logged in</p>
                <p className="mt-1 truncate text-lg font-black text-ink">{signedInEmail}</p>
              </div>
              <div className="mt-5 grid gap-3">
                <Link
                  href="/account"
                  className="focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-ink px-5 py-4 font-black text-white shadow-phone"
                >
                  <UserRound className="h-5 w-5" />
                  Go to account
                </Link>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-white px-5 py-4 font-black text-soil-700 shadow-sm"
                >
                  <LogOut className="h-5 w-5" />
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block text-sm font-black text-soil-900">
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
              <label className="block text-sm font-black text-soil-900">
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
                className="focus-ring inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-4 font-black text-white shadow-phone disabled:cursor-not-allowed disabled:bg-soil-600"
              >
                <LogIn className="h-5 w-5" />
                {loading ? "Logging in..." : "Log in"}
              </button>
              {confirmed ? <p className="rounded-2xl bg-leaf-50 p-4 text-sm font-bold text-forest">Email confirmed. You can log in now.</p> : null}
              {message ? <p className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700">{message}</p> : null}
            </form>
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
