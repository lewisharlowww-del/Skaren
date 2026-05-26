type SkarenMarkProps = {
  className?: string;
  iconClassName?: string;
};

export function SkarenDrop({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M14 3.9C17.95 7.18 20.25 10.75 20.25 14.42C20.25 18.18 17.57 21.05 14 21.05C10.43 21.05 7.75 18.18 7.75 14.42C7.75 10.75 10.05 7.18 14 3.9Z" fill="currentColor" />
      <path d="M10.85 13.2C11.58 11.72 12.84 10.78 14.78 10.44C15.35 10.34 15.82 10.82 15.72 11.39C15.38 13.33 14.44 14.59 12.96 15.32" stroke="var(--skaren-symbol-cut, #1A5C3A)" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.6 16.55H17.4" stroke="var(--skaren-symbol-cut, #1A5C3A)" strokeWidth="1.65" strokeLinecap="round" />
      <path d="M16.72 13.05H18.4" stroke="var(--skaren-symbol-cut, #1A5C3A)" strokeWidth="1.35" strokeLinecap="round" opacity="0.82" />
      <path d="M14 20.9V25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M11.45 24.75H16.55" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.72" />
    </svg>
  );
}

export function SkarenMark({ className = "", iconClassName = "h-6 w-6" }: SkarenMarkProps) {
  return (
    <span className={`grid place-items-center rounded-2xl bg-forest text-white shadow-glass ${className}`}>
      <SkarenDrop className={iconClassName} />
    </span>
  );
}

export function SkarenWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-black tracking-[-0.04em] text-forest ${className}`}>
      Ska<span className="text-lime-500">ren</span>
    </span>
  );
}
