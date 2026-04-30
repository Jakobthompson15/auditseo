import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0f",
        card: "#111118",
        seo: "#4febb4",
        ai: "#b46af7",
        purple: "#7c6af7",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "monospace"],
        sans: ["var(--font-body)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
