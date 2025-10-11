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
        "primary": "#818CF8",
        "background-light": "#FAFAF9",
        "background-dark": "#F5F5F4",
        "accent-peach": "#FCA5A5",
        "accent-mint": "#86EFAC",
        "accent-lavender": "#DDD6FE",
        "text-primary": "#1E293B",
        "text-secondary": "#64748B",
        "border-light": "#E7E5E4",
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