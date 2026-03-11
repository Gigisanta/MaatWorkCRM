// ============================================================
// MaatWork CRM — Better-Auth API Routes
// ============================================================

import { auth } from "@server/auth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/betterauth/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          console.log("[AUTH] GET:", url.pathname, url.search);
          return await auth.handler(request);
        } catch (error) {
          console.error("Auth API GET error:", error);
          return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
      POST: async ({ request }: { request: Request }) => {
        try {
          console.log("[AUTH] POST:", request.url);
          return await auth.handler(request);
        } catch (error) {
          console.error("Auth API POST error:", error);
          return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
