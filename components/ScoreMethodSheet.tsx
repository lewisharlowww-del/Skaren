"use client";

/**
 * ScoreMethodSheet — "how this scored 22", the black box opened.
 *
 * A bottom sheet over the result screen, not a navigation: you never lose the
 * product. It starts at the model's real baseline, itemises every deduction with its reason, names
 * the engine that produced the number, prints the model version and date, and
 * offers a route to report an error. This is what earns the right to be trusted
 * over a score somebody else publishes.
 */

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { t, type Language } from "@/lib/i18n";
import type { ProductResult } from "@/lib/types";

export type Deduction = {
  factor: string;
  reason: string;
  /** Signed: negative deducts, positive adds. */
  value: number;
};

/** The category-relative Skaren breakdown (spec section 9). When present, the
 *  sheet shows the shelf comparison instead of the absolute baseline ladder. */
export type SkarenExplain = {
  bucketLabel: string;
  sampleSize: number;
  shelfMedian: number | null;
  /** Per-nutrient percentile within the bucket, 100 = best in category. */
  percentiles: Array<{ label: string; pct: number }>;
  additivePenalty: number;
  processingPenalty: number;
  novaLabel: string;
  /** v2 — ingredient signals, each citing the exact word it matched. */
  ingredientSignals?: Array<{ label: string; points: number; cite: string }>;
  /** v2 — the category ceiling, shown as its own row when it clamped the number. */
  ceiling?: number | null;
  ceilingApplied?: boolean;
  /** v2 — "better than N% of the shelf". */
  rank?: number | null;
  /** v2 — coarse band and the score version, printed at the foot of the sheet. */
  band?: string;
  version?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  product: ProductResult;
  score: number | null;
  deductions: Deduction[];
  /** The model's real starting point. The canvas mock showed 100; ours is 50. */
  baseline: number;
  lang: Language;
  /** Present for category-relative (Skaren Score) products. */
  skaren?: SkarenExplain | null;
};

export function ScoreMethodSheet({ open, onClose, product, score, deductions, baseline, lang, skaren }: Props) {
  // A sheet that traps the page behind it is a navigation in disguise; this one
  // only stops the body scrolling while it is up.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const basis = product.healthBasis ?? t("product_basis_absolute", lang);
  const model = product.healthModel ?? "—";
  const isSkaren = Boolean(skaren);
  const skarenBasis =
    skaren != null
      ? lang === "no"
        ? `Sammenlignet med ${skaren.sampleSize} andre i «${skaren.bucketLabel}». Høyere prosent = bedre enn hyllen på det næringsstoffet.`
        : `Compared with ${skaren.sampleSize} others in "${skaren.bucketLabel}". A higher percent means better than the shelf on that nutrient.`
      : basis;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-[70]"
            style={{ background: "rgba(20,18,12,.45)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t("product_how_scored", lang)}
            className="fixed inset-x-0 bottom-0 z-[71] mx-auto w-full max-w-[430px]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            style={{
              background: "var(--sk-brand-mist)",
              borderRadius: "22px 22px 0 0",
              borderTop: "1px solid var(--sk-border-default)",
              padding: "10px 20px calc(24px + env(safe-area-inset-bottom))",
              maxHeight: "82vh",
              overflowY: "auto"
            }}
          >
            <div
              aria-hidden
              style={{ width: 44, height: 4, borderRadius: 999, background: "var(--sk-border-default)", margin: "0 auto 16px" }}
            />

            <h2
              style={{
                fontFamily: "var(--sk-font-brand)",
                fontSize: 24,
                letterSpacing: "-0.03em",
                color: "var(--sk-text-primary)"
              }}
            >
              {t("product_how_scored", lang)} {score ?? "–"}
            </h2>

            <div
              style={{
                marginTop: 16,
                background: "var(--sk-surface-card)",
                border: "0.5px solid var(--sk-border-default)",
                borderRadius: 18,
                overflow: "hidden"
              }}
            >
              {isSkaren && skaren ? (
                <>
                  {skaren.percentiles.map((row, i) => (
                    <PercentileRow key={row.label} label={row.label} pct={row.pct} first={i === 0} />
                  ))}
                  {/* v2 — ingredient signals, each quoting the exact word it
                      matched ("Sugar leads −6 · sukker (second)"). */}
                  {skaren.ingredientSignals?.map((sig) => (
                    <Row
                      key={sig.label + sig.cite}
                      label={sig.label}
                      reason={sig.cite}
                      value={`${sig.points > 0 ? "+" : "−"}${Math.abs(sig.points)}`}
                      colour={sig.points > 0 ? "var(--sk-status-positive)" : "var(--sk-score-weak)"}
                    />
                  ))}
                  {skaren.additivePenalty !== 0 ? (
                    <Row
                      label={t("product_additives", lang)}
                      reason={product.additives?.filter((a) => a.risk !== "safe").length ? String(product.additives.filter((a) => a.risk !== "safe").length) : ""}
                      value={`−${Math.abs(skaren.additivePenalty)}`}
                      colour="var(--sk-score-weak)"
                    />
                  ) : null}
                  {skaren.processingPenalty !== 0 ? (
                    <Row
                      label={t("factor_processing", lang)}
                      reason={skaren.novaLabel}
                      value={`−${Math.abs(skaren.processingPenalty)}`}
                      colour="var(--sk-score-weak)"
                    />
                  ) : null}
                  {/* v2 — the category ceiling gets its own row when it binds,
                      in plain words, never a silent clamp (spec §6, §10). */}
                  {skaren.ceilingApplied && skaren.ceiling != null ? (
                    <Row
                      label={lang === "no" ? "Kategoritak" : "Category ceiling"}
                      reason={lang === "no" ? "toppen av hyllen, men fortsatt denne kategorien" : "top of its shelf, still this category"}
                      value={String(skaren.ceiling)}
                      colour="var(--sk-text-primary)"
                    />
                  ) : null}
                  {skaren.shelfMedian != null ? (
                    <Row
                      label={lang === "no" ? "Hyllemedian" : "Shelf median"}
                      reason={lang === "no" ? "typisk for denne hyllen" : "typical for this shelf"}
                      value={String(skaren.shelfMedian)}
                      colour="var(--sk-text-muted)"
                    />
                  ) : null}
                </>
              ) : (
                <>
                  <Row
                    label={t("product_starting_score", lang)}
                    reason=""
                    value={String(baseline)}
                    colour="var(--sk-text-primary)"
                    first
                  />
                  {deductions.map((deduction) => (
                    <Row
                      key={deduction.factor}
                      label={deduction.factor}
                      reason={deduction.reason}
                      value={`${deduction.value > 0 ? "+" : "−"}${Math.abs(deduction.value)}`}
                      colour={deduction.value > 0 ? "var(--sk-status-positive)" : "var(--sk-score-weak)"}
                    />
                  ))}
                </>
              )}
            </div>

            {/* Which engine produced this number. */}
            <p style={{ marginTop: 14, fontSize: 12.5, lineHeight: 1.5, color: "var(--sk-text-secondary)" }}>
              {skarenBasis}
            </p>
            <p
              style={{
                marginTop: 6,
                fontFamily: "var(--sk-font-ui)",
          fontVariantNumeric: "tabular-nums",
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--sk-text-muted)"
              }}
            >
              {t("product_model", lang)} {isSkaren ? `skaren-category-${skaren?.version ?? "2.0.0"}` : model}
            </p>

            <a
              href={`mailto:hei@skaren.app?subject=${encodeURIComponent(`Score feedback · ${product.barcode}`)}`}
              className="focus-ring"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "var(--sk-min-tap)",
                marginTop: 16,
                borderRadius: 16,
                border: "1px solid var(--sk-border-default)",
                fontSize: 14,
                color: "var(--sk-brand-forest)"
              }}
            >
              {t("product_report_error", lang)}
            </a>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Row({
  label,
  reason,
  value,
  colour,
  first
}: {
  label: string;
  reason: string;
  value: string;
  colour: string;
  first?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "13px 17px",
        borderTop: first ? undefined : "1px solid var(--sk-border-muted)"
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, color: "var(--sk-text-primary)" }}>{label}</div>
        {reason ? (
          <div style={{ fontSize: 11.5, color: "var(--sk-text-muted)", marginTop: 1 }}>{reason}</div>
        ) : null}
      </div>
      <div style={{ fontFamily: "var(--sk-font-ui)", fontVariantNumeric: "tabular-nums", fontSize: 14, color: colour }}>
        {value}
      </div>
    </div>
  );
}

// A nutrient's position within its bucket, drawn as a bar. 100 = best in
// category. Green when above the shelf midpoint, clay when below.
function PercentileRow({ label, pct, first }: { label: string; pct: number; first?: boolean }) {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  const good = p >= 50;
  const fill = good ? "var(--sk-status-positive)" : "var(--sk-score-weak)";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "13px 17px",
        borderTop: first ? undefined : "1px solid var(--sk-border-muted)"
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: "var(--sk-text-primary)" }}>{label}</div>
        <div style={{ marginTop: 6, height: 6, borderRadius: 999, background: "var(--sk-border-muted)", overflow: "hidden" }}>
          <div style={{ width: `${p}%`, height: "100%", borderRadius: 999, background: fill }} />
        </div>
      </div>
      <div style={{ fontFamily: "var(--sk-font-ui)", fontVariantNumeric: "tabular-nums", fontSize: 13, color: "var(--sk-text-muted)", width: 42, textAlign: "right" }}>
        {p}%
      </div>
    </div>
  );
}
