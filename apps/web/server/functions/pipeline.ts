// ============================================================
// MaatWork CRM — Server Functions: Pipeline (Stages + Deals)
// ============================================================

import { createServerFn } from "@tanstack/react-start";
import { asc, eq } from "drizzle-orm";
import { db } from "../db";
import { contacts, deals, pipelineStages, pipelineStageHistory } from "../db/schema";

export const getStages = createServerFn({ method: "GET" })
  .inputValidator((input: { orgId: string }) => input)
  .handler(async ({ data }) => {
    return db
      .select()
      .from(pipelineStages)
      .where(eq(pipelineStages.organizationId, data.orgId))
      .orderBy(asc(pipelineStages.order));
  });

export const getDealsWithContacts = createServerFn({ method: "GET" })
  .inputValidator((input: { orgId: string }) => input)
  .handler(async ({ data }) => {
    return db
      .select({
        deal: deals,
        contact: contacts,
      })
      .from(deals)
      .innerJoin(contacts, eq(deals.contactId, contacts.id))
      .where(eq(deals.organizationId, data.orgId));
  });

export const moveDeal = createServerFn({ method: "POST" })
  .inputValidator((input: { dealId: string; stageId: string; userId?: string; reason?: string }) => input)
  .handler(async ({ data }) => {
    const currentDeal = await db.select().from(deals).where(eq(deals.id, data.dealId)).then(r => r[0]);
    
    if (currentDeal) {
      await db.insert(pipelineStageHistory).values({
        id: crypto.randomUUID(),
        organizationId: currentDeal.organizationId,
        contactId: currentDeal.contactId,
        fromStageId: currentDeal.stageId,
        toStageId: data.stageId,
        reason: data.reason || null,
        changedByUserId: data.userId || null,
      });
    }
    
    await db.update(deals).set({ stageId: data.stageId, updatedAt: new Date() }).where(eq(deals.id, data.dealId));
    return { success: true };
  });

export const createDeal = createServerFn({ method: "POST" })
  .inputValidator((input: { orgId: string; data: Record<string, unknown> }) => input)
  .handler(async ({ data }) => {
    const id = crypto.randomUUID();
    // 🛡️ Sentinel: Prevent Mass Assignment vulnerability
    // Remove sensitive fields that should never be set directly via input data.
    const { id: _id, organizationId: _orgId, ...safeData } = data.data;

    await db.insert(deals).values({
      id,
      organizationId: data.orgId,
      ...(safeData as any),
    });
    return { id };
  });

export const createStage = createServerFn({ method: "POST" })
  .inputValidator((input: { orgId: string; name: string; color: string; order: number; description?: string; wipLimit?: number; slaHours?: number }) => input)
  .handler(async ({ data }) => {
    const id = crypto.randomUUID();
    await db.insert(pipelineStages).values({
      id,
      organizationId: data.orgId,
      name: data.name,
      description: data.description || null,
      color: data.color,
      order: data.order,
      wipLimit: data.wipLimit || null,
      slaHours: data.slaHours || null,
    });
    return { id };
  });

export const getStageHistory = createServerFn({ method: "GET" })
  .inputValidator((input: { contactId: string }) => input)
  .handler(async ({ data }) => {
    return db
      .select()
      .from(pipelineStageHistory)
      .where(eq(pipelineStageHistory.contactId, data.contactId))
      .orderBy(pipelineStageHistory.changedAt);
  });

export const updateStage = createServerFn({ method: "POST" })
  .inputValidator((input: { stageId: string; name?: string; description?: string; color?: string; wipLimit?: number; slaHours?: number; isActive?: boolean }) => input)
  .handler(async ({ data }) => {
    const { stageId, ...updates } = data;
    await db.update(pipelineStages).set(updates).where(eq(pipelineStages.id, stageId));
    return { success: true };
  });
