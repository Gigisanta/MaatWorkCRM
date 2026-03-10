// ============================================================
// MaatWork CRM — Server Functions: Contacts
// ============================================================

import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, inArray, like } from "drizzle-orm";
import { db } from "../db";
import { contactTags, contacts, tags } from "../db/schema";
import { recordContactInteraction } from "./interactions";

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
    const contactList = await db
      .select()
      .from(contacts)
      .where(and(...conditions))
      .orderBy(desc(contacts.createdAt));

    const contactIds = contactList.map((c) => c.id);
    if (contactIds.length === 0) return contactList;

    const contactTagsList = await db
      .select({
        id: contactTags.id,
        contactId: contactTags.contactId,
        tagId: contactTags.tagId,
        tagName: tags.name,
        tagColor: tags.color,
      })
      .from(contactTags)
      .leftJoin(tags, eq(contactTags.tagId, tags.id))
      .where(inArray(contactTags.contactId, contactIds));

    const tagsMap = new Map<string, Array<{ id: string; name: string; color: string }>>();
    for (const ct of contactTagsList) {
      if (!tagsMap.has(ct.contactId)) {
        tagsMap.set(ct.contactId, []);
      }
      if (ct.tagId && ct.tagName) {
        tagsMap.get(ct.contactId)!.push({ id: ct.tagId, name: ct.tagName, color: ct.tagColor });
      }
    }

    return contactList.map((contact) => ({
      ...contact,
      tags: tagsMap.get(contact.id) || [],
    }));
  });

export const getContact = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const result = await db.select().from(contacts).where(eq(contacts.id, data.id));
    return result[0] ?? null;
  });

export const createContact = createServerFn({ method: "POST" })
  .inputValidator((input: { orgId: string; data: Record<string, unknown>; userId?: string }) => input)
  .handler(async ({ data }) => {
    const id = crypto.randomUUID();
    const defaultStageId = "stage-prospecto";
    // 🛡️ Sentinel: Prevent Mass Assignment vulnerability
    const { id: _id, organizationId: _orgId, pipelineStageId: _stageId, ...safeData } = data.data;

    const newContact = {
      id,
      organizationId: data.orgId,
      pipelineStageId: defaultStageId,
      ...safeData,
    };
    await db.insert(contacts).values(newContact as any);

    if (data.userId) {
      await recordContactInteraction({
        data: {
          orgId: data.orgId,
          contactId: id,
          userId: data.userId,
          type: "note",
          content: "Contacto creado",
        },
      });
    }

    return { id };
  });

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
