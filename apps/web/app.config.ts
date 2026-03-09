import { defineConfig } from "@tanstack/react-start/config";

export default defineConfig({
  server: {
    preset: "node-server",
    output: {
      dir: ".output",
      publicDir: "public",
    },
  },
});
