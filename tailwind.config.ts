/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  safelist: [
    // Keep only the classes we know are used dynamically across views
    "aspect-4/5",
    "hover:shadow-lg",
    "hover:brightness-[1.15]",
  ],
  // Disable container core plugin if not used to shave a few bytes
  corePlugins: {
    container: false,
  },
  theme: {
    extend: {
      colors: {
        border: "oklch(var(--border) / <alpha-value>)",
        input: "oklch(var(--input) / <alpha-value>)",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: "oklch(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "oklch(var(--card) / <alpha-value>)",
          foreground: "oklch(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "oklch(var(--popover) / <alpha-value>)",
          foreground: "oklch(var(--popover-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground) / <alpha-value>)",
        },
        chart: {
          1: "oklch(var(--chart-1) / <alpha-value>)",
          2: "oklch(var(--chart-2) / <alpha-value>)",
          3: "oklch(var(--chart-3) / <alpha-value>)",
          4: "oklch(var(--chart-4) / <alpha-value>)",
          5: "oklch(var(--chart-5) / <alpha-value>)",
        },
        brand: {
          DEFAULT: "oklch(var(--brand) / <alpha-value>)",
          hover: "oklch(var(--brand-hover) / <alpha-value>)",
          soft: "oklch(var(--brand-soft) / <alpha-value>)",
          onDark: "oklch(var(--brand-on-dark) / <alpha-value>)",
        },
        surface: {
          warm: "oklch(var(--surface-warm) / <alpha-value>)",
        },
      },
      screens: {
        xs: "480px",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
