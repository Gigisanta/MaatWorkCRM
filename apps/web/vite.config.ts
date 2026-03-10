import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Virtual module to provide stream/web exports
const streamWebVirtual = `
export const ReadableStream = globalThis.ReadableStream;
export const TransformStream = globalThis.TransformStream;
export const ByteLengthQueuingStrategy = globalThis.ByteLengthQueuingStrategy;
export const CountQueuingStrategy = globalThis.CountQueuingStrategy;
export const TextEncoderStream = globalThis.TextEncoderStream;
export const TextDecoderStream = globalThis.TextDecoderStream;
`;

const asyncHooksVirtual = `
export const AsyncLocalStorage = class AsyncLocalStorage {
  getStore() { return null; }
  run(store, callback, ...args) { return callback(...args); }
  exit(callback, ...args) { return callback(...args); }
};
`;

const streamBrowserifyVirtual = `
import * as stream from 'stream-browserify';
export default stream;
export const ReadableStream = globalThis.ReadableStream;
export const TransformStream = globalThis.TransformStream;
`;

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths(),
    nitro(),
    tanstackStart({
      srcDirectory: "app",
    }),
    viteReact({
      jsxImportSource: "react",
    }),
    {
      name: "stream-web-virtual",
      resolveId(id) {
        if (id === "stream-web" || id === "node:stream/web" || id === "stream-browserify/web") {
          return "\0stream-web-virtual";
        }
        if (id === "node:async_hooks") {
          return "\0async-hooks-virtual";
        }
        return null;
      },
      load(id) {
        if (id === "\0stream-web-virtual") {
          return streamWebVirtual;
        }
        if (id === "\0async-hooks-virtual") {
          return asyncHooksVirtual;
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
      crypto: "crypto-browserify",
      stream: "stream-browserify",
      "node:stream": "stream-browserify",
      "node:stream/web": "\0stream-web-virtual",
      "stream-browserify/web": "\0stream-web-virtual",
      "node:async_hooks": "\0async-hooks-virtual",
      util: "util",
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@tanstack/react-router",
      "@tanstack/react-query",
      "crypto-browserify",
      "stream-browserify",
      "buffer",
      "util",
    ],
  },
  ssr: {
    external: ["pg", "@neondatabase/serverless", "node:stream", "node:stream/web"],
  },
});
