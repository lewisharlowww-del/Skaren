export const colors = {
  brand: {
    forest: "#2d4a26",
    leaf: "#4a8c5c",
    mist: "#f5f0e8",
    mistDark: "#ede7dc",
    mistCard: "#f0ebe2"
  },
  grade: {
    A: { bg: "#eaf5ec", border: "#c8e8cc", text: "#2d4a26" },
    B: { bg: "#f0f8f2", border: "#c0ddc8", text: "#4a8c5c" },
    C: { bg: "#f8f6e8", border: "#ddd8b0", text: "#8a7a30" },
    D: { bg: "#fdf0e8", border: "#f0cdb8", text: "#b85c2a" },
    E: { bg: "#fdf0f0", border: "#f0c8c8", text: "#9a2a1a" }
  },
  surface: {
    white: "#ffffff",
    card: "#fafaf8",
    cardGreen: "#f8fdf8",
    cardAmber: "#fdf7f3",
    cardRed: "#fdf8f4",
    insight: "#f8faf6"
  },
  border: {
    default: "#e8e0d4",
    green: "#d8eddc",
    amber: "#f0ddd0",
    red: "#f0d8c8",
    muted: "#f0e8dc"
  },
  text: {
    primary: "#1e1e18",
    secondary: "#5a4a38",
    muted: "#a09080",
    faint: "#b0a898",
    green: "#2d4a26",
    amber: "#b85c2a",
    red: "#9a2a1a",
    onDark: "#f5f0e8",
    onDarkMuted: "rgba(245,240,232,0.45)"
  },
  status: {
    positive: "#2d4a26",
    warning: "#b85c2a",
    danger: "#9a2a1a",
    neutral: "#8a7a68"
  }
} as const;

export const typography = {
  fonts: {
    ui: "var(--font-manrope), sans-serif",
    brand: "'Satoshi', var(--font-manrope), sans-serif"
  },
  size: {
    displayXL: "48px",
    displayLg: "36px",
    h1: "28px",
    h2: "24px",
    h3: "18px",
    bodyLg: "16px",
    body: "14px",
    bodySm: "13px",
    caption: "11px",
    label: "10px"
  },
  weight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800
  },
  tracking: {
    brand: "0.18em",
    section: "0.12em",
    caption: "0.06em",
    tight: "-0.03em",
    tighter: "-0.04em"
  }
} as const;

export const radius = {
  sm: "10px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  pill: "20px",
  full: "9999px"
} as const;

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  xxl: "24px"
} as const;
