import { defineConfig } from "@tanstack/react-start/config";

export default defineConfig({
  server: {
    preset: "vercel",
    output: {
      dir: ".output",
      publicDir: "public",
    },
  },
});
