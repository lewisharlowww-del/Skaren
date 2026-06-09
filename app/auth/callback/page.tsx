"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { SkarenMark } from "@/components/SkarenLogo";
import { supabase } from "@/lib/supabase";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next");
  const next =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/dashboard";
  const oauthCode = searchParams.get("code");

  useEffect(() => {
    let active = true;
    let completed = false;
    let failureTimer: number | undefined;

    function finishLogin(session: Session) {
      if (!active || completed) return;
      completed = true;
      if (failureTimer) window.clearTimeout(failureTimer);
      document.cookie = "sb-skaren-auth-token=true; path=/; max-age=604800; SameSite=Lax";
      router.replace(next);
    }

    async function waitForSession() {
      if (!supabase) {
        router.replace(`/login?next=${encodeURIComponent(next)}&error=google`);
        return;
      }

      const listener = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          window.setTimeout(() => finishLogin(session), 0);
        }
      });

      const { data: initialData } = await supabase.auth.getSession();
      if (initialData.session) {
        finishLogin(initialData.session);
      }

      if (!completed && oauthCode) {
        const { data } = await supabase.auth.exchangeCodeForSession(oauthCode);
        if (data.session) {
          finishLogin(data.session);
        }
      }

      for (let attempt = 0; active && !completed && attempt < 20; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 250));
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          finishLogin(data.session);
        }
      }

      failureTimer = window.setTimeout(() => {
        if (active && !completed) {
          listener.data.subscription.unsubscribe();
          router.replace(`/login?next=${encodeURIComponent(next)}&error=google`);
        }
      }, 500);

      return listener;
    }

    const listenerPromise = waitForSession();

    return () => {
      active = false;
      if (failureTimer) window.clearTimeout(failureTimer);
      void listenerPromise.then((listener) => {
        listener?.data.subscription.unsubscribe();
      });
    };
  }, [next, oauthCode, router]);

  return (
    <main className="sk-auth-background grid min-h-screen place-items-center px-6">
      <section className="page-fade-up w-full max-w-sm rounded-[2rem] bg-white p-8 text-center shadow-glass">
        <SkarenMark className="mx-auto h-14 w-14" iconClassName="h-8 w-8 text-white" />
        <h1 className="mt-5 text-2xl font-black text-ink">Signing you in</h1>
        <p className="mt-2 text-sm font-semibold text-soil-600">Skaren is connecting your Google account.</p>
        <div className="skeleton-shimmer mt-6 h-3 overflow-hidden rounded-full bg-leaf-50">
          <div className="h-full w-1/2 rounded-full bg-forest" />
        </div>
      </section>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackContent />
    </Suspense>
  );
}
