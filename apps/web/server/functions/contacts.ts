// ============================================================
// MaatWork CRM — Server Functions: Contacts
// ============================================================

import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, like } from "drizzle-orm";
import { db } from "../db";
import { contacts } from "../db/schema";

export const getContacts = createServerFn({ method: "GET" })
  .inputValidator((input: { orgId: string; search?: string; pipelineStageId?: string }) => input)
  .handler(async ({ data }) => {
    const conditions = [eq(contacts.organizationId, data.orgId)];
    if (data.pipelineStageId) {
      conditions.push(eq(contacts.pipelineStageId, data.pipelineStageId));
    }
    if (data.search) {
      conditions.push(like(contacts.name, `%${data.search}%`));
    }
    return db
      .select()
      .from(contacts)
      .where(and(...conditions))
      .orderBy(desc(contacts.createdAt));
  });

export const getContact = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const result = await db.select().from(contacts).where(eq(contacts.id, data.id));
    return result[0] ?? null;
  });

export const createContact = createServerFn({ method: "POST" })
  .inputValidator((input: { orgId: string; data: Record<string, unknown> }) => input)
  .handler(async ({ data }) => {
    // 🛡️ Sentinel: Prevent Mass Assignment vulnerability
    // Remove sensitive fields that should never be set directly via input data.
    const { id: _id, organizationId: _orgId, ...safeData } = data.data;

    const id = crypto.randomUUID();
    const newContact = { ...safeData, id, organizationId: data.orgId };
    await db.insert(contacts).values(newContact as any);
    return { id };
  });
// UI/UX REFINED BY JULES v2

export const updateContact = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string; data: Record<string, unknown> }) => input)
  .handler(async ({ data }) => {
    // 🛡️ Sentinel: Prevent Mass Assignment vulnerability
    // Remove sensitive fields that should never be updated directly via input data.
    const { id, organizationId, ...safeData } = data.data;

    await db
      .update(contacts)
      .set({ ...(safeData as any), updatedAt: new Date() })
      .where(eq(contacts.id, data.id));
    return { id: data.id };
  });

export const deleteContact = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    await db.delete(contacts).where(eq(contacts.id, data.id));
    return { success: true };
  });
