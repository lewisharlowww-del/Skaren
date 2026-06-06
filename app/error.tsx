"use client";

import Link from "next/link";
import { AlertCircle, RotateCcw, ScanBarcode } from "lucide-react";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[App] Render error:", error);

  return (
    <main className="mx-auto grid min-h-screen max-w-xl place-items-center px-4 py-10">
      <section className="w-full rounded-[2rem] border border-black/5 bg-white p-6 text-center shadow-soft">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-rose-600">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="type-heading-1 mt-5 text-ink">Something went wrong</h1>
        <p className="type-body-lg mt-3 text-soil-600">
          Skaren could not load this screen. Try again, or scan another product.
        </p>
        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={reset}
            className="focus-ring type-button inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-white"
          >
            <RotateCcw className="h-5 w-5" />
            Try again
          </button>
          <Link
            href="/scan"
            className="focus-ring type-button inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-leaf-100 px-5 py-3 text-forest"
          >
            <ScanBarcode className="h-5 w-5" />
            Scan product
          </Link>
        </div>
      </section>
    </main>
  );
}
