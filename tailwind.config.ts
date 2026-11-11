import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background-rgb) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface-rgb) / <alpha-value>)",
          elevated: "rgb(var(--surface-elevated-rgb) / <alpha-value>)",
          subtle: "rgb(var(--background-rgb) / <alpha-value>)",
          border: "rgb(var(--border-rgb) / <alpha-value>)",
          "border-hover": "rgba(var(--primary-rgb), 0.4)",
        },
        accent: {
          DEFAULT: "rgb(var(--primary-rgb) / <alpha-value>)",
          teal: "rgb(var(--primary-rgb) / <alpha-value>)",
          deep: "rgb(var(--teal-deep-rgb) / <alpha-value>)",
          secondary: "rgb(var(--teal-secondary-rgb) / <alpha-value>)",
          hover: "var(--primary-hover)",
          soft: "var(--primary-soft)",
          subtle: "var(--accent-subtle)",
          glow: "var(--accent-glow)",
          amber: "rgb(var(--amber-rgb) / <alpha-value>)",
          terracotta: "rgb(var(--terracotta-rgb) / <alpha-value>)",
          sage: "rgb(var(--sage-rgb) / <alpha-value>)",
        },
        content: {
          primary: "rgb(var(--foreground-rgb) / <alpha-value>)",
          secondary: "var(--secondary)",
          muted: "var(--muted)",
          dim: "var(--muted)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      letterSpacing: {
        tighter: "-0.04em",
        tight: "-0.02em",
        wide: "0.04em",
        widest: "0.12em",
      },
      backgroundImage: {
        "radial-glow": "radial-gradient(circle at 50% 0%, var(--accent-subtle) 0%, transparent 60%)",
        "subtle-mesh": "radial-gradient(at 0% 0%, var(--accent-subtle) 0px, transparent 50%), radial-gradient(at 100% 100%, var(--accent-glow) 0px, transparent 50%)",
      },
    },
  },
  plugins: [],
};

export default config;
