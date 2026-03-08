// ============================================================
// MaatWork CRM — Test Wildcard Route
// ============================================================

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/test-wildcard/$")({
  server: {
    handlers: {
      GET: async ({ params }: { params: { _splat: string } }) => {
        return new Response(`Wildcard test works! Path: ${params._splat}`, {
          headers: { "Content-Type": "text/plain" },
        });
      },
    },
  },
});
