import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
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
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Keep Three.js separate (used by dead-code components, tree-shaken but just in case)
            if (id.includes('three') || id.includes('@react-three')) {
              return 'vendor-three';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer';
            }
            if (id.includes('react-icons')) {
              return 'vendor-icons';
            }
            // Let heavy libs used only by lazy routes split naturally with their consumers
            if (
              id.includes('recharts') || id.includes('d3-') ||
              id.includes('canvas-confetti') || id.includes('victory') ||
              id.includes('@xyflow') || id.includes('reactflow') ||
              id.includes('elkjs') || id.includes('dagre')
            ) {
              return undefined;
            }
            return 'vendor';
          }
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
