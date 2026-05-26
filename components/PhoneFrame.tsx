import type { ReactNode } from "react";

type PhoneFrameProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  dark?: boolean;
};

export function PhoneFrame({ children, className = "", contentClassName = "", dark = false }: PhoneFrameProps) {
  return (
    <div className={`rounded-[2.25rem] border-[3px] border-ink bg-ink p-1 shadow-phone ${className}`}>
      <div className={`relative overflow-hidden rounded-[1.9rem] ${dark ? "bg-ink text-white" : "bg-white text-ink"}`}>
        <div className="absolute left-1/2 top-0 z-10 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-ink" />
        <div className={`min-h-[34rem] px-7 pb-8 pt-10 ${contentClassName}`}>{children}</div>
      </div>
    </div>
  );
}
