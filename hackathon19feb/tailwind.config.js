/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#020617",
        foreground: "#e5e7eb",
        card: "#0b1224",
        primary: "#7c3aed",
        accent: "#22d3ee",
        border: "#1f2937",
      },
      fontFamily: {
        display: ["'Inter'", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        glow: "0 10px 40px -10px rgba(124, 58, 237, 0.35)",
      },
    },
  },
  plugins: [],
};
