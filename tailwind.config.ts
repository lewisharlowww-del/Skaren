import type { Config } from "tailwindcss";

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
        ink: "#101512",
        cream: "#F7F2E9",
        porcelain: "#F0F7F2",
        forest: "#1A5C3A",
        sage: "#A8B8A1",
        moss: "#566B4F",
        clay: "#D98E5F",
        lime: {
          50: "#F0F7F2",
          100: "#DDEFE5",
          300: "#9ED8B9",
          400: "#6DC797",
          500: "#4CAF7D",
          600: "#32885D",
          700: "#1A5C3A"
        },
        leaf: {
          50: "#F0F7F2",
          100: "#DDEFE5",
          200: "#BFE3CF",
          500: "#4CAF7D",
          600: "#32885D",
          700: "#1A5C3A",
          900: "#0F3F28"
        },
        soil: {
          50: "#F8FBF8",
          100: "#EFE8DC",
          600: "#777469",
          900: "#22251F"
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"DM Sans"', "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Sora"', '"Plus Jakarta Sans"', "Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 24px 70px rgba(26, 92, 58, 0.10)",
        phone: "0 28px 80px rgba(16, 21, 18, 0.22)",
        glass: "0 18px 55px rgba(26, 92, 58, 0.12)"
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem"
      }
    }
  },
  plugins: []
};

export default config;
