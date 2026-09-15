import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#E4DCC8",
        tile: "#FBF8F1",
        ink: "#22251F",
        line: "#A89C82",
        muted: "#5B5D55",
        amber: "#D9A441",
        denim: "#3E5C76",
        moss: "#5A7052",
        rust: "#B4552F",
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
