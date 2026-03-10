import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// Virtual module to provide AsyncLocalStorage
const asyncHooksVirtual = `
export class AsyncLocalStorage {
  constructor() {
    this._store = null;
  }
  getStore() { 
    return this._store;
  }
  run(store, callback, ...args) { 
    const prevStore = this._store;
    this._store = store;
    try {
      return callback(...args);
    } finally {
      this._store = prevStore;
    }
  }
  exit(callback, ...args) { 
    return callback(...args);
  }
}
`;

// Virtual module for stream-browserify/web
const streamBrowserifyWebVirtual = `
export * from 'stream-browserify';
`;

// Virtual module for node:stream with Readable export
const streamNodeVirtual = `
export { Readable } from 'stream-browserify';
`;

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths(),
    nodePolyfills({
      include: ['crypto', 'stream', 'buffer', 'util'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
    nitro(),
    tanstackStart({
      srcDirectory: "app",
    }),
    viteReact({
      jsxImportSource: "react",
    }),
    // Plugin to handle stream-browserify/web and node:async_hooks
    {
      name: 'fix-tanstack-deps',
      resolveId(id) {
        if (id === 'stream-browserify/web') {
          return '\0stream-browserify-web';
        }
        if (id === 'node:async_hooks' || id === 'async_hooks') {
          return '\0async-hooks-virtual';
        }
        if (id === 'node:stream') {
          return '\0stream-node-virtual';
        }
        return null;
      },
      load(id) {
        if (id === '\0stream-browserify-web') {
          return streamBrowserifyWebVirtual;
        }
        if (id === '\0async-hooks-virtual') {
          return asyncHooksVirtual;
        }
        if (id === '\0stream-node-virtual') {
          return streamNodeVirtual;
        }
        return null;
      },
    },
  ],
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      "~": "/app",
      "stream-browserify/web": "\0stream-browserify-web",
      "node:async_hooks": "\0async-hooks-virtual",
      "async_hooks": "\0async-hooks-virtual",
      "node:stream": "\0stream-node-virtual",
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@tanstack/react-router",
      "@tanstack/react-query",
    ],
  },
  ssr: {
    noExternal: ["crypto-browserify"],
    external: ["pg", "@neondatabase/serverless"],
  },
});
