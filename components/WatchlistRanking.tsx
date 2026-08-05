"use client";

/**
 * WatchlistRanking + AdditiveDonuts — the Stats page, D1 form.
 *
 * The ranking answers a question a grade never can: which specific additives do
 * YOU keep meeting? That is actionable in a way "you scanned 14 products" is
 * not.
 *
 * Only watch-list additives are counted, and the card says so out loud — a
 * tally that quietly folded in harmless ones would be inflating a worry.
 */

import type { Language } from "@/lib/i18n";

export type WatchItem = {
  code: string;
  name: string;
  count: number;
};

/** Two donuts: how much of the shelf was clean, how much was worth watching. */
export function AdditiveDonuts({
  additiveFreePercent,
  worthWatchingPercent,
  lang
}: {
  additiveFreePercent: number;
  worthWatchingPercent: number;
  lang: Language;
}) {
  const donuts = [
    {
      value: additiveFreePercent,
      colour: "var(--sk-score-good)",
      label: lang === "no" ? "Uten tilsetningsstoffer" : "Additive-free"
    },
    {
      value: worthWatchingPercent,
      colour: "var(--sk-score-weak)",
      label: lang === "no" ? "Verdt å følge med på" : "Worth watching"
    }
  ];

  return (
    <div style={{ display: "flex", gap: 10 }}>
      {donuts.map((donut) => (
        <div
          key={donut.label}
          style={{
            flex: 1,
            background: "var(--sk-surface-card)",
            border: "0.5px solid var(--sk-border-default)",
            borderRadius: 18,
            padding: "16px 14px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10
          }}
        >
          <div
            style={{
              width: 74,
              height: 74,
              borderRadius: "50%",
              background: `conic-gradient(${donut.colour} ${donut.value * 3.6}deg, var(--sk-brand-mist-dark) 0)`,
              display: "grid",
              placeItems: "center"
            }}
            role="img"
            aria-label={`${donut.label}: ${donut.value}%`}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "var(--sk-surface-card)",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--sk-font-ui)",
                fontVariantNumeric: "tabular-nums",
                fontSize: 17,
                color: "var(--sk-text-primary)"
              }}
            >
              {donut.value}%
            </div>
          </div>
          <span style={{ fontSize: 11.5, color: "var(--sk-text-muted)", textAlign: "center" }}>{donut.label}</span>
        </div>
      ))}
    </div>
  );
}

export function WatchlistRanking({
  items,
  totalDelta,
  lang
}: {
  items: WatchItem[];
  /** Change against last month; null when there is nothing to compare with. */
  totalDelta?: number | null;
  lang: Language;
}) {
  if (!items.length) return null;

  const total = items.reduce((sum, item) => sum + item.count, 0);
  const max = Math.max(...items.map((item) => item.count));

  return (
    <div
      style={{
        background: "var(--sk-surface-card)",
        border: "0.5px solid var(--sk-border-default)",
        borderRadius: 18,
        padding: "16px 18px"
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span
          style={{
            fontFamily: "var(--sk-font-ui)",
          fontVariantNumeric: "tabular-nums",
            fontSize: 9.5,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--sk-text-muted)"
          }}
        >
          {lang === "no" ? "Du møter oftest" : "You meet most often"}
        </span>
        {totalDelta != null && totalDelta !== 0 ? (
          <span
            style={{
              fontSize: 11.5,
              fontVariantNumeric: "tabular-nums",
              color: totalDelta > 0 ? "var(--sk-score-weak)" : "var(--sk-status-positive)"
            }}
          >
            {totalDelta > 0 ? "+" : "−"}
            {Math.abs(totalDelta)} {lang === "no" ? "mot forrige måned" : "vs last month"}
          </span>
        ) : null}
      </div>

      <div
        style={{
          fontFamily: "var(--sk-font-ui)",
          fontVariantNumeric: "tabular-nums",
          fontSize: 34,
          lineHeight: 1,
          color: "var(--sk-text-primary)",
          marginTop: 8
        }}
      >
        {total}
      </div>

      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 11 }}>
        {items.slice(0, 5).map((item) => (
          <div key={item.code} style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span
              style={{
                fontFamily: "var(--sk-font-ui)",
          fontVariantNumeric: "tabular-nums",
                fontSize: 12.5,
                color: "var(--sk-text-primary)",
                width: 52,
                flexShrink: 0
              }}
            >
              {item.code.toUpperCase()}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: "block",
                  height: 5,
                  borderRadius: 3,
                  background: "var(--sk-score-weak)",
                  width: `${Math.max(6, (item.count / max) * 100)}%`
                }}
                aria-hidden
              />
              <span
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "var(--sk-text-muted)",
                  marginTop: 4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {item.name}
              </span>
            </span>
            <span
              style={{
                fontFamily: "var(--sk-font-ui)",
                fontVariantNumeric: "tabular-nums",
                fontSize: 13,
                color: "var(--sk-text-secondary)",
                flexShrink: 0
              }}
            >
              ×{item.count}
            </span>
          </div>
        ))}
      </div>

      {/* Said out loud, because a silent filter is a lie by omission. */}
      <p style={{ fontSize: 11, color: "var(--sk-text-muted)", marginTop: 14, lineHeight: 1.5 }}>
        {lang === "no"
          ? "Bare de som er verdt å følge med på telles. Harmløse spores ikke."
          : "Only the ones worth watching are counted. Harmless ones are not tracked."}
      </p>
    </div>
  );
}
