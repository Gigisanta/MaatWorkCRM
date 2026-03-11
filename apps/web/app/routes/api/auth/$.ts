// ============================================================
// MaatWork CRM — Better-Auth API Routes
// ============================================================

import { auth } from "@server/auth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          console.log("[AUTH-DEBUG] GET received:", url.pathname, url.search);
          console.log("[AUTH-DEBUG] Method:", request.method);
          console.log("[AUTH-DEBUG] Headers:", Object.fromEntries(request.headers.entries()));
          const response = await auth.handler(request);
          console.log("[AUTH-DEBUG] GET response status:", response.status);
          return response;
        } catch (error) {
          console.error("Auth API GET error:", error);
          return new Response(JSON.stringify({ error: "Internal server error", details: String(error) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
      POST: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          console.log("[AUTH-DEBUG] POST received:", url.pathname);
          const contentType = request.headers.get("content-type");
          let body = "";
          if (contentType?.includes("application/json")) {
            const jsonBody = await request.json();
            body = JSON.stringify(jsonBody);
          }
          console.log("[AUTH-DEBUG] Body:", body);
          const response = await auth.handler(request);
          console.log("[AUTH-DEBUG] POST response status:", response.status);
          return response;
        } catch (error) {
          console.error("Auth API POST error:", error);
          return new Response(JSON.stringify({ error: "Internal server error", details: String(error) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
