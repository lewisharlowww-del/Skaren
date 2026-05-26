"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, History, ScanBarcode } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { useScans } from "@/hooks/useScans";
import { useUser } from "@/hooks/useUser";

export default function HistoryPage() {
  const router = useRouter();
  const { user, loading: userLoading, isConfigured } = useUser();
  const { scans, loading: scansLoading } = useScans(user);
  const loading = userLoading || scansLoading;

  useEffect(() => {
    if (!userLoading && (!isConfigured || !user)) {
      router.push("/login?next=%2Fhistory");
    }
  }, [isConfigured, router, user, userLoading]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 pb-32 pt-6 sm:py-10">
        <section className="rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-glass backdrop-blur-xl sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-[1.25rem] bg-forest text-cream">
                <History className="h-6 w-6" />
              </div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-forest">Scan history</p>
              <h1 className="mt-2 font-display text-4xl font-black tracking-[-0.05em] text-ink">Your products</h1>
              <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-soil-600">
                Every saved scan in one simple list, newest first.
              </p>
            </div>
            <Link
              href="/scan"
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 font-black text-white shadow-soft"
            >
              <ScanBarcode className="h-5 w-5" />
              Scan
            </Link>
          </div>
        </section>

        {loading ? (
          <div className="mt-5 space-y-3">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="skeleton-shimmer h-24 rounded-[1.5rem] bg-white/70" />
            ))}
          </div>
        ) : scans.length === 0 ? (
          <div className="mt-5">
            <EmptyState />
          </div>
        ) : (
          <section className="mt-5 space-y-3">
            {scans.map((scan) => (
              <Link
                key={`${scan.barcode}-${scan.created_at}`}
                href={`/product/${scan.barcode}`}
                className="group flex min-h-24 items-center gap-3 rounded-[1.5rem] border border-black/5 bg-white p-3 shadow-sm transition active:scale-[0.99] hover:-translate-y-0.5 hover:shadow-soft"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-leaf-50">
                  {scan.product_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={scan.product_image} alt={`${scan.product_name} packaging`} className="h-full w-full object-contain p-1" loading="lazy" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-2xl">🌿</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-black leading-5 text-ink">{scan.product_name}</p>
                  <p className="mt-1 truncate text-sm font-semibold text-soil-600">{scan.brand || scan.barcode}</p>
                  {scan.created_at ? (
                    <p className="mt-1 text-xs font-bold text-soil-500">
                      {new Date(scan.created_at).toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="rounded-full bg-leaf-100 px-3 py-1 text-sm font-black text-forest">
                    {scan.ecoscan_score}
                  </span>
                  <ArrowRight className="h-4 w-4 text-soil-400 transition group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </section>
        )}
      </main>
    </>
  );
}
