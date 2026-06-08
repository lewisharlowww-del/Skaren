"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { PackageSearch } from "lucide-react";
import type { KassalappSearchProduct } from "@/lib/kassalapp";

export function ProductSearchThumbnail({
  product,
  className = "h-16 w-16"
}: {
  product: KassalappSearchProduct;
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(product.image && !imageFailed);

  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-xl border border-[var(--sk-border-green)] bg-[var(--sk-surface-insight)] ${className}`}
    >
      {showImage ? (
        <img
          src={product.image ?? ""}
          alt=""
          className="h-full w-full object-contain"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <>
          <span
            className="absolute inset-0 bg-[radial-gradient(circle_at_28%_20%,rgba(200,232,204,0.95),transparent_44%),linear-gradient(145deg,#f8fdf8_0%,#eaf5ec_56%,#d8eddc_100%)]"
            aria-hidden="true"
          />
          <span
            className="absolute -right-5 -top-5 h-12 w-12 rounded-full bg-white/45"
            aria-hidden="true"
          />
          <span
            className="absolute -bottom-6 -left-4 h-14 w-14 rounded-full bg-[var(--sk-brand-leaf)]/10"
            aria-hidden="true"
          />
          <PackageSearch
            className="relative h-6 w-6 text-[var(--sk-brand-forest)]/70"
            aria-hidden="true"
          />
        </>
      )}
    </div>
  );
}
