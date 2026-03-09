// ============================================================
// MaatWork CRM — Google Calendar Event API Route (by ID)
// ============================================================

import { auth } from "@server/auth";
import {
  deleteGoogleCalendarEvent,
  getGoogleCalendarEvent,
  updateGoogleCalendarEvent,
} from "@server/functions/google/calendar";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/google/calendar/events/$eventId")({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { eventId: string } }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const event = await getGoogleCalendarEvent(session.user.id, params.eventId);
          if (!event) {
            return new Response(JSON.stringify({ error: "Event not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }
          return new Response(JSON.stringify(event), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Failed to fetch event" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
      PATCH: async ({ request, params }: { request: Request; params: { eventId: string } }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const body = await request.json();
          const event = await updateGoogleCalendarEvent(session.user.id, params.eventId, body);
          return new Response(JSON.stringify(event), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Failed to update event" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
      DELETE: async ({ request, params }: { request: Request; params: { eventId: string } }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          await deleteGoogleCalendarEvent(session.user.id, params.eventId);
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Failed to delete event" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
