import path from "node:path";
/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["server/**/*.ts", "app/lib/**/*.ts"],
      exclude: ["**/*.gen.*", "**/*.d.ts"],
    },
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./app"),
      "@server": path.resolve(__dirname, "./server"),
    },
  },
});
