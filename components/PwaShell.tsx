"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, Share, Smartphone, WifiOff, X } from "lucide-react";
import { SkarenMark } from "@/components/SkarenLogo";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const dismissKey = "skaren:pwa-install-dismissed-at";
const dismissDays = 14;

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

function isMobileDevice() {
  if (typeof window === "undefined") return false;
  return /android|iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isIosSafari() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
  return isIos && isSafari;
}

function wasDismissedRecently() {
  const dismissedAt = Number(window.localStorage.getItem(dismissKey) ?? "0");
  if (!dismissedAt) return false;
  return Date.now() - dismissedAt < dismissDays * 24 * 60 * 60 * 1000;
}

export function PwaShell() {
  const pathname = usePathname();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showLaunch, setShowLaunch] = useState(false);
  const [online, setOnline] = useState(true);

  const canShowInstall = useMemo(() => {
    if (pathname.startsWith("/product")) return false;
    if (pathname.startsWith("/login") || pathname.startsWith("/auth")) return false;
    return true;
  }, [pathname]);

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

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  useEffect(() => {
    if (!canShowInstall || isStandaloneMode() || !isMobileDevice() || wasDismissedRecently()) {
      setShowInstall(false);
      return;
    }

    const timer = window.setTimeout(() => {
      if (installPrompt || isIosSafari()) setShowInstall(true);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [canShowInstall, installPrompt, pathname]);

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice.catch(() => null);
    setInstallPrompt(null);
    setShowInstall(false);
  }

  function dismissInstall() {
    window.localStorage.setItem(dismissKey, String(Date.now()));
    setShowInstall(false);
  }

  return (
    <>
      {showLaunch ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-porcelain text-ink">
          <div className="text-center">
            <SkarenMark className="mx-auto h-20 w-20 rounded-[1.7rem]" iconClassName="h-11 w-11 text-white" />
            <p className="mt-5 font-display text-3xl font-black tracking-[-0.04em]">Skaren</p>
            <p className="mt-2 text-sm font-bold text-forest">Scan smarter. Live cleaner.</p>
          </div>
        </div>
      ) : null}

      {!online ? (
        <div className="fixed inset-x-4 top-[calc(0.8rem+env(safe-area-inset-top))] z-[70] mx-auto flex max-w-[430px] items-center gap-3 rounded-2xl border border-white/10 bg-[#101b14]/95 px-4 py-3 text-sm font-bold text-white shadow-phone backdrop-blur-xl">
          <WifiOff className="h-5 w-5 text-leaf-200" />
          Offline mode. Recent pages and images may still work.
        </div>
      ) : null}

      {showInstall ? (
        <div className="fixed inset-x-4 bottom-[6.2rem] z-[60] mx-auto max-w-[430px] rounded-[1.5rem] border border-white/70 bg-white/90 p-4 shadow-phone backdrop-blur-2xl">
          <button
            type="button"
            onClick={dismissInstall}
            aria-label="Dismiss install prompt"
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-soil-50 text-soil-600"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex gap-3 pr-8">
            <SkarenMark className="h-12 w-12 shrink-0 rounded-[1rem]" iconClassName="h-7 w-7 text-white" />
            <div>
              <p className="font-black text-ink">Install Skaren</p>
              <p className="mt-1 text-sm font-semibold leading-5 text-soil-600">
                Open faster, scan from your home screen, and keep recent reports available.
              </p>
            </div>
          </div>
          {installPrompt ? (
            <button
              type="button"
              onClick={() => void installApp()}
              className="focus-ring tap-feedback mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 font-black text-white"
            >
              <Download className="h-5 w-5" />
              Install app
            </button>
          ) : (
            <div className="mt-4 rounded-2xl bg-leaf-50 p-3 text-sm font-bold leading-5 text-forest">
              <p className="flex items-center gap-2"><Share className="h-4 w-4" /> On iPhone: tap Share, then Add to Home Screen.</p>
              <p className="mt-1 flex items-center gap-2"><Smartphone className="h-4 w-4" /> Skaren will open like a normal app.</p>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
