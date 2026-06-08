"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/language-context";

export default function LanguagePage() {
  const router = useRouter();
  const { lang, setLang } = useLang();

  return (
    <main
      className="mx-auto w-full max-w-[430px] overflow-x-hidden pb-32 pt-4 sm:max-w-lg sm:pt-8"
      style={{ background: "#faf7f2", minHeight: "100dvh" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full active:bg-[#e0d8cc] transition-colors"
          style={{ background: "#ffffff", border: "0.5px solid #e0d8cc" }}
        >
          <ChevronLeft className="h-5 w-5 text-[#2d4a26]" />
        </button>
        <h1
          className="text-[22px] font-black text-[#2d4a26] tracking-tight"
          style={{ fontFamily: "Satoshi, sans-serif" }}
        >
          {t("language_title", lang)}
        </h1>
      </div>

      {/* Options */}
      <div className="px-4">
        <div className="overflow-hidden rounded-2xl border border-[#e0d8cc] bg-white">
          {/* Norwegian */}
          <button
            type="button"
            onClick={() => setLang("no")}
            className="flex w-full items-center gap-4 px-5 py-4 text-left active:bg-[#faf7f2] transition-colors border-b border-[#f0ebe0]"
          >
            <span className="text-[22px]">🇳🇴</span>
            <span className="flex-1 text-[15px] font-bold text-[#2d3028]">
              {t("language_norwegian", lang)}
            </span>
            {lang === "no" && (
              <span
                className="h-5 w-5 rounded-full flex items-center justify-center"
                style={{ background: "#2d4a26" }}
              >
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L4 7L9 1" stroke="#dceedd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </button>

          {/* English */}
          <button
            type="button"
            onClick={() => setLang("en")}
            className="flex w-full items-center gap-4 px-5 py-4 text-left active:bg-[#faf7f2] transition-colors"
          >
            <span className="text-[22px]">🇬🇧</span>
            <span className="flex-1 text-[15px] font-bold text-[#2d3028]">
              {t("language_english", lang)}
            </span>
            {lang === "en" && (
              <span
                className="h-5 w-5 rounded-full flex items-center justify-center"
                style={{ background: "#2d4a26" }}
              >
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L4 7L9 1" stroke="#dceedd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
