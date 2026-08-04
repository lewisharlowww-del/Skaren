/**
 * Spinner — but never a spinner. Per the redesign spec, every loading state is
 * Merk's barcode, never a circle. This renders a small row of barcode bars that
 * pulse in sequence, keeping the same { size, className } API so existing call
 * sites (scan, search, list, pricing) pick it up with no changes.
 */

type SpinnerProps = {
  size?: number;
  className?: string;
};

// Bar heights as a fraction of the box, drawn like a barcode fragment.
const BARS = [0.55, 1, 0.7, 1, 0.45, 0.85, 0.65];

export function Spinner({ size = 20, className = "" }: SpinnerProps) {
  const gap = Math.max(1.5, size * 0.09);
  const barW = Math.max(1.5, size * 0.09);
  return (
    <span
      className={`sk-barcode-loader ${className}`}
      role="status"
      aria-label="Loading"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap,
        height: size,
        width: size,
      }}
    >
      {BARS.map((h, i) => (
        <span
          key={i}
          style={{
            width: barW,
            height: `${h * 100}%`,
            borderRadius: 0.5,
            background: "var(--sk-brand-forest, #33684A)",
            animation: "sk-barcode-pulse 1s ease-in-out infinite",
            animationDelay: `${i * 0.09}s`,
          }}
        />
      ))}
    </span>
  );
}
