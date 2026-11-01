import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0B1F17",
          forest: "#0F2E22",
          green: "#1A4D38",
          accent: "#7CFF6B",
          lime: "#A8FF7A",
          cta: "#22C55E",
          "cta-dark": "#16A34A",
          muted: "#8BA89A",
          soft: "#F4F7F5",
          border: "#E5EBE8",
        },
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11, 31, 23, 0.04), 0 4px 16px rgba(11, 31, 23, 0.06)",
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
