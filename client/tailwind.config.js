/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Baloo 2"', "system-ui", "sans-serif"],
        body: ['"Manrope"', "system-ui", "sans-serif"],
      },
      colors: {
        felt: {
          50: "#123328",
          DEFAULT: "#0b1f1a",
          900: "#050a08",
        },
        uno: {
          red: "#ff2d55",
          yellow: "#ffd60a",
          green: "#22e07a",
          blue: "#2f7dff",
        },
      },
      boxShadow: {
        "glow-red": "0 0 12px 2px rgba(255,45,85,0.7), 0 0 32px 6px rgba(255,45,85,0.35)",
        "glow-yellow": "0 0 12px 2px rgba(255,214,10,0.7), 0 0 32px 6px rgba(255,214,10,0.35)",
        "glow-green": "0 0 12px 2px rgba(34,224,122,0.7), 0 0 32px 6px rgba(34,224,122,0.35)",
        "glow-blue": "0 0 12px 2px rgba(47,125,255,0.7), 0 0 32px 6px rgba(47,125,255,0.35)",
        "glow-wild": "0 0 18px 3px rgba(255,255,255,0.55), 0 0 40px 10px rgba(180,90,255,0.35)",
      },
      keyframes: {
        "pulse-ring": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255,214,10,0.55)" },
          "50%": { boxShadow: "0 0 0 8px rgba(255,214,10,0)" },
        },
        breathe: {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-3px) scale(1.02)" },
        },
        float1: {
          "0%, 100%": { transform: "translate(0,0)" },
          "50%": { transform: "translate(12px,-18px)" },
        },
        float2: {
          "0%, 100%": { transform: "translate(0,0)" },
          "50%": { transform: "translate(-16px,-10px)" },
        },
        float3: {
          "0%, 100%": { transform: "translate(0,0)" },
          "50%": { transform: "translate(8px,14px)" },
        },
        holo: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        shake: {
          "0%, 100%": { transform: "translate(0,0)" },
          "20%": { transform: "translate(-6px,2px)" },
          "40%": { transform: "translate(6px,-2px)" },
          "60%": { transform: "translate(-4px,2px)" },
          "80%": { transform: "translate(4px,-2px)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 1.6s ease-in-out infinite",
        breathe: "breathe 3.2s ease-in-out infinite",
        float1: "float1 7s ease-in-out infinite",
        float2: "float2 9s ease-in-out infinite",
        float3: "float3 8s ease-in-out infinite",
        holo: "holo 3s linear infinite",
        shake: "shake 0.4s ease-in-out",
      },
    },
  },
  plugins: [],
};
