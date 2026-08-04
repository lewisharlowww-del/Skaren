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
      style={{ background: "#F6F3EC", minHeight: "100dvh" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full active:bg-[#E6E0D0] transition-colors"
          style={{ background: "#ffffff", border: "0.5px solid #E6E0D0" }}
        >
          <ChevronLeft className="h-5 w-5 text-[#33684A]" />
        </button>
        <h1
          className="text-[22px] font-black text-[#33684A] tracking-tight"
          style={{ fontFamily: "var(--font-familjen), sans-serif" }}
        >
          {t("language_title", lang)}
        </h1>
      </div>

      {/* Options */}
      <div className="px-4">
        <div className="overflow-hidden rounded-2xl border border-[#E6E0D0] bg-white">
          {/* Norwegian */}
          <button
            type="button"
            onClick={() => setLang("no")}
            className="flex w-full items-center gap-4 px-5 py-4 text-left active:bg-[#F6F3EC] transition-colors border-b border-[#F3EEE2]"
          >
            <span className="text-[22px]">🇳🇴</span>
            <span className="flex-1 text-[15px] font-bold text-[#201D15]">
              {t("language_norwegian", lang)}
            </span>
            {lang === "no" && (
              <span
                className="h-5 w-5 rounded-full flex items-center justify-center"
                style={{ background: "#33684A" }}
              >
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L4 7L9 1" stroke="#E4EEE7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </button>

          {/* English */}
          <button
            type="button"
            onClick={() => setLang("en")}
            className="flex w-full items-center gap-4 px-5 py-4 text-left active:bg-[#F6F3EC] transition-colors"
          >
            <span className="text-[22px]">🇬🇧</span>
            <span className="flex-1 text-[15px] font-bold text-[#201D15]">
              {t("language_english", lang)}
            </span>
            {lang === "en" && (
              <span
                className="h-5 w-5 rounded-full flex items-center justify-center"
                style={{ background: "#33684A" }}
              >
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L4 7L9 1" stroke="#E4EEE7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
