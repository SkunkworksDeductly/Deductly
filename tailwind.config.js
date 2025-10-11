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
        "primary": "#7317cf",
        "background-light": "#f7f6f8",
        "background-dark": "#1a1122",
        "matte-purple": "#5C3C58",
        "matte-red": "#9D3C40",
        "dark-gray": "#2D2D2D",
        "light-gray": "#F5F5F5",
        "success-green": "#0bda73",
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