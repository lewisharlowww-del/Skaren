"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, History, ScanBarcode } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { useScans } from "@/hooks/useScans";
import { useUser } from "@/hooks/useUser";
import { readRecentLocalProducts, type LocalProductSummary } from "@/lib/localProducts";

export default function HistoryPage() {
  const router = useRouter();
  const { user, loading: userLoading, isConfigured } = useUser();
  const { scans, loading: scansLoading } = useScans(user);
  const [localProducts, setLocalProducts] = useState<LocalProductSummary[]>([]);
  const loading = userLoading || scansLoading;

  useEffect(() => {
    setLocalProducts(readRecentLocalProducts());

    if (!userLoading && (!isConfigured || !user) && readRecentLocalProducts().length === 0) {
      router.push("/login?next=%2Fhistory");
    }
  }, [isConfigured, router, user, userLoading]);

  const visibleLocalProducts = !user && localProducts.length > 0 ? localProducts : [];

  return (
    <>
      <AppHeader />
      <main className="page-fade-up mx-auto w-full max-w-[430px] px-4 pb-36 pt-4 sm:max-w-3xl sm:py-10">
        <section className="rounded-[1.8rem] border border-white/70 bg-white/82 p-4 shadow-glass backdrop-blur-xl sm:rounded-[2rem] sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 grid h-11 w-11 place-items-center rounded-[1.15rem] bg-forest text-cream sm:mb-4 sm:h-12 sm:w-12">
                <History className="h-6 w-6" />
              </div>
              <p className="type-section-label text-forest">Scan history</p>
              <h1 className="type-display-lg mt-1 text-ink sm:mt-2">Your products</h1>
              <p className="type-body mt-2 max-w-xl text-soil-600 sm:mt-3">
                Every saved scan in one simple list, newest first.
              </p>
            </div>
            <Link
              href="/scan"
              className="focus-ring tap-feedback type-button inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-white shadow-soft"
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
        ) : scans.length === 0 && visibleLocalProducts.length === 0 ? (
          <div className="mt-5">
            <EmptyState />
          </div>
        ) : (
          <section className="mt-5 space-y-3">
            {visibleLocalProducts.map((item) => (
              <Link
                key={`${item.barcode}-${item.savedAt}`}
                href={`/product/${item.barcode}`}
                className="tap-feedback group flex min-h-24 items-center gap-3 rounded-[1.5rem] border border-black/5 bg-white p-3 shadow-sm hover:-translate-y-0.5 hover:shadow-soft"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-leaf-50">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={`${item.name} packaging`} className="h-full w-full object-contain p-1" loading="lazy" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-2xl">🌿</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="type-heading-3 line-clamp-2 text-ink">{item.name}</p>
                  <p className="type-body-sm mt-1 truncate text-soil-600">{item.brand || item.barcode}</p>
                  <p className="type-caption mt-1 text-soil-500">Saved on this device</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-soil-400 transition group-hover:translate-x-0.5" />
              </Link>
            ))}
            {scans.map((scan) => (
              <Link
                key={`${scan.barcode}-${scan.created_at}`}
                href={`/product/${scan.barcode}`}
                className="tap-feedback group flex min-h-24 items-center gap-3 rounded-[1.5rem] border border-black/5 bg-white p-3 shadow-sm hover:-translate-y-0.5 hover:shadow-soft"
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
                  <p className="type-heading-3 line-clamp-2 text-ink">{scan.product_name}</p>
                  <p className="type-body-sm mt-1 truncate text-soil-600">{scan.brand || scan.barcode}</p>
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
                  <span className="type-body-sm rounded-full bg-leaf-100 px-3 py-1 font-bold text-forest">
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
