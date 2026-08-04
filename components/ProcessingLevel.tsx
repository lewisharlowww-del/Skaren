"use client";

/**
 * ProcessingLevel — the NOVA card, D1 form.
 *
 * Four discrete segments, only the active one coloured, step names underneath.
 * Position in the row carries the meaning as well as the colour does, so the
 * card still reads without hue.
 */

import { t, type Language } from "@/lib/i18n";

type Props = {
  novaGroup: 1 | 2 | 3 | 4;
  lang: Language;
};

const STEP_KEYS = [
  "product_nova_natural",
  "product_nova_culinary",
  "product_nova_processed",
  "product_nova_ultra"
] as const;

const NAME_KEYS = [
  "product_nova_unprocessed",
  "product_nova_processed_ingredients",
  "product_nova_processed",
  "product_nova_ultra"
] as const;

/** Only NOVA 3 and 4 are worth a colour; 1 and 2 are simply food. */
function accentFor(group: number): string {
  if (group >= 4) return "var(--sk-score-weak)";
  if (group === 3) return "var(--sk-score-mid)";
  return "var(--sk-status-positive)";
}

export function ProcessingLevel({ novaGroup, lang }: Props) {
  const accent = accentFor(novaGroup);

  return (
    <div
      style={{
        background: "var(--sk-surface-card)",
        border: "0.5px solid var(--sk-border-default)",
        borderRadius: 18,
        padding: "15px 18px 14px"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontFamily: "var(--sk-font-data)",
            fontSize: 9.5,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--sk-text-muted)"
          }}
        >
          {t("product_processing", lang)}
        </span>
        <span
          style={{
            fontFamily: "var(--sk-font-ui)",
            fontVariantNumeric: "tabular-nums",
            fontSize: 10,
            color: "var(--sk-text-muted)"
          }}
        >
          NOVA {novaGroup} {t("product_of", lang)} 4
        </span>
      </div>

      <div
        style={{
          fontFamily: "var(--sk-font-brand)",
          fontSize: 20,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          color: "var(--sk-text-primary)",
          marginTop: 6
        }}
      >
        {t(NAME_KEYS[novaGroup - 1], lang)}
      </div>

      <div style={{ display: "flex", gap: 4, marginTop: 12 }} aria-hidden>
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            style={{
              flex: 1,
              height: 9,
              borderRadius: 3,
              background: step === novaGroup ? accent : "var(--sk-brand-mist-dark)"
            }}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, marginTop: 7 }}>
        {STEP_KEYS.map((key, index) => {
          const active = index + 1 === novaGroup;
          return (
            <span
              key={key}
              style={{
                flex: 1,
                fontSize: 10.5,
                textAlign: index === 0 ? "left" : index === 3 ? "right" : "center",
                color: active ? accent : "var(--sk-text-muted)",
                fontWeight: active ? 600 : 400
              }}
            >
              {t(key, lang)}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/**
 * AllergenCard — "Contains milk" at 20px in clay, with what it does NOT contain
 * underneath. The negative list is the reassuring half and is easy to forget.
 */
export function AllergenCard({ allergens, lang }: { allergens: string[]; lang: Language }) {
  const COMMON = ["nuts", "gluten", "soy", "egg", "fish", "milk"];
  const present = allergens.map((a) => a.toLowerCase());
  const absent = COMMON.filter((item) => !present.some((p) => p.includes(item)));

  return (
    <div
      style={{
        background: "var(--sk-surface-card)",
        border: "0.5px solid var(--sk-border-default)",
        borderRadius: 18,
        padding: "15px 18px 14px"
      }}
    >
      <span
        style={{
          fontFamily: "var(--sk-font-data)",
          fontSize: 9.5,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--sk-text-muted)"
        }}
      >
        {t("product_allergens", lang)}
      </span>

      <div
        style={{
          fontFamily: "var(--sk-font-brand)",
          fontSize: 20,
          letterSpacing: "-0.02em",
          lineHeight: 1.15,
          marginTop: 4,
          color: allergens.length ? "var(--sk-score-weak)" : "var(--sk-status-positive)"
        }}
      >
        {allergens.length
          ? `${t("product_contains", lang)} ${allergens.join(", ").toLowerCase()}`
          : t("product_no_allergens", lang)}
      </div>

      {absent.length ? (
        <p style={{ fontSize: 12, color: "var(--sk-text-muted)", marginTop: 8 }}>
          {t("product_no_prefix", lang)} {absent.slice(0, 4).join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
