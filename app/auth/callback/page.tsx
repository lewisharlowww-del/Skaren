"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SkarenMark } from "@/components/SkarenLogo";
import { supabase } from "@/lib/supabase";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  useEffect(() => {
    let active = true;

    async function finishLogin() {
      const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } };

      if (!active) return;

      if (data.session) {
        document.cookie = "sb-skaren-auth-token=true; path=/; max-age=604800; SameSite=Lax";
        router.replace(next);
        return;
      }

      router.replace("/login?error=google");
    }

    finishLogin();

    return () => {
      active = false;
    };
  }, [next, router]);

  return (
    <main className="grid min-h-screen place-items-center bg-mint px-6">
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
