import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "var(--font-inter)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "var(--font-mono-source)",
          "JetBrains Mono",
          "ui-monospace",
          "monospace",
        ],
      },
      colors: {
        // Legacy and existing shadcn variables
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "var(--color-accent-500, #10b981)",
          foreground: "hsl(var(--accent-foreground))",
          50: "var(--color-accent-50)",
          100: "var(--color-accent-100)",
          200: "var(--color-accent-200)",
          300: "var(--color-accent-300)",
          400: "var(--color-accent-400)",
          500: "var(--color-accent-500)",
          600: "var(--color-accent-600)",
          700: "var(--color-accent-700)",
          800: "var(--color-accent-800)",
          900: "var(--color-accent-900)",
          950: "var(--color-accent-950)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // BoardUI Semantic Tokens
        "background-primary-default": "var(--color-background-primary-default)",
        "background-primary-hover": "var(--color-background-primary-hover)",
        "background-primary-active": "var(--color-background-primary-active)",
        "background-primary-disabled": "var(--color-background-primary-disabled)",
        "background-secondary-default": "var(--color-background-secondary-default)",
        "background-secondary-hover": "var(--color-background-secondary-hover)",
        "background-inner-default": "var(--color-background-inner-default)",
        "background-tertiary-default": "var(--color-background-tertiary-default)",
        "background-tertiary-hover": "var(--color-background-tertiary-hover)",
        "background-quaternary-default": "var(--color-background-quaternary-default)",
        "background-full": "var(--color-background-full)",

        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-tertiary": "var(--color-text-tertiary)",
        "text-disabled": "var(--color-text-disabled)",
        "text-white": "var(--color-text-white)",
        "text-destructive": "var(--color-text-destructive)",
        "text-error-primary": "var(--color-text-error-primary)",

        "border-button-default": "var(--color-border-button-default)",
        "border-button-hover": "var(--color-border-button-hover)",
        "border-button-active": "var(--color-border-button-active)",
        "border-button-white": "var(--color-border-button-white)",
        "border-table": "var(--color-border-table)",
        "border-focus-ring": "var(--color-border-focus-ring)",
        "border-error-default": "var(--color-border-error-default)",
        "separator-border": "var(--color-separator-border)",
        "separator-border-strong": "var(--color-separator-border-strong)",

        "segmented-control-background": "var(--color-segmented-control-background)",
        "segmented-control-selected-background": "var(--color-segmented-control-selected-background)",

        "status-lime-background": "var(--color-status-lime-background)",
        "status-lime-text": "var(--color-status-lime-text)",
        "status-yellow-background": "var(--color-status-yellow-background)",
        "status-yellow-text": "var(--color-status-yellow-text)",
        "status-rose-background": "var(--color-status-rose-background)",
        "status-rose-text": "var(--color-status-rose-text)",
        "status-cyan-background": "var(--color-status-cyan-background)",
        "status-cyan-text": "var(--color-status-cyan-text)",
        "status-orange-background": "var(--color-status-orange-background)",
        "status-orange-text": "var(--color-status-orange-text)",
        "status-blue-background": "var(--color-status-blue-background)",
        "status-blue-text": "var(--color-status-blue-text)",
        "status-purple-background": "var(--color-status-purple-background)",
        "status-purple-text": "var(--color-status-purple-text)",

        "badge-neutral-background": "var(--color-badge-neutral-background)",
        "badge-new-background": "var(--color-badge-new-background)",
        "badge-new-text": "var(--color-badge-new-text)",

        "avatar-neutral-background": "var(--color-avatar-neutral-background)",
        "kbd-background": "var(--color-kbd-background)",
        "kbd-foreground": "var(--color-kbd-foreground)",

        "foreground-icon-primary": "var(--color-foreground-icon-primary)",
        "foreground-icon-secondary": "var(--color-foreground-icon-secondary)",
        "foreground-icon-tertiary": "var(--color-foreground-icon-tertiary)",
        "foreground-icon-quaternary": "var(--color-foreground-icon-quaternary)",
        "foreground-icon-error": "var(--color-foreground-icon-error)",
        "foreground-disabled-danger": "var(--color-foreground-disabled-danger)",

        "button-ghost-background": "var(--color-button-ghost-background)",
        "button-ghost-hover": "var(--color-button-ghost-hover)",
        "button-ghost-active": "var(--color-button-ghost-active)",
        "button-ghost-disabled": "var(--color-button-ghost-disabled)",
        "button-ghost-foreground": "var(--color-button-ghost-foreground)",
        "button-ghost-disabled-foreground": "var(--color-button-ghost-disabled-foreground)",
        "button-primary-disabled-foreground": "var(--color-button-primary-disabled-foreground)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2lg": "var(--radius-2lg, 10px)",
        "2-5xl": "var(--radius-2-5xl, 20px)",
        "notification-card": "var(--radius-notification-card, 10px)",
      },
      boxShadow: {
        "2xs": "var(--shadow-2xs)",
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        card: "var(--shadow-card)",
        dropdown: "var(--shadow-dropdown)",
        sidebar: "var(--shadow-sidebar)",
        "nav-selected": "var(--shadow-nav-selected)",
        waitlist: "var(--shadow-waitlist)",
      },
      minHeight: {
        touch: "48px",
      },
      minWidth: {
        touch: "48px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
