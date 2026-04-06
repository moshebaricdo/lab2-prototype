import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    outDir: "build",
  },
  /** Pre-bundle core deps so cold start / HMR invalidation is cheaper. */
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react-router",
      "react-router-dom",
    ],
  },
  server: {
    port: 3000,
    open: true,
    /** Avoid watching huge trees; reduces watcher churn on macOS. */
    watch: {
      ignored: ["**/node_modules/**", "**/build/**", "**/.git/**"],
    },
  },
});
