'use client';

/**
 * Merk — Skaren's mascot. A premium Scandinavian food label that came to life
 * to help people understand food before they buy it. Curious, honest, calm,
 * slightly nerdy, never sarcastic, never angry.
 *
 * Pure CSS/DOM, zero deps, no image assets — one <Merk expression="scanning" />
 * covers 9 expressions x accessories x seasons, works offline in the Capacitor
 * build, scales to any size, and respects prefers-reduced-motion.
 *
 * Ported from the concept mascot bible and retuned to Skaren's real palette
 * (styles/tokens.ts) so Merk can never drift from the brand colours.
 */

import { colors } from "@/styles/tokens";
import type { CSSProperties } from "react";

// Brand palette — single source of truth is styles/tokens.ts.
const FOREST = colors.brand.forest; // #2d4a26 — Merk's ink (eyes, mouth, bars)
const GREEN = colors.brand.leaf; //  #4a8c5c — scan line, accents, sparkles
const CREAM = colors.brand.mist; //  #f5f0e8 — his paper body
const SHADOW = colors.brand.mistDark; // #ede7dc — folded corner + soft shadow

export type MerkExpression =
  | "happy"
  | "curious"
  | "surprised"
  | "unsure"
  | "confident"
  | "celebration"
  | "concern"
  | "thinking"
  | "scanning";

export type MerkAccessory = "none" | "apple" | "magnifier" | "basket" | "carton" | "phone";
export type MerkSeason = "none" | "santa" | "easter" | "flag";
export type MerkPose = "idle" | "point" | "wave" | "hold";

export interface MerkProps {
  expression?: MerkExpression;
  size?: number;
  limbs?: boolean;
  pose?: MerkPose;
  accessory?: MerkAccessory;
  season?: MerkSeason;
  /** Freeze all animation (use in scrolling lists — nine breathing mascots is a battery cost). */
  still?: boolean;
  "aria-label"?: string;
  className?: string;
}

// Barcode "moods" — the bars are Merk's heartbeat and change with his state.
const EVEN = [3, 3, 3, 3, 2, 4, 3, 3, 2, 3, 4, 3];
const UNEVEN = [4, 2, 7, 2, 3, 8, 2, 4, 3];
const SPARSE = [2, 3, 2, 2, 3, 2];

type ExprSpec = {
  eye: "arc" | "pill";
  ew: number;
  eh: number;
  rotL?: number;
  rotR?: number;
  lid?: number;
  lidL?: number;
  lidR?: number;
  mouth: "smile" | "open" | "smirk" | "frown" | "o" | "line" | "wave";
  bars: number[];
  gap: number;
  corner: "bounce" | "up" | "flip" | "curl" | "droop" | "wiggle";
  tilt?: number;
  hop?: boolean;
  sparkles?: boolean;
  flicker?: boolean;
  look?: boolean;
  scan?: boolean;
};

const EXPR: Record<MerkExpression, ExprSpec> = {
  happy: { eye: "arc", ew: 26, eh: 14, mouth: "smile", bars: EVEN, gap: 4, corner: "bounce" },
  curious: { eye: "pill", ew: 13, eh: 26, rotL: -4, rotR: 4, lidR: 9, mouth: "line", bars: UNEVEN, gap: 5, corner: "up", tilt: 4 },
  surprised: { eye: "pill", ew: 18, eh: 30, mouth: "o", bars: EVEN, gap: 4, corner: "flip" },
  unsure: { eye: "pill", ew: 13, eh: 22, rotL: 9, rotR: -9, lid: 6, mouth: "wave", bars: SPARSE, gap: 9, corner: "curl" },
  confident: { eye: "pill", ew: 15, eh: 26, lid: 13, mouth: "smirk", bars: EVEN, gap: 4, corner: "up" },
  celebration: { eye: "arc", ew: 30, eh: 17, mouth: "open", bars: EVEN, gap: 4, corner: "flip", hop: true, sparkles: true },
  concern: { eye: "pill", ew: 14, eh: 24, rotL: -11, rotR: 11, lid: 7, mouth: "frown", bars: SPARSE, gap: 9, corner: "droop", flicker: true },
  thinking: { eye: "pill", ew: 13, eh: 24, lid: 11, mouth: "line", bars: UNEVEN, gap: 5, corner: "curl", look: true },
  scanning: { eye: "pill", ew: 17, eh: 31, mouth: "line", bars: EVEN, gap: 4, corner: "wiggle", scan: true, look: true },
};

const CORNER: Record<string, string> = {
  bounce: "rotate(-3deg) scale(1.03)",
  up: "rotate(-9deg) scale(1.08)",
  flip: "rotate(-16deg) scale(1.14)",
  curl: "rotate(6deg) scale(.74)",
  droop: "rotate(15deg) scale(.88)",
  wiggle: "rotate(0deg)",
};

const PAPER = [
  "repeating-linear-gradient(94deg, rgba(45,74,38,.018) 0 1px, rgba(0,0,0,0) 1px 4px)",
  "repeating-linear-gradient(6deg, rgba(45,74,38,.013) 0 1px, rgba(0,0,0,0) 1px 5px)",
  "repeating-linear-gradient(52deg, rgba(237,231,220,.5) 0 1px, rgba(0,0,0,0) 1px 9px)",
].join(", ");

const ARM_ANGLE: Record<MerkPose, number> = { idle: -18, point: -74, wave: -108, hold: -8 };

/**
 * Map an A–E grade to the honest face Merk should wear. Single source of truth
 * so a grade can never render the wrong expression.
 */
export function merkForGrade(grade?: string | null): MerkExpression {
  switch ((grade ?? "").toUpperCase()) {
    case "A":
      return "celebration";
    case "B":
      return "happy";
    case "C":
      return "thinking";
    case "D":
      return "unsure";
    case "E":
      return "concern";
    default:
      return "curious";
  }
}

let injected = false;
function useMerkStyles() {
  if (injected || typeof document === "undefined") return;
  injected = true;
  const el = document.createElement("style");
  el.setAttribute("data-merk", "");
  el.textContent = `
@keyframes merk-breathe { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-2px) scale(1.012); } }
@keyframes merk-blink { 0%,92%,100% { transform: scaleY(1); } 95%,97% { transform: scaleY(0.12); } }
@keyframes merk-wiggle { 0%,100% { transform: rotate(0deg); } 30% { transform: rotate(-9deg) scale(1.06); } 65% { transform: rotate(4deg); } }
@keyframes merk-scan { 0% { top: 6%; opacity: 0; } 12% { opacity: 1; } 88% { opacity: 1; } 100% { top: 92%; opacity: 0; } }
@keyframes merk-barpulse { 0%,100% { opacity: .28; } 50% { opacity: 1; } }
@keyframes merk-flicker { 0%,100% { opacity: 1; } 43% { opacity: .35; } 47% { opacity: 1; } 55% { opacity: .5; } }
@keyframes merk-hop { 0%,100% { transform: translateY(0); } 30% { transform: translateY(-14px); } 55% { transform: translateY(0); } 70% { transform: translateY(-5px); } }
@keyframes merk-spark { 0%,100% { transform: scale(.4) rotate(45deg); opacity: 0; } 50% { transform: scale(1) rotate(45deg); opacity: 1; } }
@keyframes merk-look { 0%,100% { transform: translateX(-3px); } 50% { transform: translateX(3px); } }
@media (prefers-reduced-motion: reduce) {
  [data-merk-root] * { animation: none !important; }
}
`;
  document.head.appendChild(el);
}

export function Merk({
  expression = "happy",
  size = 240,
  limbs = true,
  pose = "idle",
  accessory = "none",
  season = "none",
  still = false,
  className,
  ...rest
}: MerkProps) {
  useMerkStyles();

  const e = EXPR[expression] ?? EXPR.happy;
  const s = size / 262;
  const arc = e.eye === "arc";

  const anims: string[] = [];
  if (!still) {
    anims.push("merk-breathe 4.2s ease-in-out infinite");
    if (e.hop) anims.push("merk-hop 2.6s ease-in-out infinite");
  }

  const eyeBase = (w: number, h: number, rot?: number): CSSProperties => ({
    position: "relative",
    overflow: "hidden",
    width: w,
    height: h,
    flexShrink: 0,
    background: arc ? "transparent" : FOREST,
    borderTop: arc ? `5px solid ${FOREST}` : "none",
    borderRadius: arc ? `${w}px ${w}px 0 0` : 999,
    transform: rot ? `rotate(${rot}deg)` : "none",
    boxShadow: e.scan ? `0 0 12px ${GREEN}88` : "none",
    animation: e.look && !still ? "merk-look 2.2s ease-in-out infinite" : "none",
  });
  const lid = (h?: number): CSSProperties => ({
    position: "absolute",
    top: 0,
    left: -2,
    right: -2,
    height: h || 0,
    background: CREAM,
    borderRadius: "0 0 4px 4px",
  });

  const mouths: Record<string, CSSProperties> = {
    smile: { width: 34, height: 16, borderBottom: `5px solid ${FOREST}`, borderRadius: "0 0 34px 34px" },
    open: { width: 40, height: 24, background: FOREST, borderRadius: "4px 4px 26px 26px" },
    smirk: { width: 26, height: 12, borderBottom: `5px solid ${FOREST}`, borderRadius: "0 0 26px 26px", transform: "rotate(-9deg) translateX(5px)" },
    frown: { width: 28, height: 14, borderTop: `5px solid ${FOREST}`, borderRadius: "28px 28px 0 0" },
    o: { width: 17, height: 17, border: `5px solid ${FOREST}`, borderRadius: 999 },
    line: { width: 18, height: 5, background: FOREST, borderRadius: 3 },
    wave: { width: 26, height: 5, background: FOREST, borderRadius: 3, transform: "rotate(-7deg)" },
  };

  const bars = e.bars.map((w, i) => ({
    width: w,
    height: i % 3 === 0 ? 44 : 38,
    background: FOREST,
    borderRadius: 1,
    opacity: e.flicker ? 1 : 0.92,
    animation:
      e.scan && !still
        ? `merk-barpulse 1.2s ${i * 0.06}s infinite`
        : e.flicker && !still
        ? `merk-flicker 2.6s ${i * 0.12}s infinite`
        : "none",
  }));

  const aR = ARM_ANGLE[pose] ?? -18;

  return (
    <div
      data-merk-root
      className={className}
      role="img"
      aria-label={rest["aria-label"] ?? `Merk (${expression})`}
      style={{ position: "relative", width: Math.round(200 * s), height: Math.round(262 * s), flexShrink: 0, overflow: "visible" }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 200,
          height: 262,
          transformOrigin: "top left",
          transform: `scale(${s})${e.tilt ? ` rotate(${e.tilt}deg)` : ""}`,
        }}
      >
        {limbs && (
          <>
            <div style={{ position: "absolute", left: 16, top: 128, width: 7, height: 42, borderRadius: 4, background: FOREST, transformOrigin: "top center", transform: "rotate(18deg)" }} />
            <div style={{ position: "absolute", right: 16, top: 128, width: 7, height: 42, borderRadius: 4, background: FOREST, transformOrigin: "top center", transform: `rotate(${aR}deg)` }} />
            <div style={{ position: "absolute", left: 56, top: 222, display: "flex", alignItems: "flex-start" }}>
              <div style={{ width: 7, height: 20, borderRadius: 4, background: FOREST }} />
              <div style={{ width: 24, height: 9, borderRadius: "5px 6px 4px 4px", background: FOREST, marginLeft: -9, marginTop: 13 }} />
            </div>
            <div style={{ position: "absolute", left: 114, top: 222, display: "flex", alignItems: "flex-start", flexDirection: "row-reverse" }}>
              <div style={{ width: 7, height: 20, borderRadius: 4, background: FOREST }} />
              <div style={{ width: 24, height: 9, borderRadius: "6px 5px 4px 4px", background: FOREST, marginRight: -9, marginTop: 13 }} />
            </div>
          </>
        )}

        <div
          style={{
            position: "absolute",
            left: 17,
            top: 6,
            width: 166,
            height: 222,
            background: CREAM,
            backgroundImage: PAPER,
            borderRadius: "32px 6px 30px 34px",
            clipPath: "polygon(0 0, calc(100% - 34px) 0, 100% 34px, 100% 100%, 0 100%)",
            filter: `drop-shadow(0 10px 18px ${SHADOW}8c)`,
            animation: anims.join(", ") || "none",
          }}
        >
          <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", boxShadow: `inset 0 -7px 14px -8px ${SHADOW}e6, inset 0 2px 0 rgba(255,255,255,.6)`, pointerEvents: "none" }} />

          <div style={{ position: "absolute", left: 0, right: 0, top: 56, display: "flex", justifyContent: "center", gap: 40, animation: still ? "none" : "merk-blink 5.4s infinite" }}>
            <div style={eyeBase(e.ew, e.eh, e.rotL)}><div style={lid(e.lidL ?? e.lid)} /></div>
            <div style={eyeBase(e.ew, e.eh, e.rotR)}><div style={lid(e.lidR ?? e.lid)} /></div>
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 112, display: "flex", justifyContent: "center" }}>
            <div style={mouths[e.mouth]} />
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 146, display: "flex", justifyContent: "center", alignItems: "flex-end", height: 44 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: e.gap, height: 44 }}>
              {bars.map((b, i) => (
                <div key={i} style={b} />
              ))}
            </div>
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 196, display: "flex", justifyContent: "center" }}>
            <div style={{ fontFamily: "ui-monospace, 'JetBrains Mono', monospace", fontSize: 8, letterSpacing: 2.2, color: FOREST, opacity: 0.42 }}>7 041234 567890</div>
          </div>

          {e.scan && (
            <div style={{ position: "absolute", left: 8, right: 8, height: 3, borderRadius: 2, background: GREEN, boxShadow: `0 0 14px 3px ${GREEN}8c`, animation: still ? "none" : "merk-scan 2.4s ease-in-out infinite" }} />
          )}

          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: 34,
              height: 34,
              background: SHADOW,
              clipPath: "polygon(0 0, 100% 100%, 0 100%)",
              borderBottomLeftRadius: 5,
              transformOrigin: "30% 70%",
              transform: CORNER[e.corner] || "none",
              animation: e.corner === "wiggle" && !still ? "merk-wiggle 1.8s ease-in-out infinite" : "none",
            }}
          />
        </div>

        {e.sparkles && (
          <>
            <div style={{ position: "absolute", left: 6, top: 26, width: 11, height: 11, background: GREEN, borderRadius: 2, animation: still ? "none" : "merk-spark 1.6s ease-in-out infinite" }} />
            <div style={{ position: "absolute", right: 2, top: 66, width: 8, height: 8, background: GREEN, borderRadius: 2, animation: still ? "none" : "merk-spark 1.6s .45s ease-in-out infinite" }} />
            <div style={{ position: "absolute", left: 30, top: 0, width: 7, height: 7, background: FOREST, borderRadius: 2, animation: still ? "none" : "merk-spark 1.6s .8s ease-in-out infinite" }} />
          </>
        )}

        {accessory === "apple" && (
          <div style={{ position: "absolute", right: -16, top: 158 }}>
            <div style={{ width: 30, height: 28, borderRadius: "50% 50% 46% 46%", background: GREEN }} />
            <div style={{ width: 3, height: 8, background: FOREST, borderRadius: 2, position: "absolute", top: -5, left: 14, transform: "rotate(14deg)" }} />
          </div>
        )}
        {accessory === "magnifier" && (
          <div style={{ position: "absolute", right: -30, top: 132, transform: "rotate(18deg)" }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", border: `5px solid ${FOREST}`, background: `${GREEN}2e` }} />
            <div style={{ width: 6, height: 22, borderRadius: 3, background: FOREST, position: "absolute", left: 16, top: 34 }} />
          </div>
        )}
        {accessory === "basket" && (
          <div style={{ position: "absolute", right: -34, top: 170 }}>
            <div style={{ width: 20, height: 12, border: `4px solid ${FOREST}`, borderBottom: "none", borderRadius: "12px 12px 0 0", margin: "0 auto" }} />
            <div style={{ width: 48, height: 30, background: FOREST, clipPath: "polygon(0 0, 100% 0, 88% 100%, 12% 100%)", borderRadius: 4 }} />
          </div>
        )}
        {accessory === "carton" && (
          <div style={{ position: "absolute", right: -28, top: 140 }}>
            <div style={{ width: 32, height: 16, background: GREEN, clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} />
            <div style={{ width: 32, height: 40, background: GREEN, borderRadius: "2px 2px 4px 4px" }} />
          </div>
        )}
        {accessory === "phone" && (
          <div style={{ position: "absolute", right: -24, top: 146, width: 30, height: 52, borderRadius: 7, background: FOREST, padding: 4, boxSizing: "border-box" }}>
            <div style={{ width: "100%", height: "100%", borderRadius: 4, background: GREEN, opacity: 0.85 }} />
          </div>
        )}

        {season === "santa" && (
          <div style={{ position: "absolute", left: 30, top: -10, transform: "rotate(-12deg)", zIndex: 2 }}>
            <div style={{ width: 38, height: 34, background: GREEN, clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} />
            <div style={{ width: 44, height: 9, borderRadius: 5, background: CREAM, marginLeft: -3, marginTop: -3, boxShadow: `0 1px 0 ${SHADOW}` }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: CREAM, position: "absolute", left: 36, top: -4 }} />
          </div>
        )}
        {season === "easter" && (
          <div style={{ position: "absolute", right: -26, bottom: 6, width: 26, height: 34, borderRadius: "50% 50% 48% 48% / 62% 62% 38% 38%", background: GREEN, boxShadow: `inset 0 -6px 0 ${FOREST}2e` }} />
        )}
        {season === "flag" && (
          <div style={{ position: "absolute", right: -34, top: 120 }}>
            <div style={{ width: 4, height: 86, background: FOREST, borderRadius: 2, position: "absolute", left: 0, top: 0 }} />
            <div style={{ position: "absolute", left: 4, top: 4, width: 44, height: 32, background: FOREST, borderRadius: 1 }}>
              <div style={{ position: "absolute", left: 12, top: 0, width: 8, height: "100%", background: CREAM }} />
              <div style={{ position: "absolute", top: 12, left: 0, height: 8, width: "100%", background: CREAM }} />
              <div style={{ position: "absolute", left: 14, top: 0, width: 4, height: "100%", background: GREEN }} />
              <div style={{ position: "absolute", top: 14, left: 0, height: 4, width: "100%", background: GREEN }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Merk;
