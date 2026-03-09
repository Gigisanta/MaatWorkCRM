// ============================================================
// MaatWork CRM — Google Calendar API Routes
// ============================================================

import { auth } from "@server/auth";
import {
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  getGoogleCalendarEvents,
  updateGoogleCalendarEvent,
} from "@server/functions/google/calendar";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/google/calendar/events")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const url = new URL(request.url);
        const timeMin = url.searchParams.get("timeMin") || undefined;
        const timeMax = url.searchParams.get("timeMax") || undefined;

        try {
          const events = await getGoogleCalendarEvents(session.user.id, timeMin, timeMax);
          return new Response(JSON.stringify(events), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Failed to fetch events" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
      POST: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const body = await request.json();
          const event = await createGoogleCalendarEvent(session.user.id, body);
          return new Response(JSON.stringify(event), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Failed to create event" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
