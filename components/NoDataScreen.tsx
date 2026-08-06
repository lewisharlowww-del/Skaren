"use client";

/**
 * NoDataScreen — the 20–30 % of real Norwegian scans that find nothing.
 *
 * The rule this screen exists to protect: Skaren never guesses a score. An
 * invented number on an unknown product is worse than no number, because it
 * spends the trust the rest of the app is built on.
 *
 * So it does three things instead:
 *   1. Says so plainly, in Merk's voice.
 *   2. Shows what DID work — the read succeeded, the checksum passed, the
 *      record is missing. That turns "broken app" into "missing product".
 *   3. Offers the two ways forward: contribute it, or search by name.
 */

import Link from "next/link";
import { Merk } from "@/components/Merk";
import { isValidEan } from "@/lib/ean";
import { t, type Language } from "@/lib/i18n";

type Props = {
  barcode: string;
  lang: Language;
  onRetry?: () => void;
};

function Diagnostic({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "11px 15px",
        borderTop: "1px solid var(--sk-border-muted)"
      }}
    >
      <span
        aria-hidden
        style={{ color: ok ? "var(--sk-status-positive)" : "var(--sk-text-faint)", fontSize: 13 }}
      >
        {ok ? "✓" : "—"}
      </span>
      <span style={{ flex: 1, fontSize: 13.5, color: "var(--sk-text-primary)" }}>{label}</span>
    </div>
  );
}

export function NoDataScreen({ barcode, lang, onRetry }: Props) {
  const checksumOk = isValidEan(barcode);

  return (
    <div
      className="mx-auto w-full max-w-[430px] px-5 pb-28"
      style={{ paddingTop: "calc(24px + env(safe-area-inset-top))" }}
    >
      <div className="flex flex-col items-center text-center">
        <Merk expression="unsure" size={132} limbs={false} aria-label="Merk" />
        <h1
          style={{
            fontFamily: "var(--sk-font-brand)",
            fontSize: 24,
            letterSpacing: "-0.03em",
            color: "var(--sk-text-primary)",
            marginTop: 14
          }}
        >
          {t("nodata_title", lang)}
        </h1>
        <p style={{ fontSize: 14.5, lineHeight: 1.5, color: "var(--sk-text-secondary)", marginTop: 8 }}>
          {t("nodata_body", lang)}
        </p>
      </div>

      {/* What did work. Refusing to guess is only credible if we show our work. */}
      <div
        style={{
          marginTop: 20,
          background: "var(--sk-surface-card)",
          border: "0.5px solid var(--sk-border-default)",
          borderRadius: 18,
          overflow: "hidden"
        }}
      >
        <div style={{ padding: "13px 15px 2px" }}>
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
            {t("nodata_diagnostics", lang)}
          </span>
          <div
            style={{
              fontFamily: "var(--sk-font-ui)",
          fontVariantNumeric: "tabular-nums",
              fontSize: 16,
              color: "var(--sk-text-primary)",
              marginTop: 6,
              marginBottom: 10
            }}
          >
            {barcode}
          </div>
        </div>
        <Diagnostic label={t("nodata_read_ok", lang)} ok />
        <Diagnostic label={t("nodata_checksum_ok", lang)} ok={checksumOk} />
        <Diagnostic label={t("nodata_record_missing", lang)} ok={false} />
      </div>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 9 }}>
        {/* Twenty seconds, two photos. The catalogue gets better by being used. */}
        <a
          href={`https://world.openfoodfacts.org/cgi/product.pl?type=add&code=${encodeURIComponent(barcode)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring"
          style={{
            display: "flex",
            alignItems: "center",
            minHeight: "var(--sk-min-tap)",
            padding: "13px 16px",
            borderRadius: 16,
            background: "var(--sk-brand-forest)",
            color: "var(--sk-text-on-dark)",
            fontSize: 14
          }}
        >
          <span style={{ flex: 1 }}>
            {t("nodata_contribute", lang)}
            <span style={{ display: "block", fontSize: 11.5, opacity: 0.8, marginTop: 2 }}>
              {t("nodata_contribute_sub", lang)}
            </span>
          </span>
        </a>

        <Link
          href="/search"
          className="focus-ring"
          style={{
            display: "flex",
            alignItems: "center",
            minHeight: "var(--sk-min-tap)",
            padding: "13px 16px",
            borderRadius: 16,
            border: "1px solid var(--sk-border-default)",
            fontSize: 14,
            color: "var(--sk-text-primary)"
          }}
        >
          {t("scan_search_by_name", lang)}
        </Link>

        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="focus-ring"
            style={{
              minHeight: "var(--sk-min-tap)",
              borderRadius: 16,
              fontSize: 14,
              color: "var(--sk-brand-forest)"
            }}
          >
            {t("camera_try_again", lang)}
          </button>
        ) : null}
      </div>
    </div>
  );
}
