import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Cores personalizadas do OX Inventory
        "ox-yellow": "#fabd07",
        "ox-orange": "#FF9100",
        "ox-gold": "#b58821",
        "ox-black": "#000000",
        "ox-blue-light": "#A9C4E5",
        "ox-cream": "#F4DDAE",
        "ox-gray": "#8B8C7E",
        "ox-beige": "#C9B07A",
        "ox-blue": "#3599B8",
        "ox-pink": "#DFBFBF",
        "ox-teal": "#4AC5BB",
        "ox-slate": "#5F6B6D",
        "ox-coral": "#FB8281",
        "ox-lime": "#F4D25A",

        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#fabd07",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#A9C4E5",
          foreground: "#000000",
        },
        destructive: {
          DEFAULT: "#FB8281",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#F4DDAE",
          foreground: "#5F6B6D",
        },
        accent: {
          DEFAULT: "#4AC5BB",
          foreground: "#ffffff",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
