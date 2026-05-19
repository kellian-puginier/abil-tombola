import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        abil: {
          green: "#0E7C3A",
          "green-dark": "#075226",
          "green-light": "#10B981",
          gold: "#F5B301",
          ink: "#0B1B14"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"]
      },
      keyframes: {
        sparkle: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" }
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(245,179,1,0.6)" },
          "50%": { boxShadow: "0 0 24px 6px rgba(245,179,1,0.45)" }
        },
        slotSpin: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-100%)" }
        },
        confetti: {
          "0%": { transform: "translateY(-100vh) rotate(0)", opacity: "1" },
          "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: "0" }
        }
      },
      animation: {
        sparkle: "sparkle 2.4s ease-in-out infinite",
        glow: "glow 1.8s ease-in-out infinite",
        confetti: "confetti 3.5s linear forwards"
      }
    }
  },
  plugins: []
};

export default config;
