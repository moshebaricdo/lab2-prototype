import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const crossOriginIsolationHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "credentialless",
};

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
  worker: {
    format: "es",
  },
  /**
   * Pre-bundle core deps so cold start / HMR invalidation is cheaper.
   * Exclude CADS: esbuild drops `import './foo.css'` from the published dist.
   * Because CADS is excluded, Vite will not discover its CJS transitives —
   * include those (and the MUI subpaths CADS deep-imports) so ESM default
   * imports like `import PropTypes from 'prop-types'` get an interop wrapper.
   */
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react-router",
      "react-router-dom",
      "@emotion/react",
      "@emotion/styled",
      "prop-types",
      "react-is",
      "hoist-non-react-statics",
      "react-transition-group",
      "@mui/material",
      "@mui/material/Box",
      "@mui/material/Button",
      "@mui/material/ButtonBase",
      "@mui/material/Checkbox",
      "@mui/material/ClickAwayListener",
      "@mui/material/CssBaseline",
      "@mui/material/Dialog",
      "@mui/material/Drawer",
      "@mui/material/FormControlLabel",
      "@mui/material/IconButton",
      "@mui/material/Pagination",
      "@mui/material/Paper",
      "@mui/material/Popper",
      "@mui/material/Radio",
      "@mui/material/Slider",
      "@mui/material/Snackbar",
      "@mui/material/Tooltip",
      "@mui/material/styles",
    ],
    exclude: [
      "@moshebaricdo/cads-react",
      "@moshebaricdo/cads-variables",
    ],
  },
  server: {
    port: 3000,
    open: true,
    headers: crossOriginIsolationHeaders,
    /** Avoid watching huge trees; reduces watcher churn on macOS. */
    watch: {
      ignored: ["**/node_modules/**", "**/build/**", "**/.git/**"],
    },
  },
  preview: {
    headers: crossOriginIsolationHeaders,
  },
});
