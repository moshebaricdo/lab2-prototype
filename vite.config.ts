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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("/node_modules/")) return undefined;

          if (
            id.includes("/@codemirror/") ||
            id.includes("/@lezer/")
          ) {
            return "vendor-codemirror";
          }

          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/react-router/") ||
            id.includes("/react-router-dom/") ||
            id.includes("/scheduler/")
          ) {
            return "vendor-react";
          }

          if (id.includes("/@fortawesome/")) {
            return "vendor-fontawesome";
          }

          if (
            id.includes("/react-dnd/") ||
            id.includes("/react-dnd-html5-backend/") ||
            id.includes("/dnd-core/") ||
            id.includes("/@react-dnd/")
          ) {
            return "vendor-dnd";
          }

          if (
            id.includes("/react-markdown/") ||
            id.includes("/remark-") ||
            id.includes("/unified/") ||
            id.includes("/micromark") ||
            id.includes("/mdast") ||
            id.includes("/hast") ||
            id.includes("/unist") ||
            id.includes("/vfile")
          ) {
            return "vendor-markdown";
          }

          return undefined;
        },
      },
    },
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
