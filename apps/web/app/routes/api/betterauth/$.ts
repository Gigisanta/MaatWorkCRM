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
          // Pass request directly to auth.handler - no URL rewriting needed
          // better-auth handles path matching internally based on its basePath config
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
          // Pass request directly to auth.handler - no URL rewriting needed
          // better-auth handles path matching internally based on its basePath config
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
