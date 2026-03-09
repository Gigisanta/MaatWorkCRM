// ============================================================
// MaatWork CRM — Server Functions: Analytics & Dashboard
// ============================================================

import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { auditLogs, contacts, deals, pipelineStages, tasks, teamGoals } from "../db/schema";

export const getDashboardMetrics = createServerFn({ method: "GET" })
  .inputValidator((input: { orgId: string }) => input)
  .handler(async ({ data }) => {
    const [contactCount] = await db
      .select({ count: count() })
      .from(contacts)
      .where(eq(contacts.organizationId, data.orgId));

    const [activeContacts] = await db
      .select({ count: count() })
      .from(contacts)
      .where(and(eq(contacts.organizationId, data.orgId), sql`${contacts.pipelineStageId} IS NOT NULL`));

    const [dealCount] = await db.select({ count: count() }).from(deals).where(eq(deals.organizationId, data.orgId));

    const [pipelineValue] = await db
      .select({ total: sql<number>`COALESCE(SUM(${deals.value}), 0)` })
      .from(deals)
      .where(eq(deals.organizationId, data.orgId));

    const [pendingTasks] = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(eq(tasks.organizationId, data.orgId), eq(tasks.status, "pending")));

    const [completedTasks] = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(eq(tasks.organizationId, data.orgId), eq(tasks.status, "completed")));

    return {
      totalContacts: contactCount.count,
      activeContacts: activeContacts.count,
      totalDeals: dealCount.count,
      pipelineValue: pipelineValue.total,
      pendingTasks: pendingTasks.count,
      completedTasks: completedTasks.count,
    };
  });

export const getPipelineByStage = createServerFn({ method: "GET" })
  .inputValidator((input: { orgId: string }) => input)
  .handler(async ({ data }) => {
    return db
      .select({
        stageName: pipelineStages.name,
        stageColor: pipelineStages.color,
        dealCount: count(deals.id),
        totalValue: sql<number>`COALESCE(SUM(${deals.value}), 0)`,
      })
      .from(pipelineStages)
      .leftJoin(deals, eq(pipelineStages.id, deals.stageId))
      .where(eq(pipelineStages.organizationId, data.orgId))
      .groupBy(pipelineStages.id, pipelineStages.name, pipelineStages.color, pipelineStages.order)
      .orderBy(pipelineStages.order);
  });

export const getRecentActivity = createServerFn({ method: "GET" })
  .inputValidator((input: { orgId: string; limit?: number }) => input)
  .handler(async ({ data }) => {
    return db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.organizationId, data.orgId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(data.limit ?? 10);
  });
