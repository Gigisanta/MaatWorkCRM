// ============================================================
// Better-Auth API Routes - All endpoints
// ============================================================

import { auth } from "@server/auth";
import { createFileRoute } from "@tanstack/react-router";
import { logError, logger, logRequest } from "~/lib/logger";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          logRequest({ method: "GET", url: url.pathname, headers: Object.fromEntries(request.headers) });
          return await auth.handler(request);
        } catch (error) {
          logError(error, "auth-get");
          return new Response(JSON.stringify({ error: String(error) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
      POST: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          logRequest({ method: "POST", url: url.pathname, headers: Object.fromEntries(request.headers) });
          return await auth.handler(request);
        } catch (error) {
          logError(error, "auth-post");
          return new Response(JSON.stringify({ error: String(error) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
