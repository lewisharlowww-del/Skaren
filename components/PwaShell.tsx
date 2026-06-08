"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { SkarenMark, SkarenWordmark } from "@/components/SkarenLogo";

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

export function PwaShell() {
  const [showLaunch, setShowLaunch] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.warn("[PWA] Service worker registration failed:", error);
      });
    }

    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    if (isStandaloneMode()) {
      setShowLaunch(true);
      const timer = window.setTimeout(() => setShowLaunch(false), 700);
      return () => {
        window.clearTimeout(timer);
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      };
    }

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return (
    <>
      {showLaunch ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-porcelain text-ink">
          <div className="text-center">
            <SkarenMark className="mx-auto h-20 w-20 rounded-[1.7rem]" iconClassName="h-11 w-11 text-white" />
            <SkarenWordmark className="mx-auto mt-5 text-4xl" />
            <p className="mt-2 text-sm font-bold text-forest">Scan smarter. Live cleaner.</p>
          </div>
        </div>
      ) : null}

      {!online ? (
        <div className="fixed inset-x-4 top-[calc(0.8rem+env(safe-area-inset-top))] z-[70] mx-auto flex max-w-[430px] items-center gap-3 rounded-2xl border border-white/10 bg-[var(--sk-text-primary)]/95 px-4 py-3 text-sm font-bold text-white shadow-phone backdrop-blur-xl">
          <WifiOff className="h-5 w-5 text-leaf-200" />
          Offline mode. Recent pages and images may still work.
        </div>
      ) : null}

    </>
  );
}
