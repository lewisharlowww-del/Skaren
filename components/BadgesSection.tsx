"use client";

import {
  Award,
  Crown,
  Eye,
  Flame,
  Heart,
  Leaf,
  Moon,
  Package,
  ScanBarcode,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  BADGE_CATEGORIES,
  type BadgeId,
  type BadgeResult,
  earnedCount,
} from "@/lib/badges";

// ── Icon + color config per badge ─────────────────────────────────────────────

type BadgeStyle = {
  Icon: LucideIcon;
  iconColor: string;
  iconColorLocked: string;
  bg: string;
  bgLocked: string;
  border: string;
  borderLocked: string;
};

const BADGE_STYLES: Record<BadgeId, BadgeStyle> = {
  first_scan:     { Icon: ScanBarcode,  iconColor: "#2d7a2d", iconColorLocked: "#b0a898", bg: "#e8f4e0", bgLocked: "var(--sk-surface-raised,#f0ece0)", border: "#b8dda8", borderLocked: "var(--sk-border-muted)" },
  scan_10:        { Icon: Package,      iconColor: "#2d7a2d", iconColorLocked: "#b0a898", bg: "#e8f4e0", bgLocked: "var(--sk-surface-raised,#f0ece0)", border: "#b8dda8", borderLocked: "var(--sk-border-muted)" },
  scan_25:        { Icon: ShoppingCart, iconColor: "#2d7a2d", iconColorLocked: "#b0a898", bg: "#e8f4e0", bgLocked: "var(--sk-surface-raised,#f0ece0)", border: "#b8dda8", borderLocked: "var(--sk-border-muted)" },
  scan_50:        { Icon: Star,         iconColor: "#2d7a2d", iconColorLocked: "#b0a898", bg: "#e8f4e0", bgLocked: "var(--sk-surface-raised,#f0ece0)", border: "#b8dda8", borderLocked: "var(--sk-border-muted)" },
  scan_100:       { Icon: Target,       iconColor: "#0f6e56", iconColorLocked: "#b0a898", bg: "#e0f4ee", bgLocked: "var(--sk-surface-raised,#f0ece0)", border: "#9dddc6", borderLocked: "var(--sk-border-muted)" },
  streak_3:       { Icon: Flame,        iconColor: "#b55a00", iconColorLocked: "#b0a898", bg: "#fef3dc", bgLocked: "var(--sk-surface-raised,#f0ece0)", border: "#f5cc7a", borderLocked: "var(--sk-border-muted)" },
  streak_7:       { Icon: Zap,          iconColor: "#b55a00", iconColorLocked: "#b0a898", bg: "#fef3dc", bgLocked: "var(--sk-surface-raised,#f0ece0)", border: "#f5cc7a", borderLocked: "var(--sk-border-muted)" },
  streak_30:      { Icon: Moon,         iconColor: "#b55a00", iconColorLocked: "#b0a898", bg: "#fef3dc", bgLocked: "var(--sk-surface-raised,#f0ece0)", border: "#f5cc7a", borderLocked: "var(--sk-border-muted)" },
  streak_100:     { Icon: Crown,        iconColor: "#534ab7", iconColorLocked: "#b0a898", bg: "#eeedfe", bgLocked: "var(--sk-surface-raised,#f0ece0)", border: "#c4baf8", borderLocked: "var(--sk-border-muted)" },
  grade_a_1:      { Icon: Leaf,         iconColor: "#0f6e56", iconColorLocked: "#b0a898", bg: "#e0f4ee", bgLocked: "var(--sk-surface-raised,#f0ece0)", border: "#9dddc6", borderLocked: "var(--sk-border-muted)" },
  grade_a_5:      { Icon: Award,        iconColor: "#0f6e56", iconColorLocked: "#b0a898", bg: "#e0f4ee", bgLocked: "var(--sk-surface-raised,#f0ece0)", border: "#9dddc6", borderLocked: "var(--sk-border-muted)" },
  grade_a_10:     { Icon: Heart,        iconColor: "#0f6e56", iconColorLocked: "#b0a898", bg: "#e0f4ee", bgLocked: "var(--sk-surface-raised,#f0ece0)", border: "#9dddc6", borderLocked: "var(--sk-border-muted)" },
  additive_aware: { Icon: Eye,          iconColor: "#185fa5", iconColorLocked: "#b0a898", bg: "#e3f0fb", bgLocked: "var(--sk-surface-raised,#f0ece0)", border: "#a8cfee", borderLocked: "var(--sk-border-muted)" },
  label_reader:   { Icon: Search,       iconColor: "#185fa5", iconColorLocked: "#b0a898", bg: "#e3f0fb", bgLocked: "var(--sk-surface-raised,#f0ece0)", border: "#a8cfee", borderLocked: "var(--sk-border-muted)" },
  avoid_expert:   { Icon: ShieldCheck,  iconColor: "#993c1d", iconColorLocked: "#b0a898", bg: "#faece7", bgLocked: "var(--sk-surface-raised,#f0ece0)", border: "#f0997b", borderLocked: "var(--sk-border-muted)" },
  pioneer:        { Icon: Leaf,         iconColor: "#534ab7", iconColorLocked: "#b0a898", bg: "#eeedfe", bgLocked: "var(--sk-surface-raised,#f0ece0)", border: "#c4baf8", borderLocked: "var(--sk-border-muted)" },
  legend:         { Icon: Trophy,       iconColor: "#534ab7", iconColorLocked: "#b0a898", bg: "#eeedfe", bgLocked: "var(--sk-surface-raised,#f0ece0)", border: "#c4baf8", borderLocked: "var(--sk-border-muted)" },
};

// ── Single badge tile ─────────────────────────────────────────────────────────

function BadgeTile({ badge }: { badge: BadgeResult }) {
  const s = BADGE_STYLES[badge.id as BadgeId];
  const earned = badge.earned;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>

      {/* Icon box */}
      <div style={{ position: "relative" }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: earned ? s.bg : s.bgLocked,
            border: `1.5px solid ${earned ? s.border : s.borderLocked}`,
            opacity: earned ? 1 : 0.5,
          }}
        >
          <s.Icon
            size={22}
            style={{ color: earned ? s.iconColor : s.iconColorLocked }}
            strokeWidth={1.8}
          />
        </div>

        {/* Lock pip */}
        {!earned && (
          <div
            style={{
              position: "absolute",
              bottom: -4,
              right: -4,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "var(--sk-surface-white, #fff)",
              border: "1px solid var(--sk-border-default)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="8" height="8" viewBox="0 0 10 12" fill="none">
              <rect x="1" y="5" width="8" height="6" rx="1.5" fill="#b0a898"/>
              <path d="M3 5V3.5a2 2 0 014 0V5" stroke="#b0a898" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>

      {/* Name */}
      <p style={{
        fontSize: 10,
        fontWeight: 700,
        textAlign: "center",
        lineHeight: 1.3,
        color: earned ? "var(--sk-text-primary)" : "var(--sk-text-muted)",
        fontFamily: "Manrope, sans-serif",
        maxWidth: 64,
      }}>
        {badge.name}
      </p>

      {/* Progress bar or earned label */}
      {"progress" in badge && badge.progress !== undefined ? (
        <div style={{ width: 52 }}>
          <div style={{ background: "var(--sk-border-muted)", borderRadius: 99, height: 3, overflow: "hidden" }}>
            <div style={{ height: 3, borderRadius: 99, background: "var(--sk-brand-forest,#2d4a26)", width: `${Math.round(badge.progress * 100)}%` }} />
          </div>
          {badge.progressLabel && (
            <p style={{ fontSize: 9, color: "var(--sk-text-faint)", textAlign: "center", marginTop: 3, lineHeight: 1, fontFamily: "Manrope, sans-serif" }}>
              {badge.progressLabel}
            </p>
          )}
        </div>
      ) : (
        <p style={{
          fontSize: 9,
          color: earned ? s.iconColor : "var(--sk-text-faint)",
          textAlign: "center",
          lineHeight: 1,
          fontFamily: "Manrope, sans-serif",
          fontWeight: earned ? 700 : 400,
        }}>
          {earned ? "Earned" : "Locked"}
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function BadgesSection({ badges }: { badges: BadgeResult[] }) {
  const total = badges.length;
  const earned = earnedCount(badges);

  return (
    <div style={{ fontFamily: "Manrope, sans-serif" }}>
      {/* Earned count pill */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--sk-text-green)",
          background: "var(--sk-grade-a-bg)",
          border: "1px solid var(--sk-grade-a-border, #b8dda8)",
          borderRadius: 99,
          padding: "3px 10px",
        }}>
          {earned} / {total} earned
        </span>
      </div>

      {/* Category cards */}
      {BADGE_CATEGORIES.map((cat) => {
        const catBadges = badges.filter((b) => b.category === cat.id);
        if (!catBadges.length) return null;

        return (
          <div key={cat.id} style={{
            background: "var(--sk-brand-mist, #f5f0e8)",
            border: "1px solid var(--sk-border-muted)",
            borderRadius: 14,
            marginBottom: 10,
            padding: "14px 14px 18px",
          }}>
            <p style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--sk-text-muted)",
              marginBottom: 14,
            }}>
              {cat.label}
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "14px 6px",
            }}>
              {catBadges.map((badge) => (
                <BadgeTile key={badge.id} badge={badge} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
