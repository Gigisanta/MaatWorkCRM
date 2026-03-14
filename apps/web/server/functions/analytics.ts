// ============================================================
// MaatWork CRM — Server Functions: Analytics & Dashboard
// ============================================================

import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../db";
import { auditLogs, contacts, pipelineStages, tasks } from "../db/schema";
import { dailyUserMetrics } from "../db/schema/metrics";

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
      pendingTasks: pendingTasks.count,
      completedTasks: completedTasks.count,
    };
  });

export const getContactsByStage = createServerFn({ method: "GET" })
  .inputValidator((input: { orgId: string }) => input)
  .handler(async ({ data }) => {
    const stagesWithCounts = await db
      .select({
        stageId: pipelineStages.id,
        stageName: pipelineStages.name,
        stageColor: pipelineStages.color,
        stageOrder: pipelineStages.order,
        wipLimit: pipelineStages.wipLimit,
        slaHours: pipelineStages.slaHours,
        contactCount: sql<number>`COUNT(${contacts.id})`,
      })
      .from(pipelineStages)
      .leftJoin(contacts, and(eq(pipelineStages.id, contacts.pipelineStageId), eq(contacts.organizationId, data.orgId)))
      .where(eq(pipelineStages.organizationId, data.orgId))
      .groupBy(
        pipelineStages.id,
        pipelineStages.name,
        pipelineStages.color,
        pipelineStages.order,
        pipelineStages.wipLimit,
        pipelineStages.slaHours,
      )
      .orderBy(pipelineStages.order);

    const totalContacts = stagesWithCounts.reduce((sum, s) => sum + Number(s.contactCount), 0);

    return stagesWithCounts.map((stage) => ({
      stageId: stage.stageId,
      stageName: stage.stageName,
      stageColor: stage.stageColor,
      stageOrder: stage.stageOrder,
      wipLimit: stage.wipLimit,
      slaHours: stage.slaHours,
      contactCount: Number(stage.contactCount),
      percentage: totalContacts > 0 ? (Number(stage.contactCount) / totalContacts) * 100 : 0,
    }));
  });

export const getBottleneckAnalysis = createServerFn({ method: "GET" })
  .inputValidator((input: { orgId: string }) => input)
  .handler(async ({ data }) => {
    const stages = await getContactsByStage({ data: { orgId: data.orgId } });
    const totalContacts = stages.reduce((sum, s) => sum + s.contactCount, 0);

    return {
      totalContacts,
      stages: stages.map((stage) => ({
        ...stage,
        isBottleneck: stage.percentage > 40,
        isOverWipLimit: stage.wipLimit ? stage.contactCount > stage.wipLimit : false,
        bottleneckLevel:
          stage.percentage > 60
            ? "critical"
            : stage.percentage > 40
              ? "warning"
              : stage.percentage > 20
                ? "moderate"
                : "healthy",
      })),
    };
  });

export const getConversionFunnel = createServerFn({ method: "GET" })
  .inputValidator((input: { orgId: string }) => input)
  .handler(async ({ data }) => {
    // UI/UX REFINED BY JULES v2
    // ⚡ Bolt: Fixed N+1 query by aggregating contacts count inside the initial pipeline query
    const rawStages = await db
      .select({
        stageId: pipelineStages.id,
        stageName: pipelineStages.name,
        stageOrder: pipelineStages.order,
        count: sql<number>`COUNT(${contacts.id})`,
      })
      .from(pipelineStages)
      .leftJoin(contacts, and(eq(pipelineStages.id, contacts.pipelineStageId), eq(contacts.organizationId, data.orgId)))
      .where(eq(pipelineStages.organizationId, data.orgId))
      .groupBy(pipelineStages.id, pipelineStages.name, pipelineStages.order)
      .orderBy(pipelineStages.order);

    const contactsPerStage = rawStages.map((stage) => ({
      stageId: stage.stageId,
      stageName: stage.stageName,
      stageOrder: stage.stageOrder,
      count: Number(stage.count),
    }));

    const totalContacts = contactsPerStage.reduce((sum, s) => sum + s.count, 0);
    const clientStage = contactsPerStage.find((s) => s.stageName.toLowerCase().includes("cliente"));
    const clientCount = clientStage ? clientStage.count : 0;

    const funnelData = contactsPerStage.map((stage, idx) => {
      const nextStage = contactsPerStage[idx + 1];
      return {
        stageId: stage.stageId,
        stageName: stage.stageName,
        count: stage.count,
        percentage: totalContacts > 0 ? (stage.count / totalContacts) * 100 : 0,
        conversionToNext:
          nextStage && nextStage.count > 0 ? (Math.min(stage.count, nextStage.count) / stage.count) * 100 : 0,
      };
    });

    return {
      funnel: funnelData,
      totalContacts,
      overallConversionRate: totalContacts > 0 ? (clientCount / totalContacts) * 100 : 0,
    };
  });

export const getUserProductivityMetrics = createServerFn({ method: "GET" })
  .inputValidator((input: { orgId: string; userId?: string; days?: number }) => input)
  .handler(async ({ data }) => {
    const days = data.days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const queryConditions = [eq(dailyUserMetrics.organizationId, data.orgId), gte(dailyUserMetrics.date, startDate)];

    if (data.userId) {
      queryConditions.push(eq(dailyUserMetrics.userId, data.userId));
    }

    const metrics = await db
      .select()
      .from(dailyUserMetrics)
      .where(and(...queryConditions))
      .orderBy(desc(dailyUserMetrics.date));

    const totals = metrics.reduce(
      (acc, m) => ({
        contactsCreated: acc.contactsCreated + (m.contactsCreated || 0),
        contactsTouched: acc.contactsTouched + (m.contactsTouched || 0),
        totalInteractions: acc.totalInteractions + (m.totalInteractions || 0),
        callsCompleted: acc.callsCompleted + (m.callsCompleted || 0),
        emailsSent: acc.emailsSent + (m.emailsSent || 0),
        meetingsHeld: acc.meetingsHeld + (m.meetingsHeld || 0),
        notesAdded: acc.notesAdded + (m.notesAdded || 0),
        tasksCompleted: acc.tasksCompleted + (m.tasksCompleted || 0),
      }),
      {
        contactsCreated: 0,
        contactsTouched: 0,
        totalInteractions: 0,
        callsCompleted: 0,
        emailsSent: 0,
        meetingsHeld: 0,
        notesAdded: 0,
        tasksCompleted: 0,
      },
    );

    return {
      dailyMetrics: metrics,
      totals,
      periodDays: days,
    };
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
