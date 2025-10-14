/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand colors
        "brand-primary": "#818CF8",
        "brand-secondary": "#FCA5A5",
        "brand-accent": "#DDD6FE",

        // Shorthand aliases for common use
        "primary": "#818CF8",
        "accent-lavender": "#DDD6FE",

        // Button colors
        "button-primary": "#FCA5A5",
        "button-primary-hover": "#F87171",
        "button-secondary": "#FFFFFF",
        "button-secondary-hover": "#F5F5F4",
        "button-success": "#86EFAC",
        "button-success-hover": "#6EE7B7",

        // Text colors
        "text-primary": "#1E293B",
        "text-secondary": "#64748B",
        "text-tertiary": "#9CA3AF",
        "text-link": "#3B82F6",
        "text-link-hover": "#2563EB",

        // Surface/Background colors
        "surface-primary": "#FFFFFF",
        "surface-secondary": "#FAFAF9",
        "surface-tertiary": "#F5F5F4",
        "surface-hover": "#F5F5F4",
        "surface-active": "rgba(129, 140, 248, 0.2)",

        // Navigation colors
        "nav-text": "#374151",
        "nav-text-hover": "#111827",
        "nav-text-active": "#818CF8",
        "nav-bg-active": "rgba(129, 140, 248, 0.2)",
        "nav-bg-hover": "#F3F4F6",

        // Status colors
        "status-success": "#86EFAC",
        "status-success-bg": "#DCFCE7",
        "status-success-text": "#166534",
        "status-warning": "#FDE047",
        "status-warning-bg": "#FEF3C7",
        "status-warning-text": "#854D0E",
        "status-error": "#EF4444",
        "status-error-bg": "#FEE2E2",
        "status-error-border": "#F87171",
        "status-error-text": "#B91C1C",
        "status-info": "#818CF8",
        "status-info-bg": "rgba(129, 140, 248, 0.1)",

        // Border colors
        "border-default": "#E7E5E4",
        "border-light": "#E5E7EB",
        "border-medium": "#D1D5DB",
        "border-focus": "#3B82F6",
        "border-error": "#F87171",
        "border-active": "#818CF8",

        // Special purpose
        "overlay-light": "rgba(255, 255, 255, 0.1)",
        "gradient-from": "#FCA5A5",
        "gradient-to": "#818CF8",

        // Accent colors for specific UI elements
        "accent-info-bg": "rgba(221, 214, 254, 0.2)",
        "accent-success-bg": "rgba(134, 239, 172, 0.2)",
        "accent-warning-bg": "rgba(252, 165, 165, 0.2)",
      },
      fontFamily: {
        "display": ["Lexend", "sans-serif"],
        "sans": ["Lexend", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
    },
  },
  plugins: [],
}