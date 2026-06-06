"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Search, ScanBarcode } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { HomeInfoPopover } from "@/components/HomeInfoPopover";
import { t } from "@/lib/i18n";

interface SplashScreenProps {
  onComplete: () => void;
}

const splashStorageKey = "skarenSplashShown";

function useSplashScreen() {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem(splashStorageKey) !== "true") {
      setShowSplash(true);
    }
  }, []);

  function completeSplash() {
    window.sessionStorage.setItem(splashStorageKey, "true");
    setShowSplash(false);
  }

  return { showSplash, completeSplash };
}

function SplashScreen({ onComplete }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 3150);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "var(--sk-text-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 0
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.5, scale: 1.15 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            style={{
              position: "absolute",
              width: 280,
              height: 280,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(76,175,125,0.14) 0%, transparent 70%)"
            }}
          />

          <div
            style={{
              position: "relative",
              width: 120,
              height: 120,
              marginBottom: 36
            }}
          >
            {[
              {
                top: 0,
                left: 0,
                borderTop: "2.2px solid var(--sk-brand-leaf)",
                borderLeft: "2.2px solid var(--sk-brand-leaf)",
                delay: 0.12
              },
              {
                top: 0,
                right: 0,
                borderTop: "2.2px solid var(--sk-brand-leaf)",
                borderRight: "2.2px solid var(--sk-brand-leaf)",
                delay: 0.19
              },
              {
                bottom: 0,
                left: 0,
                borderBottom: "2.2px solid var(--sk-brand-leaf)",
                borderLeft: "2.2px solid var(--sk-brand-leaf)",
                delay: 0.26
              },
              {
                bottom: 0,
                right: 0,
                borderBottom: "2.2px solid var(--sk-brand-leaf)",
                borderRight: "2.2px solid var(--sk-brand-leaf)",
                delay: 0.33
              }
            ].map(({ delay, ...corner }, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay,
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1]
                }}
                style={{
                  position: "absolute",
                  width: 24,
                  height: 24,
                  borderRadius: 5,
                  ...corner
                }}
              />
            ))}

            <div
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                right: 8,
                bottom: 8,
                overflow: "hidden",
                borderRadius: 3
              }}
            >
              <motion.div
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: 104, opacity: 0 }}
                transition={{
                  delay: 0.52,
                  duration: 0.5,
                  ease: [0.4, 0, 0.6, 1]
                }}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: 2,
                  background:
                    "linear-gradient(90deg, transparent, var(--sk-brand-leaf), var(--sk-grade-a-border), var(--sk-brand-leaf), transparent)",
                  boxShadow: "0 0 16px 4px rgba(76,175,125,0.7)"
                }}
              />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.16 }}
              transition={{ delay: 0.56, duration: 0.25 }}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                display: "flex",
                gap: 4,
                alignItems: "center"
              }}
            >
              {[40, 56, 30, 52, 22, 56, 38, 48, 26, 56, 34].map(
                (height, index) => (
                  <div
                    key={index}
                    style={{
                      background: "var(--sk-brand-leaf)",
                      borderRadius: 1,
                      width: index % 3 === 1 ? 3.5 : 2.5,
                      height
                    }}
                  />
                )
              )}
            </motion.div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.6, rotate: -12 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{
                delay: 0.9,
                duration: 0.45,
                type: "spring",
                bounce: 0.45
              }}
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 32 32"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 26C6 26 8 14 16 10C24 6 28 8 28 8C28 8 26 18 18 22C12 25 6 26 6 26Z"
                  stroke="var(--sk-brand-leaf)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 26C6 26 12 20 16 16"
                  stroke="var(--sk-brand-leaf)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>

            <div>
              <motion.div
                initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  delay: 1,
                  duration: 0.5,
                  ease: [0.4, 0, 0.2, 1]
                }}
                style={{
                  fontFamily: "'Satoshi', var(--font-manrope), sans-serif",
                  fontSize: 52,
                  fontWeight: 500,
                  color: "var(--sk-brand-mist)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1
                }}
              >
                Skaren
              </motion.div>
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 90, opacity: 1 }}
                transition={{
                  delay: 1.3,
                  duration: 0.4,
                  ease: [0.4, 0, 0.2, 1]
                }}
                style={{
                  height: 2,
                  background:
                    "linear-gradient(90deg, transparent, var(--sk-brand-leaf), transparent)",
                  borderRadius: 2,
                  margin: "4px auto 0"
                }}
              />
            </div>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.4 }}
              style={{
                fontFamily: "var(--font-manrope), sans-serif",
                fontSize: 12,
                fontWeight: 400,
                color: "rgba(245,240,232,0.42)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginTop: 4
              }}
            >
              Scan smarter. Live cleaner.
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function LandingPage() {
  const { showSplash, completeSplash } = useSplashScreen();

  return (
    <>
      {showSplash ? <SplashScreen onComplete={completeSplash} /> : null}
      <AppHeader showMobileScan={false} />
      <main className="mx-auto w-full max-w-[430px] px-4 pb-28 pt-4 sm:max-w-2xl sm:pb-16">
        <section className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-phone">
          <div className="relative bg-forest px-6 pb-8 pt-6 text-white">
            <div className="flex items-start justify-end">
              <HomeInfoPopover />
            </div>

            <Link
              href="/scan"
              className="focus-ring tap-feedback mx-auto mt-10 flex max-w-[18rem] flex-col items-center rounded-[2rem] py-2 text-center"
              aria-label={t("home.scan_product")}
            >
              <span className="relative grid h-44 w-44 place-items-center rounded-[2.1rem] border border-white/18 bg-white/10 shadow-inner">
                <span className="absolute left-7 top-7 h-9 w-9 rounded-tl-lg border-l-4 border-t-4 border-white/65" />
                <span className="absolute right-7 top-7 h-9 w-9 rounded-tr-lg border-r-4 border-t-4 border-white/65" />
                <span className="absolute bottom-7 left-7 h-9 w-9 rounded-bl-lg border-b-4 border-l-4 border-white/65" />
                <span className="absolute bottom-7 right-7 h-9 w-9 rounded-br-lg border-b-4 border-r-4 border-white/65" />
                <ScanBarcode className="h-20 w-20 text-white" strokeWidth={1.7} />
              </span>
              <span className="type-heading-2 mt-6">
                {t("home.scan_product")}
              </span>
            </Link>
          </div>

          <div className="bg-[var(--sk-brand-mist-card)] px-5 pb-6 pt-5">
            <div className="type-caption flex items-center gap-4 text-forest/45">
              <span className="h-px flex-1 bg-forest/12" />
              <span>{t("home.explore_without_scanning")}</span>
              <span className="h-px flex-1 bg-forest/12" />
            </div>

            <Link
              href="/scan"
              className="focus-ring tap-feedback mt-5 flex min-h-[5.7rem] items-center gap-4 rounded-[1.35rem] bg-white px-4 py-3 shadow-sm"
            >
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-leaf-50 text-3xl">
                <Search className="h-8 w-8 text-ink" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="type-heading-2 block text-ink">
                  {t("home.search_products")}
                </span>
              </span>
              <ChevronRight className="h-6 w-6 shrink-0 text-soil-300" />
            </Link>
          </div>
        </section>

        <footer className="type-body-sm mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 pb-4 font-semibold text-soil-500">
          <Link href="/privacy">{t("footer.privacy")}</Link>
          <Link href="/terms">{t("footer.terms")}</Link>
          <Link href="/disclaimer">{t("footer.disclaimer")}</Link>
        </footer>
      </main>
    </>
  );
}
