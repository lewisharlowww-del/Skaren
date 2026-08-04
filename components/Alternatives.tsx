"use client";

/**
 * Alternatives — opt-in, and never sponsored.
 *
 * The CTA is a quiet outlined row, not a banner: nobody scanned a product to be
 * sold a different one. When it opens, Merk shows his working — how many he
 * looked at, what actually improved, and what got worse. The trade-off line is
 * the point. A swap engine that only prints upside is an ad.
 */

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { t, type Language } from "@/lib/i18n";
import type { ProductResult } from "@/lib/types";

type Alternative = {
  barcode: string;
  name: string;
  brand: string;
  score: number;
  scoreDelta: number;
  reasons: Array<{ metric: string; text: string }>;
  tradeoffs: string[];
  consideredCount: number;
};

type Props = {
  product: ProductResult;
  /** True when nothing on this product is worth replacing. */
  clean: boolean;
  lang: Language;
  onShelfMedian?: (median: number | null) => void;
};

export function Alternatives({ product, clean, lang, onShelfMedian }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "empty">("idle");
  const [results, setResults] = useState<Alternative[]>([]);

  async function load() {
    if (state === "loading") return;
    setState("loading");
    try {
      const response = await fetch("/api/alternatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product })
      });
      const data = (await response.json()) as {
        alternatives?: Alternative[];
        shelfMedian?: number | null;
      };
      onShelfMedian?.(data.shelfMedian ?? null);
      setResults(data.alternatives ?? []);
      setState((data.alternatives ?? []).length ? "done" : "empty");
    } catch {
      setState("empty");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={load}
        disabled={clean || state === "loading"}
        className="focus-ring w-full"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          textAlign: "left",
          minHeight: "var(--sk-min-tap)",
          padding: "13px 16px",
          borderRadius: 16,
          border: "1px solid var(--sk-border-default)",
          background: "transparent",
          opacity: clean ? 0.65 : 1
        }}
      >
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontSize: 14, color: "var(--sk-text-primary)" }}>
            {clean ? t("product_add_to_list", lang) : t("product_find_alternatives", lang)}
          </span>
          <span style={{ display: "block", fontSize: 11.5, color: "var(--sk-brand-forest)", marginTop: 2 }}>
            {clean ? t("product_nothing_to_replace", lang) : t("product_alternatives_sub", lang)}
          </span>
        </span>
        {!clean ? <ChevronRight className="h-4 w-4" style={{ color: "var(--sk-text-muted)" }} /> : null}
      </button>

      {state === "loading" ? (
        <div style={{ display: "flex", gap: 3, marginTop: 12, height: 14, alignItems: "flex-end" }} aria-hidden>
          {[60, 100, 45, 85, 55, 95].map((height, index) => (
            <span
              key={index}
              style={{
                width: 3,
                height: `${height}%`,
                borderRadius: 1,
                background: "var(--sk-brand-forest)",
                animation: `sk-pulse 1.1s ease-in-out ${index * 90}ms infinite`
              }}
            />
          ))}
        </div>
      ) : null}

      {state === "empty" ? (
        <p style={{ marginTop: 10, fontSize: 12.5, color: "var(--sk-text-muted)" }}>
          {t("product_no_alternatives", lang)}
        </p>
      ) : null}

      {state === "done" ? (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {results.map((alternative) => (
            <div
              key={alternative.barcode}
              style={{
                background: "var(--sk-surface-card)",
                border: "0.5px solid var(--sk-border-default)",
                borderRadius: 16,
                padding: "13px 15px"
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: 14, color: "var(--sk-text-primary)" }}>{alternative.name}</span>
                <span
                  style={{
                    fontFamily: "var(--sk-font-ui)",
                    fontVariantNumeric: "tabular-nums",
                    fontSize: 17,
                    color: "var(--sk-score-good)"
                  }}
                >
                  {alternative.score}
                </span>
              </div>
              <p style={{ fontSize: 11.5, color: "var(--sk-text-muted)", marginTop: 1 }}>{alternative.brand}</p>

              {alternative.reasons.map((reason) => (
                <p key={reason.metric} style={{ fontSize: 12.5, color: "var(--sk-status-positive)", marginTop: 7 }}>
                  {reason.text}
                </p>
              ))}
              {/* What gets worse is printed, never hidden. */}
              {alternative.tradeoffs.map((tradeoff) => (
                <p key={tradeoff} style={{ fontSize: 12.5, color: "var(--sk-score-weak)", marginTop: 3 }}>
                  {tradeoff}
                </p>
              ))}
            </div>
          ))}
          <p style={{ fontSize: 11, color: "var(--sk-text-muted)" }}>
            {t("product_considered", lang)} {results[0]?.consideredCount ?? 0}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * WhatWouldMerkBuySheet — three short paragraphs, no numbers.
 *
 * A score can tell you how a product rates. It cannot tell you whether to buy
 * it, because that depends on what you are making. This is use-case advice, so
 * it deliberately never quotes a figure.
 */
export function MerkBuyNote({ grade, lang }: { grade: string | null; lang: Language }) {
  const strong = grade === "A" || grade === "B";
  return (
    <div
      style={{
        background: "var(--sk-brand-mist-card)",
        borderRadius: 18,
        padding: "15px 17px"
      }}
    >
      <p
        style={{
          fontFamily: "var(--sk-font-data)",
          fontSize: 9.5,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--sk-text-muted)"
        }}
      >
        {t("product_what_would_merk_buy", lang)}
      </p>
      <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--sk-text-primary)", marginTop: 8 }}>
        {strong ? t("merk_buy_strong", lang) : t("merk_buy_weak", lang)}
      </p>
    </div>
  );
}
