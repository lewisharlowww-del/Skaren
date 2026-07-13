"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Moon, Sun } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useTheme, type ThemePreference } from "@/lib/theme-context";

const OPTIONS: {
  value: ThemePreference;
  label: string;
  sub: string;
  icon: React.ReactNode;
  preview: { bg: string; card: string; text: string; sub: string; accent: string };
}[] = [
  {
    value: "light",
    label: "Light",
    sub: "Always light",
    icon: <Sun size={18} />,
    preview: { bg: "#f7f2ea", card: "#ffffff", text: "#2d4a26", sub: "#786c5c", accent: "#2d4a26" },
  },
  {
    value: "dark",
    label: "Dark",
    sub: "Always dark",
    icon: <Moon size={18} />,
    preview: { bg: "#1a1714", card: "#242018", text: "#f0ece0", sub: "#6e6458", accent: "#6abf58" },
  },
];

function ThemePreviewCard({
  preview,
}: {
  preview: { bg: string; card: string; text: string; sub: string; accent: string };
}) {
  return (
    <div
      className="w-full rounded-xl overflow-hidden"
      style={{ background: preview.bg, padding: 10, height: 72 }}
    >
      <div
        className="rounded-lg px-2 py-1.5"
        style={{ background: preview.card, border: `1px solid ${preview.text}18` }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md" style={{ background: preview.accent + "22" }} />
          <div className="flex-1 space-y-1">
            <div className="h-1.5 rounded-full w-16" style={{ background: preview.text + "cc" }} />
            <div className="h-1.5 rounded-full w-10" style={{ background: preview.sub + "99" }} />
          </div>
          <div className="w-5 h-5 rounded-md" style={{ background: preview.accent + "33" }} />
        </div>
      </div>
    </div>
  );
}

export default function AppearancePage() {
  const router = useRouter();
  const { preference, setPreference } = useTheme();

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--sk-brand-mist)", fontFamily: "Manrope, sans-serif" }}
    >
      <BottomNav />
      <main className="mx-auto min-h-screen w-full max-w-[430px] pb-32 pt-4">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pb-6">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--sk-surface-white)", border: "1px solid var(--sk-border-default)" }}
          >
            <ArrowLeft size={18} style={{ color: "var(--sk-text-green)" }} />
          </button>
          <div>
            <h1
              className="text-[22px] font-black tracking-tight"
              style={{ fontFamily: "Satoshi, sans-serif", color: "var(--sk-text-green)" }}
            >
              Appearance
            </h1>
            <p className="text-[12px]" style={{ color: "var(--sk-text-muted)" }}>
              Choose your preferred theme
            </p>
          </div>
        </div>

        {/* Options */}
        <div className="px-4 flex flex-col gap-3">
          {OPTIONS.map((opt) => {
            const active = preference === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setPreference(opt.value)}
                className="w-full rounded-2xl text-left overflow-hidden transition-all"
                style={{
                  border: active
                    ? "2px solid var(--sk-brand-forest)"
                    : "1.5px solid var(--sk-border-default)",
                  background: "var(--sk-surface-white)",
                }}
              >
                {/* Preview */}
                <div className="px-3 pt-3">
                  <ThemePreviewCard preview={opt.preview} />
                </div>

                {/* Label row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: active ? "var(--sk-brand-forest)" : "var(--sk-grade-a-bg)",
                      color: active ? "#ddeedd" : "var(--sk-text-green)",
                    }}
                  >
                    {opt.icon}
                  </div>
                  <div className="flex-1">
                    <p
                      className="text-[14px] font-bold"
                      style={{ color: "var(--sk-text-primary)" }}
                    >
                      {opt.label}
                    </p>
                    <p className="text-[12px]" style={{ color: "var(--sk-text-muted)" }}>
                      {opt.sub}
                    </p>
                  </div>
                  {active && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: "var(--sk-brand-forest)" }}
                    >
                      <Check size={13} color="#ddeedd" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <p className="mx-4 mt-6 text-[11px] leading-relaxed" style={{ color: "var(--sk-text-faint)" }}>
          Dark mode reduces eye strain in low-light environments and may extend battery life on OLED screens.
        </p>
      </main>
    </div>
  );
}
