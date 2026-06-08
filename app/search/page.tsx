"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Crown,
  PackageSearch,
  Search,
  X
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { ProductSearchThumbnail } from "@/components/ProductSearchThumbnail";
import { Spinner } from "@/components/Spinner";
import { markSearchProductForHistory } from "@/lib/productHistory";
import { getUserPremiumStatus } from "@/lib/premium";
import { supabase } from "@/lib/supabase";
import type { KassalappSearchProduct } from "@/lib/kassalapp";

type SearchResponse = {
  products?: KassalappSearchProduct[];
  error?: string;
};

const resultsPerPage = 20;

export default function ProductSearchPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KassalappSearchProduct[]>([]);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(resultsPerPage);

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      const premium = supabase ? await getUserPremiumStatus(supabase) : false;
      if (!active) return;
      setIsPremium(premium);
      setCheckingAccess(false);
      if (premium) {
        window.setTimeout(() => inputRef.current?.focus(), 100);
      }
    }

    void checkAccess();

    return () => {
      active = false;
    };
  }, []);

  async function searchProducts(event?: FormEvent) {
    event?.preventDefault();
    const cleanQuery = query.trim();

    if (cleanQuery.length < 2) {
      setError("Enter at least two characters.");
      setResults([]);
      return;
    }

    setLoading(true);
    setError("");
    setHasSearched(true);
    setVisibleCount(resultsPerPage);

    try {
      const { data: sessionData } = (await supabase?.auth.getSession()) ?? {
        data: { session: null }
      };
      const token = sessionData.session?.access_token;

      if (!token) {
        router.push("/login?next=%2Fsearch");
        return;
      }

      const response = await fetch(
        `/api/products/search?q=${encodeURIComponent(cleanQuery)}`,
        {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = (await response.json()) as SearchResponse;

      if (response.status === 401) {
        router.push("/login?next=%2Fsearch");
        return;
      }

      if (response.status === 403) {
        setIsPremium(false);
        return;
      }

      if (!response.ok) {
        setResults([]);
        setError(data.error ?? "Search is unavailable right now. Try again.");
        return;
      }

      setResults(data.products ?? []);
    } catch {
      setResults([]);
      setError("Search is unavailable right now. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function clearSearch() {
    setQuery("");
    setResults([]);
    setError("");
    setHasSearched(false);
    setVisibleCount(resultsPerPage);
    inputRef.current?.focus();
  }

  if (checkingAccess) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--sk-brand-mist)]">
        <Spinner size={28} />
      </main>
    );
  }

  if (!isPremium) {
    return (
      <>
        <BottomNav />
        <main className="min-h-screen bg-[var(--sk-brand-mist)] px-4 pb-32 pt-16">
          <div className="mx-auto flex max-w-sm flex-col items-center text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-100">
              <Crown className="h-8 w-8 text-amber-700" />
            </div>
            <h1 className="type-heading-1 mt-5 text-[var(--sk-text-primary)]">
              Search products
            </h1>
            <p className="type-body-sm mt-3 max-w-xs text-[var(--sk-text-muted)]">
              Find Norwegian grocery products by name without scanning a barcode.
            </p>
            <Link
              href="/pricing"
              className="mt-6 inline-flex h-12 items-center rounded-full bg-[var(--sk-brand-forest)] px-6 text-sm font-bold text-white"
            >
              View Pro
            </Link>
            <Link
              href="/scan"
              className="mt-4 text-sm font-semibold text-[var(--sk-brand-forest)]"
            >
              Back to scan
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <BottomNav />
      <main className="min-h-screen bg-[var(--sk-brand-mist)] pb-32 text-[var(--sk-text-primary)]">
        <div className="mx-auto w-full max-w-xl px-4 pb-8 pt-[calc(1rem+env(safe-area-inset-top))]">
          <header className="flex items-center gap-3 py-2">
            <Link
              href="/scan"
              aria-label="Back to scan"
              className="focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[var(--sk-brand-forest)]"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <p className="type-section-label text-[var(--sk-text-muted)]">Kassalapp</p>
              <h1 className="type-heading-2">Search products</h1>
            </div>
          </header>

          <form onSubmit={searchProducts} className="mt-4">
            <div className="flex items-center rounded-2xl border border-[var(--sk-border-default)] bg-white px-4">
              <Search className="h-5 w-5 shrink-0 text-[var(--sk-text-muted)]" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Milk, salmon, yogurt..."
                aria-label="Search Norwegian products"
                autoComplete="off"
                className="h-14 min-w-0 flex-1 bg-transparent px-3 text-[16px] font-semibold outline-none placeholder:font-normal placeholder:text-[var(--sk-text-faint)]"
              />
              {query ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="grid h-10 w-10 place-items-center rounded-full text-[var(--sk-text-muted)]"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={loading || query.trim().length < 2}
              className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--sk-brand-forest)] text-sm font-bold text-white disabled:opacity-45"
            >
              {loading ? <Spinner size={16} /> : <Search className="h-4 w-4" />}
              {loading ? "Searching..." : "Search"}
            </button>
          </form>

          <section className="mt-6" aria-live="polite">
            {error ? (
              <div className="rounded-2xl border border-[var(--sk-border-red)] bg-[var(--sk-surface-card-red)] p-4 text-sm text-[var(--sk-text-red)]">
                {error}
              </div>
            ) : null}

            {!hasSearched && !loading ? (
              <div className="flex flex-col items-center px-6 pt-12 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--sk-grade-a-bg)] text-[var(--sk-brand-forest)]">
                  <PackageSearch className="h-8 w-8" />
                </div>
                <h2 className="type-heading-3 mt-5">Find it by name</h2>
                <p className="type-body-sm mt-2 max-w-xs text-[var(--sk-text-muted)]">
                  Search products sold in Norwegian grocery stores, then open the full Skaren report.
                </p>
              </div>
            ) : null}

            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-[5.5rem] animate-pulse rounded-2xl border border-[var(--sk-border-default)] bg-white"
                  />
                ))}
              </div>
            ) : null}

            {hasSearched && !loading && !error && results.length === 0 ? (
              <div className="rounded-2xl border border-[var(--sk-border-default)] bg-white px-5 py-8 text-center">
                <h2 className="type-heading-3">No products found</h2>
                <p className="type-body-sm mt-2 text-[var(--sk-text-muted)]">
                  Try a shorter name, another spelling, or include the brand.
                </p>
              </div>
            ) : null}

            {results.length > 0 && !loading ? (
              <>
                <p className="type-section-label mb-3 px-1 text-[var(--sk-text-muted)]">
                  {results.length} results
                </p>
                <div className="space-y-3">
                  {results.slice(0, visibleCount).map((product) => {
                    return (
                      <Link
                        key={`${product.barcode}-${product.name}`}
                        href={`/product/${product.barcode}`}
                        onClick={() =>
                          markSearchProductForHistory(product.barcode ?? "")
                        }
                        className="focus-ring flex min-h-[5.5rem] items-center gap-4 rounded-2xl border border-[var(--sk-border-default)] bg-white px-3 py-3 transition active:scale-[0.99]"
                      >
                        <ProductSearchThumbnail product={product} />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-[14px] font-bold leading-snug">
                            {product.name}
                          </p>
                          <p className="mt-1 truncate text-[12px] text-[var(--sk-text-muted)]">
                            {product.brand}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 shrink-0 text-[var(--sk-text-faint)]" />
                      </Link>
                    );
                  })}
                </div>
                {visibleCount < results.length ? (
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((count) =>
                        Math.min(count + resultsPerPage, results.length)
                      )
                    }
                    className="focus-ring mt-4 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-[var(--sk-border-default)] bg-white text-sm font-bold text-[var(--sk-brand-forest)] transition active:scale-[0.99]"
                  >
                    Load more
                  </button>
                ) : null}
              </>
            ) : null}
          </section>
        </div>
      </main>
    </>
  );
}
