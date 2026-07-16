import type { Config } from "tailwindcss";

// Aula Magna design tokens (teal + coral, ink-dark) so the free edition looks
// like the real product. Kept as CSS variables in globals.css.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        electric: "rgb(var(--electric) / <alpha-value>)",
        pink: "rgb(var(--pink) / <alpha-value>)",
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          dark: "rgb(var(--ink-dark) / <alpha-value>)",
          400: "rgb(var(--ink-400) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          soft: "rgb(var(--surface-soft) / <alpha-value>)",
          muted: "rgb(var(--surface-muted) / <alpha-value>)",
        },
        border: "rgb(var(--border) / <alpha-value>)",
        status: {
          success: "rgb(var(--success) / <alpha-value>)",
          warning: "rgb(var(--warning) / <alpha-value>)",
          danger: "rgb(var(--danger) / <alpha-value>)",
        },
      },
      borderRadius: { "2xl": "1rem", "3xl": "1.5rem" },
    },
  },
  plugins: [],
};

export default config;
