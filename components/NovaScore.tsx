"use client";

import { useState } from "react";
import { CircleHelp, Layers3 } from "lucide-react";

type NovaGroup = 1 | 2 | 3 | 4 | null;

type NovaScoreProps = {
  novaGroup: NovaGroup;
};

const novaContent: Record<Exclude<NovaGroup, null>, { label: string; color: string; background: string; description: string }> = {
  1: {
    label: "Unprocessed",
    color: "text-forest",
    background: "from-emerald-50 to-white border-emerald-100",
    description: "Whole or minimally processed food — best choice"
  },
  2: {
    label: "Processed ingredients",
    color: "text-leaf-700",
    background: "from-leaf-50 to-white border-leaf-100",
    description: "Simple processed ingredients like oils, sugar, salt"
  },
  3: {
    label: "Processed food",
    color: "text-orange-700",
    background: "from-orange-50 to-white border-orange-100",
    description: "Processed food with added salt, sugar or fat"
  },
  4: {
    label: "Ultra-processed",
    color: "text-rose-700",
    background: "from-rose-50 to-white border-rose-100",
    description: "Industrial formulation with 5+ ingredients rarely used in home cooking"
  }
};

export function NovaScore({ novaGroup }: NovaScoreProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  if (!novaGroup) return null;

  const content = novaContent[novaGroup];

  return (
    <section className={`mt-4 w-full max-w-full overflow-hidden rounded-[1.75rem] border bg-gradient-to-br p-5 shadow-soft sm:mt-5 sm:rounded-[2rem] sm:p-6 ${content.background}`}>
      <div className="flex min-w-0 items-center gap-4">
        <div className={`grid h-20 w-20 shrink-0 place-items-center rounded-[1.6rem] bg-white text-5xl font-black shadow-sm ${content.color}`}>
          {novaGroup}
        </div>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-soil-600">
                <Layers3 className="h-4 w-4 shrink-0" />
                <p className="text-xs font-black uppercase tracking-[0.16em]">NOVA processing level</p>
              </div>
              <h2 className={`mt-1 break-words font-display text-2xl font-black tracking-[-0.04em] ${content.color}`}>{content.label}</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowExplanation((open) => !open)}
              aria-label="What NOVA processing level means"
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition ${showExplanation ? "bg-forest text-white" : "bg-white/80 text-soil-600"}`}
            >
              <CircleHelp className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-[0.98rem] font-semibold leading-6 text-soil-700">{content.description}</p>
        </div>
      </div>
      {showExplanation ? (
        <div className="mt-4 rounded-3xl border border-white/80 bg-white/80 p-4 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-forest">What is NOVA?</p>
          <p className="mt-2 text-[0.95rem] font-semibold leading-6 text-soil-700">
            NOVA is a 1-4 processing scale. It helps explain how close a food is to a simple whole food, or how industrially processed it is.
          </p>
          <div className="mt-3 grid gap-2 text-sm font-semibold leading-6 text-soil-700">
            <p><strong>1:</strong> Whole or minimally processed food.</p>
            <p><strong>2:</strong> Processed ingredients like oils, sugar, or salt.</p>
            <p><strong>3:</strong> Processed food with added salt, sugar, or fat.</p>
            <p><strong>4:</strong> Ultra-processed food with industrial ingredients.</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
