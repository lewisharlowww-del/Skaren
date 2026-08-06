"use client";
import { useState } from "react";
import { AppSplash } from "@/components/AppSplash";

/**
 * /splash-preview — watch the cold-start launch splash (design 19A) on demand.
 * The real one only plays for ~1.9s during app boot; this lets you replay it.
 * Tap "Replay" to remount and see the full Merk-assembles sequence again.
 */
export default function SplashPreview() {
  const [key, setKey] = useState(0);
  return (
    <div style={{ position: "relative", height: "100dvh", width: "100%" }}>
      <AppSplash key={key} />
      <button
        onClick={() => setKey((k) => k + 1)}
        style={{
          position: "absolute",
          bottom: "max(70px, calc(env(safe-area-inset-bottom) + 60px))",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          padding: "12px 26px",
          borderRadius: 999,
          border: "1px solid rgba(247,244,236,0.28)",
          background: "rgba(247,244,236,0.08)",
          color: "#F7F4EC",
          fontFamily: "var(--sk-font-data)",
          fontSize: 12,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          minHeight: 44,
        }}
      >
        Replay
      </button>
    </div>
  );
}
