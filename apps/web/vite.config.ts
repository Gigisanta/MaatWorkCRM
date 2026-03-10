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
export const Readable = class {
  constructor() {}
};
export * from 'stream-browserify';
`;

// Plugin to handle TanStack Router dependencies that don't exist
const fixTanstackDeps = () => ({
  name: 'fix-tanstack-deps',
  enforce: 'pre',
  config() {
    return {
      resolve: {
        alias: {
          'stream-browserify/web': 'stream-browserify',
          'node:stream': 'stream-browserify',
          'node:stream/web': 'stream-browserify',
          'node:async_hooks': '\0async-hooks-virtual',
          'async_hooks': '\0async-hooks-virtual',
        },
      },
    };
  },
  resolveId(id) {
    if (id === '\0async-hooks-virtual') {
      return id;
    }
    return null;
  },
  load(id) {
    if (id === '\0async-hooks-virtual') {
      return asyncHooksVirtual;
    }
    if (id === '\0stream-node-virtual') {
      return streamNodeVirtual;
    }
    if (id === '\0stream-browserify-web') {
      return streamBrowserifyWebVirtual;
    }
    return null;
  },
});

export default defineConfig({
  plugins: [
    fixTanstackDeps(),
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
  ],
  define: {
    global: "globalThis",
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
