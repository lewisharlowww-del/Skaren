import { Crown, Gem, HeartHandshake, Sparkles } from "lucide-react";

type SupporterBadgeProps = {
  badge: string;
  amountNok?: number;
  compact?: boolean;
  className?: string;
};

function getBadgeTone(badge: string) {
  const normalized = badge.toLowerCase();

  if (normalized.includes("founder")) {
    return {
      Icon: Gem,
      eyebrow: "Top supporter",
      shell: "border-amber-200 bg-[radial-gradient(circle_at_20%_0%,#FFF7D6,transparent_32%),linear-gradient(135deg,#1A5C3A,#09130E)] text-white shadow-[0_22px_60px_rgba(26,92,58,0.28)]",
      icon: "bg-amber-100 text-amber-700 ring-4 ring-white/20",
      text: "text-amber-100",
      shine: true
    };
  }

  if (normalized.includes("founding")) {
    return {
      Icon: Crown,
      eyebrow: "Early supporter",
      shell: "border-leaf-200 bg-gradient-to-br from-leaf-50 via-white to-cream text-ink shadow-soft",
      icon: "bg-forest text-white ring-4 ring-leaf-100",
      text: "text-forest",
      shine: false
    };
  }

  return {
    Icon: HeartHandshake,
    eyebrow: "Supporter",
    shell: "border-black/5 bg-white text-ink shadow-sm",
    icon: "bg-leaf-100 text-forest",
    text: "text-soil-600",
    shine: false
  };
}

export function SupporterBadge({ badge, amountNok = 0, compact = false, className = "" }: SupporterBadgeProps) {
  const tone = getBadgeTone(badge);
  const Icon = tone.Icon;

  if (compact) {
    return (
      <span
        className={`relative inline-flex min-h-11 items-center gap-2 overflow-hidden rounded-full border px-4 py-2 font-black ${tone.shell} ${className}`}
      >
        {tone.shine ? <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" /> : null}
        <span className={`relative grid h-8 w-8 place-items-center rounded-full ${tone.icon}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="relative whitespace-nowrap">{badge}</span>
      </span>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-[1.75rem] border p-4 ${tone.shell} ${className}`}>
      {tone.shine ? (
        <>
          <span className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-200/25 blur-2xl" />
          <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
        </>
      ) : null}
      <div className="relative flex items-center gap-4">
        <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${tone.icon}`}>
          <Icon className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <p className={`text-xs font-black uppercase tracking-[0.16em] ${tone.text}`}>{tone.eyebrow}</p>
          <p className="mt-1 text-xl font-black">{badge}</p>
          {amountNok > 0 ? <p className={`mt-1 text-sm font-bold ${tone.text}`}>{amountNok} kr support received</p> : null}
        </div>
        {tone.shine ? <Sparkles className="ml-auto h-6 w-6 shrink-0 text-amber-200" /> : null}
      </div>
    </div>
  );
}
