import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "path";

// Virtual module to fix stream-browserify/web import
const streamBrowserifyWebVirtual = `
export * from 'stream-browserify';
`;

function fixStreamBrowserifyWeb() {
  return {
    name: 'fix-stream-browserify-web',
    resolveId(id: string) {
      if (id === 'stream-browserify/web') {
        return '\0stream-browserify-web';
      }
      return null;
    },
    load(id: string) {
      if (id === '\0stream-browserify-web') {
        return streamBrowserifyWebVirtual;
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths(),
    fixStreamBrowserifyWeb(),
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
      "node:async_hooks": path.resolve(__dirname, "app/lib/polyfills/async-hooks.ts"),
      "async_hooks": path.resolve(__dirname, "app/lib/polyfills/async-hooks.ts"),
      "stream-browserify/web": "stream-browserify",
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
