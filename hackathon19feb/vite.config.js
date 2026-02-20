import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const AG_UI_THEME = {
  foreground: "#e5e7eb",
  background: "#020617",
  card: "#0b1224",
  primary: "#7c3aed",
  accent: "#22d3ee",
  border: "#1f2937",
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  define: {
    __AG_UI_THEME__: JSON.stringify(AG_UI_THEME),
  },
  server: {
    host: true,
    port: 5173,
  },
});
