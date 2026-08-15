"use client";

/**
 * Alternatives — opt-in, never sponsored.
 *
 * Four states, not two. v1 collapsed "we could not check" into "nothing found",
 * which is both dishonest and undebuggable:
 *
 *   idle    the quiet outlined row; nobody scanned a product to be sold another
 *   loading Merk's barcode, the same loading motif as everywhere else
 *   done    cards, each printing what improves AND what gets worse
 *   empty   "I checked N on this shelf, none clearly better" — a real answer
 *   failed  "I could not check the shelf" — a different sentence entirely
 *
 * The trade-off line is the point. A swap engine that only prints upside is an
 * advertisement with extra steps.
 */

import { useState } from "react";
import Link from "next/link";
import { t, type Language } from "@/lib/i18n";
import type { ProductResult } from "@/lib/types";

type Reason = { metric: string; text: string };

type Alternative = {
  barcode: string;
  name: string;
  brand: string;
  score: number;
  scoreDelta: number;
  watchAdditiveCount: number;
  reasons: Reason[];
  tradeoffs: string[];
};

type Response = {
  ok: boolean;
  results?: Alternative[];
  consideredCount?: number;
  shelfLabel?: string | null;
  shelfMedian?: number | null;
};

type State = "idle" | "loading" | "done" | "empty" | "failed";

type Props = {
  product: ProductResult;
  /** True when nothing on this product is worth replacing. */
  clean: boolean;
  lang: Language;
  onShelfMedian?: (median: number | null) => void;
};

export function Alternatives({ product, clean, lang, onShelfMedian }: Props) {
  const [state, setState] = useState<State>("idle");
  const [results, setResults] = useState<Alternative[]>([]);
  const [considered, setConsidered] = useState(0);
  const [shelf, setShelf] = useState<string | null>(null);

  async function load() {
    if (state === "loading") return;
    setState("loading");
    try {
      const response = await fetch(`/api/alternatives?lang=${lang}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as Response;

      onShelfMedian?.(data.shelfMedian ?? null);
      setConsidered(data.consideredCount ?? 0);
      setShelf(data.shelfLabel ?? null);

      if (!data.ok) { setState("failed"); return; }
      setResults(data.results ?? []);
      setState((data.results ?? []).length ? "done" : "empty");
    } catch {
      setState("failed");
    }
  }

  /* "Looked at 31 yellow cheeses." The sentence that makes this feel like a
     friend checked the shelf rather than an algorithm upselling you. */
  const considerLine = considered
    ? lang === "no"
      ? `Så på ${considered}${shelf ? ` ${shelf}` : ""} på denne hylla.`
      : `Looked at ${considered}${shelf ? ` ${shelf}` : ""} on this shelf.`
    : null;

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
          gap: 13,
          textAlign: "left",
          minHeight: "var(--sk-min-tap)",
          padding: "15px 20px",
          borderRadius: 20,
          border: "1.5px solid var(--sk-text-primary)",
          background: "transparent",
          opacity: clean ? 0.65 : 1
        }}
      >
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontSize: 15.5, fontWeight: 600, color: "var(--sk-text-primary)" }}>
            {clean ? t("product_add_to_list", lang) : t("product_find_alternatives", lang)}
          </span>
          <span style={{ display: "block", fontSize: 12.5, color: "var(--sk-brand-forest)" }}>
            {clean ? t("product_nothing_to_replace", lang) : t("product_alternatives_sub", lang)}
          </span>
        </span>
        {!clean ? <span aria-hidden style={{ fontSize: 18, color: "var(--sk-text-primary)" }}>→</span> : null}
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

      {/* Checked, found nothing. Say how many — that is the honest part. */}
      {state === "empty" ? (
        <div style={{ marginTop: 10 }}>
          <p style={{ fontSize: 12.5, color: "var(--sk-text-muted)" }}>
            {t("product_no_alternatives", lang)}
          </p>
          {considerLine ? (
            <p style={{ fontSize: 11, color: "var(--sk-text-faint)", marginTop: 3 }}>{considerLine}</p>
          ) : null}
        </div>
      ) : null}

      {/* Could not check. A different sentence, and a way back. */}
      {state === "failed" ? (
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <p style={{ flex: 1, fontSize: 12.5, color: "var(--sk-text-muted)" }}>
            {lang === "no" ? "Jeg fikk ikke sjekket hylla nå." : "I could not check the shelf just now."}
          </p>
          <button
            type="button"
            onClick={load}
            className="focus-ring"
            style={{
              fontSize: 12.5,
              color: "var(--sk-brand-forest)",
              background: "transparent",
              border: 0,
              padding: "6px 2px",
              textDecoration: "underline"
            }}
          >
            {lang === "no" ? "Prøv igjen" : "Try again"}
          </button>
        </div>
      ) : null}

      {state === "done" ? (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {results.map((alternative) => (
            <Link
              key={alternative.barcode}
              href={`/product/${alternative.barcode}`}
              className="focus-ring"
              style={{
                display: "block",
                background: "var(--sk-surface-card)",
                border: "0.5px solid var(--sk-border-default)",
                borderRadius: 16,
                padding: "13px 15px",
                textDecoration: "none"
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: 14, color: "var(--sk-text-primary)" }}>{alternative.name}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
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
                  <span aria-hidden style={{ fontSize: 16, color: "var(--sk-text-muted)" }}>›</span>
                </span>
              </div>
              <p style={{ fontSize: 11.5, color: "var(--sk-text-muted)", marginTop: 1 }}>{alternative.brand}</p>

              {alternative.reasons.map((reason) => (
                <p key={reason.metric} style={{ fontSize: 12.5, color: "var(--sk-status-positive)", marginTop: 7 }}>
                  {reason.text}
                </p>
              ))}
              {/* What gets worse is printed, never hidden. Always at least one. */}
              {alternative.tradeoffs.map((tradeoff) => (
                <p key={tradeoff} style={{ fontSize: 12.5, color: "var(--sk-score-weak)", marginTop: 3 }}>
                  {tradeoff}
                </p>
              ))}
            </Link>
          ))}
          {considerLine ? (
            <p style={{ fontSize: 11, color: "var(--sk-text-muted)" }}>{considerLine}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * MerkBuyNote — the "What would Merk buy?" note on the result screen.
 *
 * Kept exported from this module because ProductPageLayout imports it here.
 * Deliberately never quotes a figure: it is use-case advice, not a number. When
 * the Merk voice engine supplies a paragraph it is preferred (`note`), otherwise
 * a static strong/weak line by grade.
 */
export function MerkBuyNote({ grade, lang, note }: { grade: string | null; lang: Language; note?: string | null }) {
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
          fontFamily: "var(--sk-font-ui)",
          fontVariantNumeric: "tabular-nums",
          fontSize: 9.5,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--sk-text-muted)"
        }}
      >
        {t("product_what_would_merk_buy", lang)}
      </p>
      <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--sk-text-primary)", marginTop: 8 }}>
        {note?.trim() ? note : strong ? t("merk_buy_strong", lang) : t("merk_buy_weak", lang)}
      </p>
    </div>
  );
}
