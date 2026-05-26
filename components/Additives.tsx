"use client";

import { useState } from "react";
import { ChevronDown, FlaskConical } from "lucide-react";
import type { AdditiveAnalysis, AdditiveRisk } from "@/lib/additives";

type AdditivesProps = {
  additives: AdditiveAnalysis[];
};

const riskStyles: Record<AdditiveRisk, { pill: string; panel: string; label: string }> = {
  safe: {
    pill: "border-emerald-200 bg-emerald-50 text-emerald-800",
    panel: "border-emerald-100 bg-emerald-50/60 text-emerald-900",
    label: "Low concern"
  },
  moderate: {
    pill: "border-amber-200 bg-amber-50 text-amber-800",
    panel: "border-amber-100 bg-amber-50/70 text-amber-900",
    label: "Worth knowing"
  },
  avoid: {
    pill: "border-rose-200 bg-rose-50 text-rose-800",
    panel: "border-rose-100 bg-rose-50/70 text-rose-900",
    label: "Best to avoid"
  }
};

function additiveTitle(additive: AdditiveAnalysis) {
  return `${additive.code.toUpperCase()} ${additive.name}`;
}

export function Additives({ additives }: AdditivesProps) {
  const [openCode, setOpenCode] = useState<string | null>(null);

  if (additives.length === 0) {
    return (
      <section className="mt-4 w-full max-w-full rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-soft sm:mt-5 sm:rounded-[2rem] sm:p-6">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-xl">✅</div>
          <div>
            <h2 className="font-display text-2xl font-black tracking-[-0.04em] text-ink">Additives</h2>
            <p className="mt-2 text-[0.98rem] font-bold leading-6 text-emerald-800">No additives detected</p>
          </div>
        </div>
      </section>
    );
  }

  const avoidCount = additives.filter((additive) => additive.risk === "avoid").length;
  const summary = `${additives.length} additive${additives.length === 1 ? "" : "s"} found — ${avoidCount} to avoid`;

  return (
    <section className="mt-4 w-full max-w-full rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-soft sm:mt-5 sm:rounded-[2rem] sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-leaf-50 text-forest">
          <FlaskConical className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-black tracking-[-0.04em] text-ink">Additives</h2>
          <p className="mt-1 text-[0.98rem] font-bold leading-6 text-soil-600">{summary}</p>
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap gap-2">
        {additives.map((additive) => {
          const isOpen = openCode === additive.code;
          const style = riskStyles[additive.risk];

          return (
            <div key={additive.code} className="w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setOpenCode(isOpen ? null : additive.code)}
                className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-2xl border px-4 py-2 text-left text-[0.95rem] font-black transition active:scale-[0.99] sm:w-auto ${style.pill}`}
              >
                <span>{additiveTitle(additive)}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 transition ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen ? (
                <div className={`mt-2 rounded-2xl border p-3 text-[0.92rem] font-semibold leading-6 shadow-sm ${style.panel}`}>
                  <p className="font-black">{style.label}</p>
                  <p className="mt-1">{additive.description}</p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
