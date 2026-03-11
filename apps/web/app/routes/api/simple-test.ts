import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/simple-test")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(JSON.stringify({ 
          status: "ok", 
          message: "Simple test works!",
          env: {
            hasDbUrl: !!process.env.DATABASE_URL,
            nodeEnv: process.env.NODE_ENV,
          }
        }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
