import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "../../ui/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cosmic: "#7F00FF",
        neon: "#E100FF",
        background: "var(--background)",
        foreground: "var(--foreground)",
        ws: {
          black: "#000000",
          red: {
            DEFAULT: "#ff1a1a",
            dark: "#b30000",
          },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(225, 0, 255, 0.6)',
      }
    },
  },
  plugins: [],
};

export default config;
