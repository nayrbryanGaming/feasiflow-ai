import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        // Cohesive cool-gray surface system + single indigo accent.
        base: "#0a0b0f",       // page background
        surface: "#111319",    // card
        elevated: "#171a22",   // raised card / hover
        line: "#222632",       // hairline border
        fg: "#e7e9ee",         // primary text
        muted: "#9aa1b0",      // secondary text
        faint: "#6a7283",      // tertiary text
        accent: {
          DEFAULT: "#6366f1",
          fg: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
        },
        brand: { 50: "#eff6ff", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8" },
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(99,102,241,0.25), 0 8px 30px -8px rgba(99,102,241,0.35)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 400ms cubic-bezier(0,0,0.2,1) both",
      },
    },
  },
  plugins: [],
};
export default config;
