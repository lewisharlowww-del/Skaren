"use client";

import { useState } from "react";
import { ArrowRight, BadgeCheck, Check, HeartHandshake, ScanBarcode } from "lucide-react";
import { supabase } from "@/lib/supabase";

type OnboardingSlidesProps = {
  open: boolean;
  onComplete: () => void;
};

const slides = [
  {
    title: "Scan in seconds",
    text: "Use your camera or type a barcode to pull real Norwegian product data.",
    icon: ScanBarcode
  },
  {
    title: "Read the grade",
    text: "Skaren shows clear A-E grades, nutrition facts, allergens, and ingredients.",
    icon: BadgeCheck
  },
  {
    title: "Save what matters",
    text: "Create an account for history and support Skaren to unlock deeper insights.",
    icon: HeartHandshake
  }
];

export function OnboardingSlides({ open, onComplete }: OnboardingSlidesProps) {
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
        <p className="type-section-label mt-6 text-forest">Step {index + 1} of 3</p>
        <h2 className="type-heading-1 mt-2 text-ink">{slide.title}</h2>
        <p className="type-body-lg mt-3 text-soil-600">{slide.text}</p>

        <div className="mt-6 flex justify-center gap-2">
          {slides.map((item) => (
            <span key={item.title} className={`h-2 w-2 rounded-full ${item.title === slide.title ? "bg-lime-500" : "bg-soil-100"}`} />
          ))}
        </div>

        <button
          onClick={isLast ? completeOnboarding : () => setIndex((current) => current + 1)}
          disabled={saving}
          className="focus-ring type-button mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-4 text-white shadow-phone disabled:bg-soil-600"
        >
          {isLast ? (saving ? "Saving..." : "Finish") : "Next"}
          {isLast ? <Check className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
        </button>
      </section>
    </div>
  );
}
