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
        "primary": "#81B29A",
        "terracotta": "#E07A5F",
        "terracotta-soft": "#F8EBE8",
        "sand": "#F0EFE9",
        "sand-dark": "#DDDBCF",
        "sage": "#81B29A",
        "sage-light": "#CFE0D9",
        "sage-soft": "#EBF5F1",
        "text-main": "#252822",
        "background-light": "#FDFCF9",
        "background-dark": "#23261F",
      },
      fontFamily: {
        "sans": ["Schibsted Grotesk", "sans-serif"],
        "slab": ["Zilla Slab", "serif"],
        "display": ["Schibsted Grotesk", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "0.75rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "2xl": "2rem",
        "3xl": "3rem",
        "full": "9999px"
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'soft-xl': '0 20px 40px -4px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
