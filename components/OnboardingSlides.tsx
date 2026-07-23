"use client";

import { useState } from "react";
import { ArrowRight, BadgeCheck, Check, HeartHandshake, ScanBarcode } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/language-context";
import { t } from "@/lib/i18n";

type OnboardingSlidesProps = {
  open: boolean;
  onComplete: () => void;
};

const slides = [
  {
    titleKey: "onboarding_slide1_title",
    textKey: "onboarding_slide1_text",
    icon: ScanBarcode
  },
  {
    titleKey: "onboarding_slide2_title",
    textKey: "onboarding_slide2_text",
    icon: BadgeCheck
  },
  {
    titleKey: "onboarding_slide3_title",
    textKey: "onboarding_slide3_text",
    icon: HeartHandshake
  }
] as const;

export function OnboardingSlides({ open, onComplete }: OnboardingSlidesProps) {
  const { lang } = useLang();
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const slide = slides[index];
  const Icon = slide.icon;
  const isLast = index === slides.length - 1;

  async function completeOnboarding() {
    setSaving(true);
    await supabase?.auth.updateUser({
      data: { onboarding_completed: true }
    });
    setSaving(false);
    onComplete();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 px-4 backdrop-blur-sm">
      <section className="w-full max-w-sm rounded-[2rem] bg-white p-6 text-center shadow-phone">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-leaf-100 text-forest">
          <Icon className="h-10 w-10" />
        </div>
        <p className="type-section-label mt-6 text-forest">{t('onboarding_step', lang)} {index + 1} {t('onboarding_of', lang)} 3</p>
        <h2 className="type-heading-1 mt-2 text-ink">{t(slide.titleKey, lang)}</h2>
        <p className="type-body-lg mt-3 text-soil-600">{t(slide.textKey, lang)}</p>

        <div className="mt-6 flex justify-center gap-2">
          {slides.map((item) => (
            <span key={item.titleKey} className={`h-2 w-2 rounded-full ${item.titleKey === slide.titleKey ? "bg-lime-500" : "bg-soil-100"}`} />
          ))}
        </div>

        <button
          onClick={isLast ? completeOnboarding : () => setIndex((current) => current + 1)}
          disabled={saving}
          className="focus-ring type-button mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-4 text-white shadow-phone disabled:bg-soil-600"
        >
          {isLast ? (saving ? t('onboarding_saving', lang) : t('onboarding_finish', lang)) : t('onboarding_next', lang)}
          {isLast ? <Check className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
        </button>
      </section>
    </div>
  );
}
