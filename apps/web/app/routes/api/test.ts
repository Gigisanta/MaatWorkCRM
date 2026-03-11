// ============================================================
// MaatWork CRM — Test Route
// ============================================================

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/test")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return new Response("Test endpoint works!", {
            headers: { "Content-Type": "text/plain" },
          });
        } catch (error) {
          return new Response(`Error: ${error}`, {
            status: 500,
            headers: { "Content-Type": "text/plain" },
          });
        }
      },
    },
  },
});
