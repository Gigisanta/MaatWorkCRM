// ============================================================
// Better-Auth OAuth Callback Route
// ============================================================

import { auth } from "@server/auth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/callback/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          console.log("[AUTH-CALLBACK] GET received:", url.pathname, url.search);
          const response = await auth.handler(request);
          console.log("[AUTH-CALLBACK] Response status:", response.status);
          return response;
        } catch (error) {
          console.error("[AUTH-CALLBACK] Error:", error);
          return new Response(JSON.stringify({ error: "Callback error", details: String(error) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
