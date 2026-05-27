import Image from "next/image";

type SkarenMarkProps = {
  className?: string;
  iconClassName?: string;
};

export function SkarenDrop({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <Image
      src="/icons/icon-192.png?v=4"
      alt=""
      width={192}
      height={192}
      aria-hidden="true"
      className={`rounded-[inherit] object-cover ${className}`}
      priority
    />
  );
}

export function SkarenMark({ className = "" }: SkarenMarkProps) {
  return (
    <span className={`grid place-items-center overflow-hidden rounded-2xl bg-[#0E5A34] text-white shadow-glass ${className}`}>
      <SkarenDrop className="h-full w-full" />
    </span>
  );
}

export function SkarenWordmark({ className = "" }: { className?: string }) {
  return (
    <svg className={`h-[1em] w-auto ${className}`} viewBox="0 0 238 70" fill="none" role="img" aria-label="Skaren">
      <text x="0" y="55" fontFamily="Sora, Plus Jakarta Sans, Arial, sans-serif" fontSize="58" fontWeight="760" letterSpacing="-3.9">
        <tspan fill="#0E5A34">Ska</tspan>
        <tspan fill="#4CAF7D">ren</tspan>
      </text>
    </svg>
  );
}
