import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#0a0a0f",
          card: "#13131a",
          border: "#1e1e2e",
          hover: "#1a1a2a",
        },
        accent: {
          blue: "#00d4ff",
          purple: "#8b5cf6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', '"Fira Code"', "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
