// ============================================================
// MaatWork CRM — Test Route
// ============================================================

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/test")({
  server: {
    handlers: {
      GET: async () => {
        return new Response("Test endpoint works!", {
          headers: { "Content-Type": "text/plain" },
        });
      },
    },
  },
});
