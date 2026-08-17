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
import { Merk, merkForGrade } from "@/components/Merk";
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
 * MerkBuyNote — the "What would Merk buy?" card on the result screen.
 *
 * Design (mascot bible, "the ink card"): the buy card is its own black box that
 * echoes the verdict — Merk on the left, a one-line teaser in his own words, a
 * chevron. Tapping it opens a bottom SHEET that is Merk's space: the full note,
 * two verdict chips, and one cream action button at the bottom ("show me a
 * better one") that hands off to the alternatives flow.
 *
 * Kept exported from this module because ProductPageLayout imports it here.
 * Deliberately never quotes a figure: it is use-case advice, not a number.
 */
export function MerkBuyNote({
  grade,
  lang,
  note,
  productName,
  brand,
  onFindAlternatives,
}: {
  grade: string | null;
  lang: Language;
  note?: string | null;
  productName?: string;
  brand?: string;
  onFindAlternatives?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const strong = grade === "A" || grade === "B";
  const body = note?.trim() ? note.trim() : strong ? t("merk_buy_strong", lang) : t("merk_buy_weak", lang);

  // The teaser is Merk's position in one line — his first sentence, not a
  // description of the feature. You tap because you want the reasoning.
  const teaser = firstSentence(body);
  const paragraphs = body.split(/\n+/).flatMap((p) => splitSentencesForSheet(p));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring w-full"
        aria-expanded={open}
        style={{
          position: "relative",
          overflow: "hidden",
          background: "var(--sk-verdict-bg)",
          borderRadius: 22,
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          textAlign: "left",
          border: "none",
          cursor: "pointer",
        }}
      >
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 30,
            height: 30,
            background: "var(--sk-verdict-fold)",
            clipPath: "polygon(0 0, 100% 100%, 0 100%)",
          }}
        />
        <Merk expression={merkForGrade(grade)} size={52} limbs={false} still aria-hidden />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontFamily: "var(--sk-font-brand)",
              fontSize: 17.5,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--sk-verdict-text)",
            }}
          >
            {t("product_what_would_merk_buy", lang)}
          </span>
          <span
            style={{
              display: "block",
              fontSize: 12.5,
              lineHeight: 1.45,
              color: "var(--sk-verdict-body)",
              marginTop: 4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {teaser}
          </span>
        </span>
        <span
          aria-hidden
          style={{
            width: 34,
            height: 34,
            flexShrink: 0,
            borderRadius: "50%",
            background: "rgba(246,243,236,.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            color: "var(--sk-verdict-text)",
          }}
        >
          ›
        </span>
      </button>

      <MerkBuySheet
        open={open}
        onClose={() => setOpen(false)}
        lang={lang}
        grade={grade}
        productName={productName}
        brand={brand}
        paragraphs={paragraphs}
        onFindAlternatives={onFindAlternatives}
      />
    </>
  );
}

/** The full "what would Merk buy" sheet — his space, in ink. */
function MerkBuySheet({
  open,
  onClose,
  lang,
  grade,
  productName,
  brand,
  paragraphs,
  onFindAlternatives,
}: {
  open: boolean;
  onClose: () => void;
  lang: Language;
  grade: string | null;
  productName?: string;
  brand?: string;
  paragraphs: string[];
  onFindAlternatives?: () => void;
}) {
  if (!open) return null;
  const subtitle = [productName, brand].filter(Boolean).join(" · ");
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("product_what_would_merk_buy", lang)}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        background: "rgba(32,29,21,.38)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          overflow: "hidden",
          background: "var(--sk-verdict-bg)",
          borderRadius: "30px 30px 0 0",
          padding: "14px 22px calc(26px + env(safe-area-inset-bottom))",
          boxShadow: "0 -18px 50px rgba(32,29,21,.35)",
          maxHeight: "88vh",
          overflowY: "auto",
        }}
      >
        <span
          aria-hidden
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: 44,
            height: 44,
            background: "var(--sk-verdict-fold)",
            clipPath: "polygon(0 0, 100% 100%, 0 100%)",
          }}
        />
        <div
          aria-hidden
          onClick={onClose}
          style={{ width: 38, height: 4, borderRadius: 2, background: "rgba(246,243,236,.22)", margin: "0 auto 16px", cursor: "pointer" }}
        />

        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <Merk expression={merkForGrade(grade)} size={62} aria-hidden />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--sk-font-brand)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--sk-verdict-text)", lineHeight: 1.15 }}>
              {t("product_what_would_merk_buy", lang)}
            </div>
            {subtitle ? (
              <div style={{ fontSize: 12.5, color: "var(--sk-verdict-body)", marginTop: 3 }}>{subtitle}</div>
            ) : null}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          {paragraphs.map((p, i) => (
            <p
              key={i}
              style={{
                fontSize: 15.5,
                lineHeight: 1.6,
                color: i === 0 ? "var(--sk-verdict-text)" : "rgba(246,243,236,.86)",
                marginTop: i === 0 ? 0 : 11,
              }}
            >
              {p}
            </p>
          ))}
        </div>

        {onFindAlternatives ? (
          <button
            type="button"
            onClick={() => {
              onClose();
              onFindAlternatives();
            }}
            className="focus-ring w-full"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              background: "var(--sk-verdict-text)",
              borderRadius: 18,
              padding: "14px 17px",
              marginTop: 15,
              border: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: "var(--sk-verdict-bg)" }}>
                {t("merk_buy_show_better", lang)}
              </span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--sk-brand-forest)", marginTop: 1 }}>
                {t("product_alternatives_sub", lang)}
              </span>
            </span>
            <span aria-hidden style={{ fontSize: 15, color: "var(--sk-verdict-bg)" }}>›</span>
          </button>
        ) : null}

        <p style={{ fontSize: 11.5, lineHeight: 1.5, color: "rgba(246,243,236,.45)", marginTop: 13, textAlign: "center" }}>
          {t("merk_buy_disclaimer", lang)}
        </p>
      </div>
    </div>
  );
}

/** Merk's first sentence, for the collapsed teaser. Kept short and un-truncated
 *  mid-word; the card clamps it to one line with an ellipsis. */
function firstSentence(text: string): string {
  const m = text.match(/^[^.!?]*[.!?]/);
  return (m ? m[0] : text).trim();
}

/** Break a paragraph into at most three sentences for the sheet, so the note
 *  reads as distinct beats rather than one wall of text. */
function splitSentencesForSheet(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
  if (sentences.length <= 1) return sentences;
  // Group into up to three beats: 1, then the middle, then the rest.
  const first = sentences[0];
  const rest = sentences.slice(1);
  if (rest.length <= 2) return [first, ...rest];
  const mid = rest.slice(0, rest.length - 1).join(" ");
  const last = rest[rest.length - 1];
  return [first, mid, last];
}
