import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    ...(process.env.NODE_ENV !== "production" ? [runtimeErrorOverlay()] : []),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240,
      deleteOriginFile: false,
    }),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        // Only the libraries every page needs get a shared chunk. Everything else is left to
        // split with whichever page imports it, so the home page never downloads the charting,
        // diagram or 3D libraries that only the market terminal and admin pages use.
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(react|react-dom|scheduler|wouter|@tanstack|@radix-ui|@floating-ui)\//.test(id)) {
            return 'vendor';
          }
          if (id.includes('framer-motion')) return 'vendor-framer';
          if (id.includes('react-icons')) return 'vendor-icons';
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    cssMinify: true,
    cssCodeSplit: true,
  },
  server: {
    fs: {
      strict: false,
      allow: [".."],
    },
  },
});
