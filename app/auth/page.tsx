"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { PhoneFrame } from "@/components/PhoneFrame";
import { SkarenMark, SkarenWordmark } from "@/components/SkarenLogo";
import { SupabaseNotice } from "@/components/SupabaseNotice";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
      <main className="mx-auto grid max-w-6xl items-start gap-7 px-4 pb-12 pt-7 md:min-h-[calc(100vh-5rem)] md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-8 md:py-10">
        <section className="mx-auto max-w-xl text-center md:mx-0 md:text-left">
          <SkarenMark className="mx-auto mb-4 h-12 w-12 md:mx-0 md:mb-5 md:h-14 md:w-14" iconClassName="h-8 w-8 text-white" />
          <h1 className="text-4xl font-black leading-tight text-ink sm:text-5xl">Save your product history</h1>
          <p className="mx-auto mt-3 max-w-md text-base leading-7 text-soil-600 md:mx-0 md:mt-4 md:text-lg md:leading-8">
            Create a free account when you want saved scans, streaks, and dashboard stats.
          </p>
        </section>

        <PhoneFrame className="mx-auto w-full max-w-[21rem] md:max-w-[22rem]" contentClassName="min-h-0 px-5 pb-6 pt-9 sm:px-7 sm:pb-8 sm:pt-10">
          <section>
          <div className="mb-5 text-center sm:mb-7">
            <SkarenMark className="mx-auto mb-3 h-12 w-12 sm:mb-4 sm:h-14 sm:w-14" iconClassName="h-8 w-8 text-white" />
            <h2 className="text-2xl font-black text-ink sm:text-3xl"><SkarenWordmark /></h2>
            <p className="mt-2 text-sm text-soil-600">Sign in to keep your scans synced.</p>
          </div>
          {!isSupabaseConfigured ? <SupabaseNotice /> : null}
          <div className="mt-5 grid grid-cols-2 rounded-full bg-soil-100 p-1">
            <button
              onClick={() => setMode("signup")}
              className={`rounded-full px-4 py-3 text-sm font-bold ${mode === "signup" ? "bg-ink text-white shadow-sm" : "text-soil-600"}`}
            >
              Sign up
            </button>
            <button
              onClick={() => setMode("login")}
              className={`rounded-full px-4 py-3 text-sm font-bold ${mode === "login" ? "bg-ink text-white shadow-sm" : "text-soil-600"}`}
            >
              Log in
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4 sm:mt-6">
            <label className="block text-sm font-bold text-soil-900">
              Email
              <input
                className="focus-ring mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 font-normal"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="block text-sm font-bold text-soil-900">
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
              className="focus-ring w-full rounded-full bg-ink px-5 py-4 font-bold text-white shadow-phone disabled:cursor-not-allowed disabled:bg-soil-600"
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
