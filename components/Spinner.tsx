type SpinnerProps = {
  size?: number;
  className?: string;
};

export function Spinner({ size = 20, className = "" }: SpinnerProps) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="18" cy="18" r="14" stroke="#e0d8cc" strokeWidth="3" />
      <path d="M18 4 A14 14 0 0 1 32 18" stroke="#2d4a26" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
