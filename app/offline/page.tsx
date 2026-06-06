import Link from "next/link";
import { WifiOff, ScanBarcode } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";

export default function OfflinePage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-[430px] place-items-center px-4 pb-36 pt-8">
        <section className="w-full rounded-[2rem] border border-white/70 bg-white/85 p-6 text-center shadow-glass backdrop-blur-xl">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-leaf-100 text-forest">
            <WifiOff className="h-8 w-8" />
          </div>
          <h1 className="type-heading-1 mt-5 text-ink">You are offline</h1>
          <p className="type-body-lg mt-3 text-soil-600">
            Skaren can still open recently viewed pages and cached product images. Reconnect to scan new products.
          </p>
          <Link
            href="/scan"
            className="focus-ring tap-feedback type-button mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-white"
          >
            <ScanBarcode className="h-5 w-5" />
            Back to scan
          </Link>
        </section>
      </main>
    </>
  );
}
