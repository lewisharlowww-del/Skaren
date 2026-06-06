import type { LucideIcon } from "lucide-react";

type BadgeCardProps = {
  name: string;
  earned: boolean;
  icon: LucideIcon;
};

export function BadgeCard({ name, earned, icon: Icon }: BadgeCardProps) {
  return (
    <div className={`flex min-w-0 items-center gap-3 rounded-[1.35rem] border p-4 shadow-sm ${earned ? "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white text-ink" : "border-black/5 bg-soil-50 text-soil-600"}`}>
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${earned ? "bg-forest text-white" : "bg-white text-soil-500"}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="type-body min-w-0 flex-1 truncate font-bold">{name}</span>
      <span className={`type-caption ml-auto shrink-0 rounded-full px-3 py-1 ${earned ? "bg-emerald-100 text-emerald-800" : "bg-white text-soil-500"}`}>
        {earned ? "Earned" : "Locked"}
      </span>
    </div>
  );
}
