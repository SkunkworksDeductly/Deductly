/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Instrument Serif", "serif"],
      },
      colors: {
        bg: {
          primary: "#0a0a0f",
          secondary: "#12121a",
          tertiary: "#1a1a24",
        },
        brand: {
          primary: "#6366f1",
          secondary: "#8b5cf6",
          tertiary: "#a78bfa",
        },
        // Light-mode landing page text colors
        text: {
          primary: "#111827",
          secondary: "#4B5563",
          tertiary: "#9CA3AF",
        },
        // Button colors for landing page
        button: {
          primary: "#F87171",
          "primary-hover": "#EF4444",
        },
        success: "#22c55e",
        warning: "#eab308",
        danger: "#ef4444",
        border: {
          subtle: "rgba(255, 255, 255, 0.06)",
          DEFAULT: "rgba(255, 255, 255, 0.08)",
          default: "#E5E7EB",
          hover: "rgba(255, 255, 255, 0.15)",
          active: "rgba(99, 102, 241, 0.3)",
        }
      },
      textColor: {
        primary: "#ffffff",
        secondary: "rgba(255, 255, 255, 0.7)",
        tertiary: "rgba(255, 255, 255, 0.5)",
        muted: "rgba(255, 255, 255, 0.4)",
        faint: "rgba(255, 255, 255, 0.3)",
      },
      backgroundImage: {
        'card-gradient': "linear-gradient(165deg, rgba(30, 30, 40, 0.9) 0%, rgba(20, 20, 28, 0.95) 100%)",
        'ambient-purple': "radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.07) 0%, transparent 40%)",
        'ambient-pink': "radial-gradient(circle at 80% 60%, rgba(236, 72, 153, 0.05) 0%, transparent 40%)",
        'ambient-green': "radial-gradient(circle at 40% 80%, rgba(34, 197, 94, 0.04) 0%, transparent 30%)",
      },
      boxShadow: {
        'sm': "0 2px 8px rgba(0, 0, 0, 0.2)",
        'md': "0 8px 24px rgba(0, 0, 0, 0.3)",
        'lg': "0 15px 40px rgba(0, 0, 0, 0.4)",
        'xl': "0 25px 80px rgba(0, 0, 0, 0.5)",
        'glow-primary': "0 0 40px rgba(99, 102, 241, 0.4), 0 4px 20px rgba(99, 102, 241, 0.3)",
        'glow-success': "0 0 40px rgba(34, 197, 94, 0.4)",
        'glow-danger': "0 0 40px rgba(239, 68, 68, 0.4)",
        'card': "0 25px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.03) inset",
      },
      animation: {
        'card-enter': 'cardEnter 0.5s ease-out',
        'slide-in': 'slideIn 0.4s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        cardEnter: {
          'from': { opacity: '0', transform: 'translateY(20px) scale(0.98)' },
          'to': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slideIn: {
          'from': { opacity: '0', transform: 'translateX(-10px)' },
          'to': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(2deg)' },
          '50%': { transform: 'translateY(-15px) rotate(0deg)' },
        }
      }
    },
  },
  plugins: [],
}
