import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "path";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths(),
    nodePolyfills({
      include: [
        'stream',
        'stream-browserify',
        'buffer', 
        'util', 
        'crypto',
      ],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
    tanstackStart({
      srcDirectory: "app",
    }),
    viteReact({
      jsxImportSource: "react",
    }),
  ],
  resolve: {
    alias: {
      "~": "/app",
      // Redirect node:async_hooks to our browser shim
      "node:async_hooks": path.resolve(__dirname, "app/lib/polyfills/async-hooks.ts"),
      "async_hooks": path.resolve(__dirname, "app/lib/polyfills/async-hooks.ts"),
    },
  },
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@tanstack/react-router",
      "@tanstack/react-query",
      "stream-browserify",
    ],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  ssr: {
    noExternal: [
      "@tanstack/react-router",
      "@tanstack/router-core",
      "@tanstack/start-server-core",
      "@tanstack/start-storage-context",
    ],
    external: [
      "pg",
      "@neondatabase/serverless",
    ],
  },
});
