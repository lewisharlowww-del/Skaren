export const colors = {
  brand: {
    forest: "#33684A",
    leaf: "#33684A",
    mist: "#F6F3EC",
    mistDark: "#EDE7D8",
    mistCard: "#F0EBDD"
  },
  grade: {
    A: { bg: "#E4EEE7", border: "#C6DCCC", text: "#33684A" },
    B: { bg: "#EAF1EA", border: "#CFE0D2", text: "#33684A" },
    C: { bg: "#F5F0DF", border: "#E6DCBE", text: "#9C7A2C" },
    D: { bg: "#F7EBE2", border: "#EAD5C6", text: "#9C7A2C" },
    E: { bg: "#F6E7E0", border: "#E8CFC3", text: "#C0603C" }
  },
  surface: {
    white: "#ffffff",
    card: "#ffffff",
    cardGreen: "#F3F7F3",
    cardAmber: "#FBF6EE",
    cardRed: "#FCF6F3",
    insight: "#F0EBDD"
  },
  border: {
    default: "#E6E0D0",
    green: "#BFD5C6",
    amber: "#E6D2C6",
    red: "#E6D2C6",
    muted: "#F3EEE2"
  },
  text: {
    primary: "#201D15",
    secondary: "#5C5546",
    muted: "#948B76",
    faint: "#B4AB98",
    green: "#33684A",
    amber: "#9C7A2C",
    red: "#C0603C",
    onDark: "#F6F3EC",
    onDarkMuted: "rgba(246,243,236,0.55)"
  },
  status: {
    positive: "#33684A",
    warning: "#C0603C",
    danger: "#9A3A28",
    neutral: "#948B76"
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
