import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "../db";
import { contactInteractions, dailyUserMetrics } from "../db/schema/metrics";

type InteractionInput = {
  orgId: string;
  contactId: string;
  userId: string;
  type: "call" | "email" | "meeting" | "note" | "whatsapp" | "task_completed";
  content?: string;
  duration?: number;
  outcome?: "positive" | "neutral" | "negative";
  nextAction?: string;
};

export const recordContactInteraction = createServerFn({ method: "POST" })
  .inputValidator((input: InteractionInput) => input)
  .handler(async ({ data }) => {
    const id = crypto.randomUUID();

    await db.insert(contactInteractions).values({
      id,
      organizationId: data.orgId,
      contactId: data.contactId,
      userId: data.userId,
      type: data.type,
      content: data.content,
      duration: data.duration,
      outcome: data.outcome,
      nextAction: data.nextAction,
    } as any);

    await incrementDailyMetric(data.orgId, data.userId, data.type);

    return { id, success: true };
  });

async function incrementDailyMetric(orgId: string, userId: string, type: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await db
    .select()
    .from(dailyUserMetrics)
    .where(
      and(
        eq(dailyUserMetrics.organizationId, orgId),
        eq(dailyUserMetrics.userId, userId),
        eq(dailyUserMetrics.date, today),
      ),
    );

  if (existing.length > 0) {
    const current = existing[0];
    const updateObj: Record<string, unknown> = {
      totalInteractions: (current.totalInteractions || 0) + 1,
    };

    switch (type) {
      case "call":
        updateObj.callsCompleted = (current.callsCompleted || 0) + 1;
        break;
      case "email":
        updateObj.emailsSent = (current.emailsSent || 0) + 1;
        break;
      case "meeting":
        updateObj.meetingsHeld = (current.meetingsHeld || 0) + 1;
        break;
      case "note":
        updateObj.notesAdded = (current.notesAdded || 0) + 1;
        break;
      case "whatsapp":
        updateObj.whatsappSent = (current.whatsappSent || 0) + 1;
        break;
      case "task_completed":
        updateObj.tasksCompleted = (current.tasksCompleted || 0) + 1;
        break;
    }

    await db
      .update(dailyUserMetrics)
      .set(updateObj as any)
      .where(eq(dailyUserMetrics.id, current.id));
  } else {
    const id = crypto.randomUUID();
    const base: Record<string, unknown> = {
      id,
      organizationId: orgId,
      userId,
      date: today,
      totalInteractions: 1,
      contactsCreated: 0,
      contactsTouched: 0,
      callsCompleted: 0,
      emailsSent: 0,
      meetingsHeld: 0,
      notesAdded: 0,
      whatsappSent: 0,
      tasksCreated: 0,
      tasksCompleted: 0,
      contactsMovedForward: 0,
      contactsMovedBackward: 0,
    };

    switch (type) {
      case "call":
        base.callsCompleted = 1;
        break;
      case "email":
        base.emailsSent = 1;
        break;
      case "meeting":
        base.meetingsHeld = 1;
        break;
      case "note":
        base.notesAdded = 1;
        break;
      case "whatsapp":
        base.whatsappSent = 1;
        break;
      case "task_completed":
        base.tasksCompleted = 1;
        break;
    }

    await db.insert(dailyUserMetrics).values(base as any);
  }
}

export const getContactInteractions = createServerFn({ method: "GET" })
  .inputValidator((input: { contactId: string; limit?: number }) => input)
  .handler(async ({ data }) => {
    return db
      .select()
      .from(contactInteractions)
      .where(eq(contactInteractions.contactId, data.contactId))
      .orderBy(sql`${contactInteractions.createdAt} DESC`)
      .limit(data.limit || 20);
  });

export const getUserInteractions = createServerFn({ method: "GET" })
  .inputValidator((input: { orgId: string; userId: string; startDate?: string; endDate?: string }) => input)
  .handler(async ({ data }) => {
    const startDate = data.startDate ? new Date(data.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = data.endDate ? new Date(data.endDate) : new Date();

    return db
      .select()
      .from(contactInteractions)
      .where(
        and(
          eq(contactInteractions.organizationId, data.orgId),
          eq(contactInteractions.userId, data.userId),
          gte(contactInteractions.createdAt, startDate),
          lt(contactInteractions.createdAt, endDate),
        ),
      )
      .orderBy(desc(contactInteractions.createdAt));
  });

export const getInteractionSummary = createServerFn({ method: "GET" })
  .inputValidator((input: { orgId: string; contactId: string }) => input)
  .handler(async ({ data }) => {
    const interactions = await db
      .select({
        type: contactInteractions.type,
        count: sql<number>`COUNT(${contactInteractions.id})`,
        lastInteraction: sql<Date>`MAX(${contactInteractions.createdAt})`,
      })
      .from(contactInteractions)
      .where(eq(contactInteractions.contactId, data.contactId))
      .groupBy(contactInteractions.type);

    return interactions.map((row) => ({
      type: row.type,
      count: Number(row.count),
      lastInteraction: row.lastInteraction as Date | null,
    }));
  });
