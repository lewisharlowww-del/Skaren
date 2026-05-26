import Link from "next/link";
import { ScanBarcode } from "lucide-react";

export function EmptyState() {
  return (
    <div className="rounded-[2rem] border border-dashed border-black/10 bg-white p-8 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-lime-100 text-ink">
        <ScanBarcode className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-bold text-ink">No scans yet</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-soil-600">
        Start with a barcode you have nearby and Skaren will build your history from there.
      </p>
      <Link
        href="/scan"
        className="focus-ring mt-5 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-soft"
      >
        Analyze a product
      </Link>
    </div>
  );
}
