// ============================================================
// Better-Auth OAuth Callback Route
// ============================================================

import { auth } from "@server/auth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/callback/google/")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          console.log("[AUTH-CB] Google callback received");
          return await auth.handler(request);
        } catch (error) {
          console.error("[AUTH-CB] Error:", error);
          return new Response(JSON.stringify({ error: String(error) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
