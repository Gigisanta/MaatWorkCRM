import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

const polyfillsDir = path.resolve(__dirname, "app/lib/polyfills");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      tailwindcss(),
      tsConfigPaths(),
      tanstackStart({
        srcDirectory: "app",
      }),
      {
        name: "force-polyfills",
        resolveId(id) {
          const polyfills = {
            "stream-browserify": `${polyfillsDir}/stream.js`,
            stream: `${polyfillsDir}/stream.js`,
            "crypto-browserify": `${polyfillsDir}/crypto-browserify.js`,
            crypto: `${polyfillsDir}/crypto-browserify.js`,
            "readable-stream": `${polyfillsDir}/stream.js`,
            "readable-stream/readable": `${polyfillsDir}/stream.js`,
          };
          if (polyfills[id]) {
            return { id: polyfills[id], external: false };
          }
        },
      },
      nitro({
        preset: "vercel",
      }),
      viteReact({
        jsxImportSource: "react",
      }),
    ],
    resolve: {
      alias: {
        "~": "/app",
        "node:async_hooks": `${polyfillsDir}/async-hooks.ts`,
        async_hooks: `${polyfillsDir}/async-hooks.ts`,
        "stream-browserify": `${polyfillsDir}/stream.js`,
        stream: `${polyfillsDir}/stream.js`,
        "crypto-browserify": `${polyfillsDir}/crypto-browserify.js`,
        crypto: `${polyfillsDir}/crypto-browserify.js`,
        "readable-stream": `${polyfillsDir}/stream.js`,
      },
    },
    define: {
      global: "globalThis",
      "process.env": {},
      Buffer: "globalThis.Buffer",
    },
    optimizeDeps: {
      include: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
      exclude: ["stream-browserify", "stream", "buffer", "crypto", "crypto-browserify", "readable-stream"],
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
      external: ["pg", "@neondatabase/serverless", "better-auth", "drizzle-orm", "drizzle-kit"],
    },
    build: {
      rollupOptions: {
        external: [/^node:/, "pg", "@neondatabase/serverless", "better-auth", "drizzle-orm", "drizzle-kit"],
      },
    },
  };
});
