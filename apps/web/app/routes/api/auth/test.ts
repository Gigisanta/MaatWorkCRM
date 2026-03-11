// ============================================================
// Test endpoint
// ============================================================

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/test")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(JSON.stringify({ message: "test endpoint works", path: "/api/auth/test" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
