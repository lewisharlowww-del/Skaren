"use client";

import {
  BADGE_CATEGORIES,
  type BadgeCategory,
  type BadgeId,
  type BadgeResult,
  earnedCount,
} from "@/lib/badges";
import { t, type Language } from "@/lib/i18n";

/**
 * Badge motifs — one per category, per the redesign:
 *   "Scanning badges gain barcode bars per tier, streaks climb like steps,
 *    health collects A's, additives carry the magnifier."
 * Earned badges are printed in the category ink; locked ones are the same
 * motif in pencil grey. No random lucide icons.
 */
type MotifKind = "barcode" | "steps" | "grade" | "magnifier" | "mark";

function categoryMotif(category: BadgeCategory, id: BadgeId): MotifKind {
  if (category === "scanning") return "barcode";
  if (category === "streak") return "steps";
  if (category === "health") return "grade";
  if (category === "additives") return "magnifier";
  // special: Legend is a scan milestone (barcode); Pioneer is the label mark.
  return id === "legend" ? "barcode" : "mark";
}

// One colour per category — the "one category colour" rule.
const CATEGORY_COLOUR: Record<BadgeCategory, { ink: string; tint: string; border: string }> = {
  scanning:  { ink: "var(--sk-brand-forest)", tint: "var(--sk-grade-a-bg)", border: "var(--sk-grade-a-border)" },
  streak:    { ink: "var(--sk-score-mid)",    tint: "var(--sk-grade-c-bg)", border: "var(--sk-grade-c-border)" },
  health:    { ink: "var(--sk-brand-forest)", tint: "var(--sk-grade-a-bg)", border: "var(--sk-grade-a-border)" },
  additives: { ink: "#185FA5",                tint: "#E3F0FB",              border: "#A8CFEE" },
  special:   { ink: "var(--sk-text-primary)", tint: "var(--sk-brand-mist-card)", border: "var(--sk-border-default)" },
};

function Motif({ kind, colour, size = 22 }: { kind: MotifKind; colour: string; size?: number }) {
  const s = size;
  if (kind === "barcode" || kind === "steps") {
    // Barcode bars; for "steps" they climb left→right like a staircase.
    const heights = kind === "steps" ? [0.4, 0.6, 0.8, 1] : [0.7, 1, 0.5, 0.9, 0.6];
    const barW = kind === "steps" ? 3 : 2.4;
    return (
      <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 2, height: s }} aria-hidden>
        {heights.map((h, i) => (
          <span key={i} style={{ width: barW, height: `${h * 100}%`, background: colour, borderRadius: 0.5 }} />
        ))}
      </span>
    );
  }
  if (kind === "grade") {
    return (
      <span
        aria-hidden
        style={{ fontFamily: "var(--sk-font-brand)", fontSize: s * 0.95, fontWeight: 600, lineHeight: 1, color: colour, letterSpacing: "-0.03em" }}
      >
        A
      </span>
    );
  }
  if (kind === "magnifier") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="10.5" cy="10.5" r="6.5" stroke={colour} strokeWidth="2" />
        <path d="M15.5 15.5L21 21" stroke={colour} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  // mark — a folded-corner label / diamond, Merk's silhouette.
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 3.5h8.5L19 8v12.5H6z" fill={colour} />
      <path d="M14.5 3.5L19 8h-4.5z" fill="rgba(255,255,255,0.35)" />
    </svg>
  );
}

// ── Single badge tile ─────────────────────────────────────────────────────────

function BadgeTile({ badge, lang }: { badge: BadgeResult; lang: Language }) {
  const earned = badge.earned;
  const cat = CATEGORY_COLOUR[badge.category];
  const kind = categoryMotif(badge.category, badge.id as BadgeId);
  const ink = earned ? cat.ink : "var(--sk-text-faint)";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
      {/* Icon box — soft rounded square, category tint when earned, pencil grey when locked. */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: earned ? cat.tint : "var(--sk-brand-mist-card)",
          border: earned ? `1.5px solid ${cat.border}` : "1.5px dashed var(--sk-border-default)",
          opacity: earned ? 1 : 0.7,
        }}
      >
        <Motif kind={kind} colour={ink} />
      </div>

      {/* Name */}
      <p style={{
        fontSize: 10,
        fontWeight: 700,
        textAlign: "center",
        lineHeight: 1.3,
        color: earned ? "var(--sk-text-primary)" : "var(--sk-text-muted)",
        fontFamily: "var(--sk-font-ui)",
        maxWidth: 64,
      }}>
        {t(badge.nameKey as Parameters<typeof t>[0], lang)}
      </p>

      {/* Progress bar or earned label */}
      {"progress" in badge && badge.progress !== undefined ? (
        <div style={{ width: 52 }}>
          <div style={{ background: "var(--sk-border-muted)", borderRadius: 99, height: 3, overflow: "hidden" }}>
            <div style={{ height: 3, borderRadius: 99, background: cat.ink, width: `${Math.round(badge.progress * 100)}%` }} />
          </div>
          {badge.progressLabel && (
            <p style={{ fontSize: 9, color: "var(--sk-text-faint)", textAlign: "center", marginTop: 3, lineHeight: 1, fontFamily: "var(--sk-font-data)" }}>
              {badge.progressLabel}
            </p>
          )}
        </div>
      ) : (
        <p style={{
          fontSize: 9,
          color: earned ? cat.ink : "var(--sk-text-faint)",
          textAlign: "center",
          lineHeight: 1,
          fontFamily: "var(--sk-font-data)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontWeight: earned ? 600 : 400,
        }}>
          {earned ? t("badge_earned_label", lang) : t("badge_locked_label", lang)}
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function BadgesSection({ badges, lang = "en" }: { badges: BadgeResult[]; lang?: Language }) {
  const total = badges.length;
  const earned = earnedCount(badges);

  return (
    <div style={{ fontFamily: "var(--sk-font-ui)" }}>
      {/* Earned count pill */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--sk-text-green)",
          background: "var(--sk-grade-a-bg)",
          border: "1px solid var(--sk-grade-a-border)",
          borderRadius: 99,
          padding: "3px 10px",
        }}>
          {earned} / {total} {t("account_badges_earned_suffix", lang)}
        </span>
      </div>

      {/* Category cards */}
      {BADGE_CATEGORIES.map((cat) => {
        const catBadges = badges.filter((b) => b.category === cat.id);
        if (!catBadges.length) return null;

        return (
          <div key={cat.id} style={{
            background: "var(--sk-brand-mist)",
            border: "1px solid var(--sk-border-muted)",
            borderRadius: 14,
            marginBottom: 10,
            padding: "14px 14px 18px",
          }}>
            <p style={{
              fontFamily: "var(--sk-font-data)",
              fontSize: 10,
              fontWeight: 400,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--sk-text-muted)",
              marginBottom: 14,
            }}>
              {t(cat.labelKey as Parameters<typeof t>[0], lang)}
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "14px 6px",
            }}>
              {catBadges.map((badge) => (
                <BadgeTile key={badge.id} badge={badge} lang={lang} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
