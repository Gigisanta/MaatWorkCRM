// ============================================================
// MaatWork CRM — Better-Auth API Routes
// UI/UX REFINED BY JULES v2
// ============================================================

import { auth } from "@server/auth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth-api/$")({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { _splat: string } }) => {
        try {
          // Reconstruct the original path for better-auth
          const basePath = "/api/auth";
          const originalPath = params._splat ? `${basePath}/${params._splat}` : basePath;
          
          // Create a new request with the correct path
          const url = new URL(request.url);
          const newUrl = `${url.origin}${originalPath}${url.search}`;
          
          const newRequest = new Request(newUrl, {
            method: "GET",
            headers: request.headers,
          });
          
          return await auth.handler(newRequest);
        } catch (error) {
          console.error("Auth API GET error:", error);
          return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
      POST: async ({ request, params }: { request: Request; params: { _splat: string } }) => {
        try {
          // Reconstruct the original path for better-auth
          const basePath = "/api/auth";
          const originalPath = params._splat ? `${basePath}/${params._splat}` : basePath;
          
          // Create a new request with the correct path
          const url = new URL(request.url);
          const newUrl = `${url.origin}${originalPath}${url.search}`;
          
          const newRequest = new Request(newUrl, {
            method: "POST",
            headers: request.headers,
            body: request.body,
          });
          
          return await auth.handler(newRequest);
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
