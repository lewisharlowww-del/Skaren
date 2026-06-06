"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { t } from "@/lib/i18n";

export function HomeInfoPopover() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: MouseEvent | TouchEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("touchstart", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("touchstart", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative z-10">
      <button
        type="button"
        aria-label={open ? t("home.info.close") : t("home.info.open")}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`focus-ring tap-feedback grid h-12 w-12 place-items-center rounded-full border transition ${
          open
            ? "border-white bg-white text-forest"
            : "border-white/20 bg-white/10 text-white/80"
        }`}
      >
        <Info className="h-5 w-5" />
      </button>

      {open && (
        <div className="animate-fade-up absolute right-0 top-14 w-[min(18.5rem,calc(100vw-4rem))] rounded-[1.35rem] border border-white/15 bg-white p-4 text-ink shadow-phone">
          <p className="type-section-label text-forest">
            {t("home.info.title")}
          </p>
          <p className="type-body-sm mt-2 text-soil-600">
            {t("home.info.body")}
          </p>
          <div className="type-body-sm mt-4 grid gap-2 font-bold text-ink">
            <span className="rounded-2xl bg-leaf-50 px-3 py-2">
              {t("home.info.health_grade")}
            </span>
            <span className="rounded-2xl bg-leaf-50 px-3 py-2">
              {t("home.info.additives")}
            </span>
            <span className="rounded-2xl bg-leaf-50 px-3 py-2">
              {t("home.info.nova")}
            </span>
            <span className="rounded-2xl bg-leaf-50 px-3 py-2">
              {t("home.info.allergens")}
            </span>
          </div>
          <p className="type-caption mt-3 text-soil-500">
            {t("home.info.disclaimer")}
          </p>
        </div>
      )}
    </div>
  );
}
