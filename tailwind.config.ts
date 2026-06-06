import type { Config } from "tailwindcss";
import { colors, radius, typography } from "./styles/tokens";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: colors.text.primary,
        cream: colors.brand.mist,
        porcelain: colors.surface.cardGreen,
        forest: colors.brand.forest,
        sage: colors.text.muted,
        moss: colors.status.neutral,
        clay: colors.status.warning,
        lime: {
          50: colors.grade.B.bg,
          100: colors.grade.A.bg,
          300: colors.grade.B.border,
          400: colors.brand.leaf,
          500: colors.brand.leaf,
          600: colors.brand.leaf,
          700: colors.brand.forest
        },
        leaf: {
          50: colors.grade.B.bg,
          100: colors.grade.A.bg,
          200: colors.grade.A.border,
          500: colors.brand.leaf,
          600: colors.brand.leaf,
          700: colors.brand.forest,
          900: colors.brand.forest
        },
        soil: {
          50: colors.surface.insight,
          100: colors.brand.mistDark,
          600: colors.text.secondary,
          900: colors.text.primary
        }
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
        brand: ["Satoshi", "var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
        manrope: ["var(--font-manrope)", "sans-serif"],
        satoshi: ["Satoshi", "var(--font-manrope)", "sans-serif"]
      },
      fontSize: {
        "sk-display-xl": typography.size.displayXL,
        "sk-display-lg": typography.size.displayLg,
        "sk-h1": typography.size.h1,
        "sk-h2": typography.size.h2,
        "sk-h3": typography.size.h3,
        "sk-body-lg": typography.size.bodyLg,
        "sk-body": typography.size.body,
        "sk-body-sm": typography.size.bodySm,
        "sk-caption": typography.size.caption,
        "sk-label": typography.size.label
      },
      boxShadow: {
        soft: "0 24px 70px rgba(26, 92, 58, 0.10)",
        phone: "0 28px 80px rgba(16, 21, 18, 0.22)",
        glass: "0 18px 55px rgba(26, 92, 58, 0.12)"
      },
      borderRadius: {
        "4xl": radius.xl,
        "5xl": "40px",
        sk: radius.sm,
        "sk-md": radius.md,
        "sk-lg": radius.lg,
        "sk-xl": radius.xl
      }
    }
  },
  plugins: []
};

export default config;
