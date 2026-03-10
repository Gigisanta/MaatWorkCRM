import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

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
  ],
  define: {
    global: "globalThis",
    "process.env": {},
  },
  resolve: {
    alias: {
      "~": "/app",
      crypto: "crypto-browserify",
      stream: "stream-browserify",
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
});
