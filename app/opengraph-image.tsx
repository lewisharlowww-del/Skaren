import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Skaren — Scan mat. Spis smartere.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0f1a0b",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 80px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            left: 200,
            top: 100,
            width: 500,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(45,74,38,0.5) 0%, transparent 70%)",
          }}
        />

        {/* Left side */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, zIndex: 1 }}>

          {/* Logo row */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "#2d4a26",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l4 4L19 7" stroke="#c8f0c8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontSize: 36, fontWeight: 900, color: "#ffffff", letterSpacing: -1 }}>
              Skaren
            </span>
          </div>

          {/* Headline */}
          <div style={{ fontSize: 72, fontWeight: 900, color: "#ffffff", lineHeight: 1.05, letterSpacing: -2, marginBottom: 8 }}>
            Scan mat.
          </div>
          <div style={{ fontSize: 72, fontWeight: 900, color: "#4a8c5c", lineHeight: 1.05, letterSpacing: -2, marginBottom: 28 }}>
            Spis smartere.
          </div>

          {/* Subtitle */}
          <div style={{ fontSize: 22, color: "#6ab87a", marginBottom: 36 }}>
            Matvarescanner for Norge — gratis på iOS
          </div>

          {/* Grade badges */}
          <div style={{ display: "flex", gap: 12 }}>
            {[["HELSE","A"],["ECO","B"],["NOVA","1"],["ADD","0"]].map(([label, val]) => (
              <div
                key={label}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 18,
                  background: "#162412",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: "#4a8c5c", letterSpacing: 2 }}>{label}</span>
                <span style={{ fontSize: 44, fontWeight: 900, color: "#c8f0c8", lineHeight: 1 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — phone mockup */}
        <div
          style={{
            width: 260,
            height: 500,
            borderRadius: 40,
            background: "#0a1208",
            border: "2.5px solid #2d4a26",
            display: "flex",
            flexDirection: "column",
            padding: "20px 16px",
            gap: 10,
            flexShrink: 0,
            marginLeft: 60,
            zIndex: 1,
          }}
        >
          {/* Status bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>9:41</span>
            <div style={{ width: 60, height: 12, borderRadius: 6, background: "#0a1208" }} />
          </div>

          {/* Scanner box */}
          <div
            style={{
              background: "#040d02",
              borderRadius: 16,
              height: 140,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "#4a8c5c", opacity: 0.9 }} />
            {/* Corner marks */}
            {[["top:8px left:8px","top","left"],["top:8px right:8px","top","right"],["bottom:8px left:8px","bottom","left"],["bottom:8px right:8px","bottom","right"]].map(([pos]) => (
              <div key={pos} style={{ position: "absolute", width: 16, height: 16 }} />
            ))}
          </div>

          {/* Product card */}
          <div style={{ background: "#040d02", borderRadius: 14, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1a3a18" }} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: "#fff" }}>Havregryn 1kg</span>
                <span style={{ fontSize: 10, color: "#4a8c5c" }}>Mills</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["A","B","1","0"].map((v) => (
                <div key={v} style={{ flex: 1, height: 28, borderRadius: 8, background: "#1a3a18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: "#c8f0c8" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI insight */}
          <div style={{ background: "rgba(74,140,92,0.12)", borderRadius: 12, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#4a8c5c" }}>AI-INNSIKT</span>
            <span style={{ fontSize: 10, color: "#86efac", lineHeight: 1.4 }}>NOVA 1 — ingen prosesserte ingredienser.</span>
          </div>

          {/* Additives -->*/}
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ flex: 1, borderRadius: 10, background: "#0d2e10", padding: "6px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <span style={{ fontSize: 9, color: "#86efac" }}>E300</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#86efac" }}>Trygg</span>
            </div>
            <div style={{ flex: 1, borderRadius: 10, background: "#2d200a", padding: "6px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <span style={{ fontSize: 9, color: "#fbbf24" }}>E471</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#fbbf24" }}>Moderat</span>
            </div>
            <div style={{ flex: 1, borderRadius: 10, background: "#2d0a0a", padding: "6px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <span style={{ fontSize: 9, color: "#f87171" }}>E250</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#f87171" }}>Unngå</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
