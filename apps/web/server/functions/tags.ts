import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { contactTags, tags } from "../db/schema";

export const getTags = createServerFn({ method: "GET" })
  .inputValidator((input: { orgId: string; scope?: string }) => input)
  .handler(async ({ data }) => {
    const conditions = [eq(tags.organizationId, data.orgId)];
    if (data.scope) {
      conditions.push(eq(tags.scope, data.scope as any));
    }
    return db
      .select()
      .from(tags)
      .where(and(...conditions))
      .orderBy(desc(tags.createdAt));
  });

export const createTag = createServerFn({ method: "POST" })
  .inputValidator((input: { orgId: string; data: Record<string, unknown> }) => input)
  .handler(async ({ data }) => {
    const id = crypto.randomUUID();
    const newTag = { id, organizationId: data.orgId, ...data.data };
    await db.insert(tags).values(newTag as any);
    return { id };
  });

export const deleteTag = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    await db.delete(tags).where(eq(tags.id, data.id));
    return { success: true };
  });

export const getContactTags = createServerFn({ method: "GET" })
  .inputValidator((input: { contactId: string }) => input)
  .handler(async ({ data }) => {
    return db.select().from(contactTags).where(eq(contactTags.contactId, data.contactId));
  });

export const addTagToContact = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { contactId: string; tagId: string; monthlyPremium?: number; policyNumber?: string }) => input,
  )
  .handler(async ({ data }) => {
    const id = crypto.randomUUID();
    await db.insert(contactTags).values({
      id,
      contactId: data.contactId,
      tagId: data.tagId,
      monthlyPremium: data.monthlyPremium,
      policyNumber: data.policyNumber,
    });
    return { id };
  });

export const removeTagFromContact = createServerFn({ method: "POST" })
  .inputValidator((input: { contactId: string; tagId: string }) => input)
  .handler(async ({ data }) => {
    await db
      .delete(contactTags)
      .where(and(eq(contactTags.contactId, data.contactId), eq(contactTags.tagId, data.tagId)));
    return { success: true };
  });
