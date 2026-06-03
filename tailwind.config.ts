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
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        hexa: {
          pink: "#E91E8C",
          purple: "#9C27B0",
          blue: "#1565C0",
          "blue-dark": "#0D47A1",
        },
      },
      backgroundImage: {
        "hexa-gradient": "linear-gradient(135deg, #E91E8C 0%, #9C27B0 50%, #1565C0 100%)",
      },
      boxShadow: {
        "3d": "0 20px 60px -10px rgba(0,0,0,0.15), 0 4px 15px -3px rgba(0,0,0,0.08)",
        "3d-hover": "0 30px 80px -10px rgba(0,0,0,0.2), 0 8px 25px -5px rgba(0,0,0,0.12)",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.1)",
        "glass-hover": "0 12px 40px 0 rgba(31, 38, 135, 0.18)",
        inner: "inset 0 2px 4px 0 rgba(0,0,0,0.05)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
