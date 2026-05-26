import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  detail?: string;
  tone?: "green" | "amber" | "red" | "neutral" | "dark";
};

const tones = {
  green: "from-emerald-50 to-white text-forest",
  amber: "from-amber-50 to-white text-amber-800",
  red: "from-rose-50 to-white text-rose-800",
  neutral: "from-soil-50 to-white text-soil-700",
  dark: "from-ink to-forest text-white"
};

export function StatCard({ label, value, icon: Icon, detail, tone = "green" }: StatCardProps) {
  const dark = tone === "dark";

  return (
    <div className={`min-w-0 rounded-[1.75rem] border border-white/70 bg-gradient-to-br p-5 shadow-soft backdrop-blur-xl ${tones[tone]}`}>
      <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ${dark ? "bg-white/12 text-white" : "bg-white text-forest"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className={`text-xs font-black uppercase tracking-[0.15em] ${dark ? "text-white/55" : "text-soil-500"}`}>{label}</p>
      <p className={`mt-2 truncate font-display text-3xl font-black tracking-[-0.04em] ${dark ? "text-white" : "text-ink"}`}>{value}</p>
      {detail ? <p className={`mt-2 line-clamp-2 text-sm font-semibold leading-6 ${dark ? "text-white/65" : "text-soil-600"}`}>{detail}</p> : null}
    </div>
  );
}
