import { createServerFn } from "@tanstack/react-start";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "../db";
import { calendarEvents, teams } from "../db/schema/collaboration";

export const getCalendarEvents = createServerFn({ method: "GET" })
  .inputValidator((input: { orgId: string; teamId?: string; startDate?: string; endDate?: string }) => input)
  .handler(async ({ data }) => {
    const conditions = [eq(calendarEvents.organizationId, data.orgId)];

    if (data.teamId) {
      conditions.push(eq(calendarEvents.teamId, data.teamId));
    }

    if (data.startDate) {
      conditions.push(gte(calendarEvents.startAt, new Date(data.startDate)));
    }

    if (data.endDate) {
      conditions.push(lte(calendarEvents.endAt, new Date(data.endDate)));
    }

    return db
      .select()
      .from(calendarEvents)
      .where(and(...conditions))
      .orderBy(asc(calendarEvents.startAt));
  });

export const getTeamCalendarId = createServerFn({ method: "GET" })
  .inputValidator((input: { teamId: string }) => input)
  .handler(async ({ data }) => {
    const team = await db
      .select()
      .from(teams)
      .where(eq(teams.id, data.teamId))
      .then((r) => r[0]);
    return team?.calendarId || null;
  });

export const setTeamCalendarId = createServerFn({ method: "POST" })
  .inputValidator((input: { teamId: string; calendarId: string }) => input)
  .handler(async ({ data }) => {
    await db.update(teams).set({ calendarId: data.calendarId, updatedAt: new Date() }).where(eq(teams.id, data.teamId));
    return { success: true };
  });

export const createCalendarEvent = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      orgId: string;
      teamId?: string;
      data: {
        title: string;
        description?: string;
        startAt: string;
        endAt: string;
        location?: string;
        type?: "meeting" | "call" | "event" | "reminder";
      };
    }) => input,
  )
  .handler(async ({ data }) => {
    const id = crypto.randomUUID();
    await db.insert(calendarEvents).values({
      id,
      organizationId: data.orgId,
      teamId: data.teamId || null,
      title: data.data.title,
      description: data.data.description || null,
      startAt: new Date(data.data.startAt),
      endAt: new Date(data.data.endAt),
      location: data.data.location || null,
      type: data.data.type || "meeting",
      createdBy: data.orgId,
    });
    return { id };
  });

export const updateCalendarEvent = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      id: string;
      data: {
        title?: string;
        description?: string;
        startAt?: string;
        endAt?: string;
        location?: string;
        type?: string;
      };
    }) => input,
  )
  .handler(async ({ data }) => {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.data.title) updateData.title = data.data.title;
    if (data.data.description !== undefined) updateData.description = data.data.description;
    if (data.data.startAt) updateData.startAt = new Date(data.data.startAt);
    if (data.data.endAt) updateData.endAt = new Date(data.data.endAt);
    if (data.data.location !== undefined) updateData.location = data.data.location;
    if (data.data.type) updateData.type = data.data.type;

    await db
      .update(calendarEvents)
      .set(updateData as any)
      .where(eq(calendarEvents.id, data.id));
    return { id: data.id };
  });

export const deleteCalendarEvent = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    await db.delete(calendarEvents).where(eq(calendarEvents.id, data.id));
    return { success: true };
  });
