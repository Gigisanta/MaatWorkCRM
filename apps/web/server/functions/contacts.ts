// ============================================================
// MaatWork CRM — Server Functions: Contacts
// ============================================================

import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, like } from "drizzle-orm";
import { db } from "../db";
import { contacts } from "../db/schema";

export const getContacts = createServerFn({ method: "GET" })
  .inputValidator((input: { orgId: string; search?: string; status?: string }) => input)
  .handler(async ({ data }) => {
    const conditions = [eq(contacts.organizationId, data.orgId)];
    if (data.status) {
      conditions.push(eq(contacts.status, data.status as any));
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
    const id = crypto.randomUUID();
    const newContact = { id, organizationId: data.orgId, ...data.data };
    await db.insert(contacts).values(newContact as any);
    return { id };
  });

export const updateContact = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string; data: Record<string, unknown> }) => input)
  .handler(async ({ data }) => {
    await db
      .update(contacts)
      .set({ ...(data.data as any), updatedAt: new Date() })
      .where(eq(contacts.id, data.id));
    return { id: data.id };
  });

export const deleteContact = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    await db.delete(contacts).where(eq(contacts.id, data.id));
    return { success: true };
  });
