import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172126",
        paper: "#f4f1e9",
        moss: {
          50: "#eff7f2",
          100: "#dcece1",
          500: "#347255",
          600: "#285d45",
          700: "#214a39",
          900: "#173227"
        },
        rust: {
          50: "#fff5ef",
          100: "#fee7d9",
          500: "#c96639",
          600: "#a94d27",
          700: "#883c20"
        }
      },
      boxShadow: {
        soft: "0 18px 60px rgba(31, 49, 41, 0.10)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Arial", "sans-serif"],
        display: ["var(--font-newsreader)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
