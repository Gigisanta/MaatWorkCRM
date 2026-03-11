// ============================================================
// Better-Auth OAuth Callback Route
// ============================================================

import { auth } from "@server/auth";
import { createFileRoute } from "@tanstack/react-router";
import { logAuth, logError } from "~/lib/logger";

export const Route = createFileRoute("/api/auth/callback/google/")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          logAuth("google-callback", { url: request.url });
          return await auth.handler(request);
        } catch (error) {
          logError(error, "google-callback");
          return new Response(JSON.stringify({ error: String(error) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
