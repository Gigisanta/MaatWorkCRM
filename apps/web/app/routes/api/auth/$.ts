// ============================================================
// Better-Auth API Routes - All endpoints
// ============================================================

import { auth } from "@server/auth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          console.log("[AUTH] GET:", url.pathname);
          return await auth.handler(request);
        } catch (error) {
          console.error("[AUTH] GET Error:", error);
          return new Response(JSON.stringify({ error: String(error) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
      POST: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          console.log("[AUTH] POST:", url.pathname);
          return await auth.handler(request);
        } catch (error) {
          console.error("[AUTH] POST Error:", error);
          return new Response(JSON.stringify({ error: String(error) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
