type SkarenMarkProps = {
  className?: string;
  iconClassName?: string;
};

export function SkarenDrop({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M14 4C14 4 8 8.2 8 14C8 17.31 10.69 20 14 20C17.31 20 20 17.31 20 14C20 10.1 16.05 6 14 4Z" fill="currentColor" opacity="0.92" />
      <path d="M14 20V25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 22H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
      <circle cx="14" cy="13" r="2.5" fill="#1A5C3A" />
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
