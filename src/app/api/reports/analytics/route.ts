import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getUserFromSession } from "@/lib/auth/auth-helpers";
import { db } from "@/lib/db/db";
import { logger } from "@/lib/db/logger";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subDays,
  parseISO,
  isWithinInterval,
  format,
  differenceInDays,
  startOfDay,
  endOfDay,
} from "date-fns";
import type {
  ReportsAnalyticsResponse,
  PeriodFilter,
  ExecutiveMetrics,
  FunnelMetrics,
  LeadScoringMetrics,
  GoalsMetrics,
  ActivityMetrics,
  AdvisorMetrics,
  PipelineMetrics,
  ContactsMetrics,
  TrendsMetrics,
  FunnelStage,
  LeadScoreBucket,
  GoalTypeSummary,
  AdvisorRanking,
} from "../../../reports/types/analytics";

export const dynamic = "force-dynamic";

const INACTIVE_STAGES = ["Caído", "Caida", "Cuenta vacia", "Cuenta Vacía"];

const LEAD_SCORE_BUCKETS: { label: "cold" | "warm" | "hot" | "scorching"; min: number; max: number; color: string }[] = [
  { label: "cold", min: 0, max: 5, color: "#3B82F6" },
  { label: "warm", min: 6, max: 10, color: "#F59E0B" },
  { label: "hot", min: 11, max: 20, color: "#EF4444" },
  { label: "scorching", min: 21, max: 30, color: "#10B981" },
];

function getPeriodBounds(period: PeriodFilter, now: Date = new Date()) {
  switch (period) {
    case "week":
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case "quarter":
      return { start: startOfQuarter(now), end: endOfQuarter(now) };
    case "year":
      return { start: startOfYear(now), end: endOfYear(now) };
    case "month":
    default:
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
}

function getPreviousPeriodBounds(period: PeriodFilter, now: Date = new Date()) {
  switch (period) {
    case "week": {
      const prev = subDays(now, 7);
      return { start: startOfWeek(prev, { weekStartsOn: 1 }), end: endOfWeek(prev, { weekStartsOn: 1 }) };
    }
    case "quarter": {
      const prev = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      return { start: startOfQuarter(prev), end: endOfQuarter(prev) };
    }
    case "year": {
      const prev = new Date(now.getFullYear() - 1, 0, 1);
      return { start: startOfYear(prev), end: endOfYear(prev) };
    }
    case "month":
    default: {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { start: startOfMonth(prev), end: endOfMonth(prev) };
    }
  }
}

function safeDiv(a: number, b: number): number {
  return b === 0 ? 0 : a / b;
}

function pctChange(current: number, previous: number): number {
  return previous === 0 ? 0 : Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

// ─── Executive Metrics ───────────────────────────────────────────────────────

async function getExecutiveMetrics(
  orgId: string,
  period: PeriodFilter
): Promise<ExecutiveMetrics> {
  const now = new Date();
  const { start, end } = getPeriodBounds(period, now);
  const { start: prevStart, end: prevEnd } = getPreviousPeriodBounds(period, now);
  const staleThreshold = subDays(now, 14);

  const [
    contactsInPeriod,
    contactsPrevPeriod,
    totalContacts,
    dealsResult,
    tasksResult,
    goalsResult,
    meetingsResult,
    dealsPrevResult,
    contactsStale,
  ] = await Promise.all([
    db.contact.count({
      where: { organizationId: orgId, createdAt: { gte: start, lte: end } },
    }),
    db.contact.count({
      where: { organizationId: orgId, createdAt: { gte: prevStart, lte: prevEnd } },
    }),
    db.contact.count({ where: { organizationId: orgId } }),
    db.deal.aggregate({
      where: { organizationId: orgId },
      _count: true,
      _sum: { value: true },
    }),
    db.task.aggregate({
      where: { organizationId: orgId },
      _count: true,
    }),
    db.teamGoal.findMany({
      where: { team: { organizationId: orgId }, status: "active" },
      select: { targetValue: true, currentValue: true },
    }),
    db.calendarEvent.count({
      where: {
        organizationId: orgId,
        type: "meeting",
        startAt: { gte: start, lte: end },
      },
    }),
    db.deal.aggregate({
      where: { organizationId: orgId, createdAt: { gte: prevStart, lte: prevEnd } },
      _count: true,
    }),
    db.contact.count({
      where: {
        organizationId: orgId,
        updatedAt: { lt: staleThreshold },
        pipelineStage: {
          name: { notIn: INACTIVE_STAGES },
        },
      },
    }),
  ]);

  const pipelineValue = dealsResult._sum?.value || 0;
  const totalTasks = tasksResult._count || 0;
  const completedTasks = await db.task.count({
    where: { organizationId: orgId, status: "completed", completedAt: { gte: start, lte: end } },
  });
  const overdueTasks = await db.task.count({
    where: {
      organizationId: orgId,
      status: { notIn: ["completed", "cancelled"] },
      dueDate: { lt: now },
    },
  });

  // Win rate: deals completed this period / deals created this period
  const closedDeals = await db.deal.count({
    where: { organizationId: orgId, updatedAt: { gte: start, lte: end } },
  });
  const winRate = dealsResult._count > 0
    ? Math.round((closedDeals / (dealsResult._count || 1)) * 100)
    : 0;

  const avgGoalProgress =
    goalsResult.length > 0
      ? Math.round(
          goalsResult.reduce(
            (sum, g) => sum + (g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0),
            0
          ) / goalsResult.length
        )
      : 0;

  // Health score
  const overdueTasksRatio = totalTasks > 0 ? overdueTasks / totalTasks : 0;
  const staleContactsRatio = totalContacts > 0 ? contactsStale / totalContacts : 0;
  const healthScore = Math.round(
    (winRate / 100) * 0.25 +
      (avgGoalProgress / 100) * 0.25 +
      (1 - overdueTasksRatio) * 0.25 +
      (1 - staleContactsRatio) * 0.25
  ) * 100;

  // Previous period comparisons
  const contactsChange = pctChange(contactsInPeriod, contactsPrevPeriod);
  const overdueTasksChange = 0; // simplified
  const meetingsChange = 0; // would need prev meetings count

  // FIX 1: Use DB aggregation instead of loading all contacts to compute average
  const scoreAgg = await db.contact.aggregate({
    where: { organizationId: orgId },
    _avg: { leadScore: true },
  });
  const avgLeadScore = scoreAgg._avg.leadScore || 0;
  const weightedPipeline = pipelineValue * (avgLeadScore / 30);

  // Revenue forecast = weighted pipeline
  const revenueForecast = weightedPipeline;
  const meetingsHeld = meetingsResult;

  return {
    pipelineValue,
    weightedPipeline: Math.round(weightedPipeline),
    pipelineChange: 0,
    totalContacts,
    activeContacts: contactsInPeriod,
    contactsChange,
    winRate,
    avgDealSize: dealsResult._count > 0 ? Math.round(pipelineValue / dealsResult._count) : 0,
    pipelineVelocity: 0,
    healthScore: Math.min(100, Math.max(0, healthScore)),
    healthScoreChange: 0,
    staleContacts: contactsStale,
    overdueTasks,
    overdueTasksChange,
    avgGoalProgress,
    revenueForecast: Math.round(revenueForecast),
    revenueForecastChange: 0,
    meetingsHeld,
    meetingsChange: meetingsChange,
  };
}

// ─── Funnel Metrics ─────────────────────────────────────────────────────────────

async function getFunnelMetrics(orgId: string, period: PeriodFilter): Promise<FunnelMetrics> {
  const now = new Date();
  const { start, end } = getPeriodBounds(period, now);

  // FIX 2: Fetch stages without loading contacts; use groupBy for counts
  const stages = await db.pipelineStage.findMany({
    where: { organizationId: orgId },
    orderBy: { order: "asc" },
  });

  // Get counts and lead-score sums per stage via groupBy (avoids loading full contact rows)
  const [stageCountsResult, stageContactValues] = await Promise.all([
    db.contact.groupBy({
      by: ["pipelineStageId"],
      where: { organizationId: orgId },
      _count: true,
    }),
    db.contact.groupBy({
      by: ["pipelineStageId"],
      where: { organizationId: orgId },
      _sum: { leadScore: true },
    }),
  ]);

  const stageCountsMap: Record<string, number> = {};
  for (const sc of stageCountsResult) {
    stageCountsMap[sc.pipelineStageId || ""] = sc._count;
  }

  const stageValuesMap: Record<string, number> = {};
  for (const sv of stageContactValues) {
    stageValuesMap[sv.pipelineStageId || ""] = sv._sum?.leadScore || 0;
  }

  // Get total contact count
  const totalContacts = await db.contact.count({ where: { organizationId: orgId } });

  // Get lost contacts (in inactive stages)
  const lostContactsInPeriod = await db.contact.count({
    where: {
      organizationId: orgId,
      pipelineStage: { name: { in: INACTIVE_STAGES } },
      updatedAt: { gte: start, lte: end },
    },
  });

  const lostContactsValue = 0;

  // Build funnel stages using pre-computed maps
  const funnelStages: FunnelStage[] = stages.map((stage, idx) => {
    const count = stageCountsMap[stage.id] || 0;
    const value = stageValuesMap[stage.id] || 0;
    const prevCount = idx > 0 ? (stageCountsMap[stages[idx - 1].id] || 0) : 0;
    const conversionRate = prevCount > 0 ? Math.round((count / prevCount) * 100) : null;

    return {
      id: stage.id,
      name: stage.name,
      color: stage.color,
      order: stage.order,
      count,
      value,
      conversionRate,
      avgTimeInStage: null,
      isLost: INACTIVE_STAGES.includes(stage.name),
    };
  });

  const firstStageCount = stageCountsMap[stages[0]?.id] || 0;
  const lastStageCount = stageCountsMap[stages[stages.length - 1]?.id] || 0;
  const overallConversionRate =
    firstStageCount > 0 ? Math.round((lastStageCount / firstStageCount) * 100) : 0;

  return {
    stages: funnelStages,
    totalContacts,
    lostContacts: lostContactsInPeriod,
    lostContactsValue,
    overallConversionRate,
  };
}

// ─── Lead Scoring Metrics ───────────────────────────────────────────────────────

async function getLeadScoringMetrics(orgId: string): Promise<LeadScoringMetrics> {
  // FIX Q1: Use groupBy instead of loading all contacts into memory.
  // groupBy returns at most 31 unique leadScore values (0-30), vs. up to 10,000 rows.
  const scoreGroups = await db.contact.groupBy({
    by: ["leadScore"],
    where: { organizationId: orgId },
    _count: true,
  });

  const totalContacts = scoreGroups.reduce((sum, g) => sum + g._count, 0);

  // Bucket distribution computed entirely from grouped aggregates
  const buckets = LEAD_SCORE_BUCKETS.map((bucket) => {
    const bucketGroups = scoreGroups.filter(
      (g) => g.leadScore >= bucket.min && g.leadScore <= bucket.max
    );
    const count = bucketGroups.reduce((sum, g) => sum + g._count, 0);
    return {
      bucket: bucket.label,
      range: `${bucket.min}-${bucket.max}`,
      count,
      percentage: totalContacts > 0 ? Math.round((count / totalContacts) * 100) : 0,
      avgValue: 0,
      color: bucket.color,
    } as LeadScoreBucket;
  });

  // Score effectiveness derived from the same groupBy result
  const highScoreGroups = scoreGroups.filter((g) => g.leadScore >= 20);
  const lowScoreGroups = scoreGroups.filter((g) => g.leadScore < 10);

  const highScoreAvgValue = highScoreGroups.reduce((sum, g) => sum + g._count, 0);
  const lowScoreAvgValue = lowScoreGroups.reduce((sum, g) => sum + g._count, 0);

  const lift = lowScoreAvgValue > 0 ? Math.round((highScoreAvgValue / lowScoreAvgValue) * 100) / 100 : 0;

  // Avg score by segment
  const segmentScores = await db.contact.groupBy({
    by: ["segment"],
    where: { organizationId: orgId, segment: { not: null } },
    _avg: { leadScore: true },
    _count: true,
  });
  const avgScoreBySegment = segmentScores.map((s) => ({
    segment: s.segment || "Unknown",
    avgScore: s._avg?.leadScore || 0,
    count: s._count,
  }));

  return {
    distribution: buckets,
    avgScoreBySegment,
    scoreEffectiveness: {
      highScoreAvgValue: Math.round(highScoreAvgValue * 100) / 100,
      lowScoreAvgValue: Math.round(lowScoreAvgValue * 100) / 100,
      lift,
    },
  };
}

// ─── Goals Metrics ─────────────────────────────────────────────────────────────

async function getGoalsMetrics(orgId: string, period: PeriodFilter): Promise<GoalsMetrics> {
  const { start } = getPeriodBounds(period);
  // Push period filter to Prisma where clause instead of loading all goals
  const goalYear = start.getFullYear();
  const goalMonth = start.getMonth() + 1;

  const goals = await db.teamGoal.findMany({
    where: {
      team: { organizationId: orgId },
      year: goalYear,
      month: goalMonth,
    },
    include: {
      team: { select: { id: true, name: true } },
    },
  });

  const goalTypes = ["new_aum", "new_clients", "meetings", "revenue"];
  const typeLabels: Record<string, string> = {
    new_aum: "Nuevo AUM",
    new_clients: "Nuevos Clientes",
    meetings: "Reuniones",
    revenue: "Ingresos",
  };

  const byType: GoalTypeSummary[] = goalTypes.map((type) => {
    const typeGoals = goals.filter((g) => g.type === type);
    const completed = typeGoals.filter((g) => g.status === "completed").length;
    const atRisk = typeGoals.filter(
      (g) => g.status === "active" && g.currentValue / g.targetValue < 0.5
    ).length;
    const totalTarget = typeGoals.reduce((sum, g) => sum + g.targetValue, 0);
    const totalCurrent = typeGoals.reduce((sum, g) => sum + g.currentValue, 0);
    const progress = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

    return {
      type,
      label: typeLabels[type] || type,
      targetValue: totalTarget,
      currentValue: totalCurrent,
      progress,
      onTrack: progress >= 80,
      goalsCount: typeGoals.length,
      completedCount: completed,
      atRiskCount: atRisk,
    };
  });

  const activeGoals = goals.filter((g) => g.status === "active").length;
  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const atRiskGoals = goals.filter(
    (g) => g.status === "active" && g.currentValue / g.targetValue < 0.5
  ).length;
  const avgProgress =
    goals.length > 0
      ? Math.round(
          goals.reduce(
            (sum, g) => sum + (g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0),
            0
          ) / goals.length
        )
      : 0;

  const pacingIndex = avgProgress / 100;

  // By team
  const teamsMap = new Map<string, { name: string; goals: typeof goals }>();
  for (const goal of goals) {
    const existing = teamsMap.get(goal.team.id);
    if (existing) {
      existing.goals.push(goal);
    } else {
      teamsMap.set(goal.team.id, { name: goal.team.name, goals: [goal] });
    }
  }

  const byTeam = Array.from(teamsMap.entries()).map(([teamId, data]) => ({
    teamId,
    teamName: data.name,
    totalGoals: data.goals.length,
    completedGoals: data.goals.filter((g) => g.status === "completed").length,
    avgProgress: Math.round(
      data.goals.reduce(
        (sum, g) => sum + (g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0),
        0
      ) / data.goals.length
    ),
    goals: data.goals.map((g) => ({
      id: g.id,
      title: g.title,
      type: g.type,
      targetValue: g.targetValue,
      currentValue: g.currentValue,
      progress: Math.round(
        g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0
      ),
      status: g.status,
      pacingIndex: g.targetValue > 0 ? g.currentValue / g.targetValue : 0,
    })),
  }));

  return {
    byType,
    overall: {
      totalGoals: goals.length,
      completedGoals,
      activeGoals,
      atRiskGoals,
      avgProgress,
      pacingIndex: Math.round(pacingIndex * 100) / 100,
    },
    byTeam,
  };
}

// ─── Activity Metrics ──────────────────────────────────────────────────────────

async function getActivityMetrics(orgId: string, period: PeriodFilter): Promise<ActivityMetrics> {
  const now = new Date();
  const { start, end } = getPeriodBounds(period, now);
  const { start: prevStart, end: prevEnd } = getPreviousPeriodBounds(period, now);

  const [tasksTotal, tasksCompleted, tasksOverdue, tasksPending, tasksInProgress, meetingsCount] =
    await Promise.all([
      db.task.count({ where: { organizationId: orgId, createdAt: { gte: start, lte: end } } }),
      db.task.count({
        where: { organizationId: orgId, status: "completed", completedAt: { gte: start, lte: end } },
      }),
      db.task.count({
        where: {
          organizationId: orgId,
          status: { notIn: ["completed", "cancelled"] },
          dueDate: { lt: now },
        },
      }),
      db.task.count({
        where: { organizationId: orgId, status: "pending", createdAt: { gte: start, lte: end } },
      }),
      db.task.count({
        where: { organizationId: orgId, status: "in_progress", createdAt: { gte: start, lte: end } },
      }),
      db.calendarEvent.count({
        where: {
          organizationId: orgId,
          type: "meeting",
          startAt: { gte: start, lte: end },
        },
      }),
    ]);

  const prevMeetingsCount = await db.calendarEvent.count({
    where: {
      organizationId: orgId,
      type: "meeting",
      startAt: { gte: prevStart, lte: prevEnd },
    },
  });

  // Task status breakdown
  const tasksByStatus = await db.task.groupBy({
    by: ["status"],
    where: { organizationId: orgId, createdAt: { gte: start, lte: end } },
    _count: true,
  });

  const tasksByStatusMap: Record<string, number> = {};
  for (const s of tasksByStatus) {
    tasksByStatusMap[s.status] = s._count;
  }

  // Task priority breakdown
  const tasksByPriority = await db.task.groupBy({
    by: ["priority"],
    where: { organizationId: orgId, createdAt: { gte: start, lte: end } },
    _count: true,
  });

  const tasksByPriorityMap: Record<string, number> = {};
  for (const p of tasksByPriority) {
    tasksByPriorityMap[p.priority] = p._count;
  }

  const completionRate = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;
  const meetingsChange = pctChange(meetingsCount, prevMeetingsCount);

  // Trend: pre-compute all date ranges then run all queries in parallel (avoids N+1)
  const interval = period === "week" ? 7 : period === "month" ? 30 : 90;
  const numPoints = period === "week" ? 4 : period === "month" ? 4 : period === "quarter" ? 4 : 12;
  const pointStep = Math.floor(interval / numPoints);

  const pointRanges = Array.from({ length: numPoints }, (_, i) => {
    const reversedI = numPoints - 1 - i; // P1 = oldest, P4/P12 = newest
    const pointStart = new Date(start);
    pointStart.setDate(pointStart.getDate() - reversedI * pointStep);
    const pointEnd = new Date(pointStart);
    pointEnd.setDate(pointEnd.getDate() + pointStep);
    return { label: `P${i + 1}`, pointStart, pointEnd };
  });

  const trendResults = await Promise.all(
    pointRanges.map(({ pointStart, pointEnd }) =>
      Promise.all([
        db.task.count({
          where: { organizationId: orgId, status: "completed", completedAt: { gte: pointStart, lte: pointEnd } },
        }),
        db.calendarEvent.count({
          where: { organizationId: orgId, type: "meeting", startAt: { gte: pointStart, lte: pointEnd } },
        }),
        db.contact.count({
          where: { organizationId: orgId, createdAt: { gte: pointStart, lte: pointEnd } },
        }),
      ])
    )
  );

  const trend: ActivityMetrics["trend"] = pointRanges.map(({ label }, idx) => ({
    label,
    tasksCompleted: trendResults[idx][0],
    meetings: trendResults[idx][1],
    contactsCreated: trendResults[idx][2],
  }));

  return {
    tasks: {
      total: tasksTotal,
      completed: tasksCompleted,
      overdue: tasksOverdue,
      pending: tasksPending,
      inProgress: tasksInProgress,
      completionRate,
      byStatus: tasksByStatusMap,
      byPriority: tasksByPriorityMap,
    },
    meetings: {
      total: meetingsCount,
      totalChange: meetingsChange,
    },
    trend,
  };
}

// ─── Advisor Metrics ───────────────────────────────────────────────────────────

async function getAdvisorMetrics(orgId: string, period: PeriodFilter): Promise<AdvisorMetrics> {
  const now = new Date();
  const { start, end } = getPeriodBounds(period, now);

  // Get all team members with their user info
  const teamMembers = await db.teamMember.findMany({
    where: { team: { organizationId: orgId } },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      team: {
        select: { id: true, name: true },
      },
    },
  });

  const userIds = teamMembers.map(m => m.user.id);

  // Batch query all stats in parallel (avoids N+1)
  const [contactsCounts, dealsStats, completedTasksCounts, dealsClosedCounts, goalStats] = await Promise.all([
    // Contact counts per user
    userIds.length > 0 ? db.contact.groupBy({
      by: ['assignedTo'],
      where: { organizationId: orgId, assignedTo: { in: userIds } },
      _count: { _all: true },
    }) : [],
    // Deal aggregates per user
    userIds.length > 0 ? db.deal.groupBy({
      by: ['assignedTo'],
      where: { organizationId: orgId, assignedTo: { in: userIds } },
      _count: { _all: true },
      _sum: { value: true },
    }) : [],
    // Completed tasks per user in period
    userIds.length > 0 ? db.task.groupBy({
      by: ['assignedTo'],
      where: { organizationId: orgId, assignedTo: { in: userIds }, status: 'completed', completedAt: { gte: start, lte: end } },
      _count: { _all: true },
    }) : [],
    // Deals closed in period
    userIds.length > 0 ? db.deal.groupBy({
      by: ['assignedTo'],
      where: { organizationId: orgId, assignedTo: { in: userIds }, updatedAt: { gte: start, lte: end } },
      _count: { _all: true },
    }) : [],
    // Goal attainment for team members
    userIds.length > 0 ? db.teamGoal.findMany({
      where: { team: { members: { some: { userId: { in: userIds } } } }, status: 'active' },
      select: { targetValue: true, currentValue: true, team: { include: { members: true } } },
    }) : [],
  ]);

  // Build lookup maps for O(1) access
  const contactsMap = Object.fromEntries(contactsCounts.map(c => [c.assignedTo, c._count._all]));
  const dealsMap = Object.fromEntries(dealsStats.map(d => [d.assignedTo, { count: d._count._all, value: d._sum?.value || 0 }]));
  const tasksMap = Object.fromEntries(completedTasksCounts.map(t => [t.assignedTo, t._count._all]));
  const closedMap = Object.fromEntries(dealsClosedCounts.map(d => [d.assignedTo, d._count._all]));

  // Calculate goal attainment per user
  const goalAttainmentMap: Record<string, number> = {};
  for (const goal of goalStats) {
    for (const member of goal.team.members) {
      if (!goalAttainmentMap[member.userId]) goalAttainmentMap[member.userId] = 0;
      if (goal.targetValue > 0) {
        goalAttainmentMap[member.userId] += (goal.currentValue / goal.targetValue) * 100;
      }
    }
  }
  // Average per user
  for (const userId of userIds) {
    const goalsForUser = goalStats.filter(g => g.team.members.some(m => m.userId === userId)).length;
    if (goalsForUser > 0 && goalAttainmentMap[userId]) {
      goalAttainmentMap[userId] = Math.round(goalAttainmentMap[userId] / goalsForUser);
    } else {
      goalAttainmentMap[userId] = 0;
    }
  }

  const advisors: AdvisorRanking[] = teamMembers.map(member => {
    const userId = member.user.id;
    const contactsCount = contactsMap[userId] || 0;
    const dealsData = dealsMap[userId] || { count: 0, value: 0 };
    const pipelineValue = dealsData.value;
    const dealsClosed = closedMap[userId] || 0;
    const completedTasks = tasksMap[userId] || 0;
    const goalAttainment = goalAttainmentMap[userId] || 0;

    const compositeScore = Math.round(
      (contactsCount * 0.1) + (pipelineValue * 0.0001) + (dealsClosed * 5) + (goalAttainment * 0.3)
    );

    return {
      advisorId: userId,
      advisorName: member.user.name || member.user.email,
      contacts: contactsCount,
      pipelineValue: Math.round(pipelineValue),
      dealsClosed,
      revenue: Math.round(pipelineValue),
      goalAttainment,
      tasksCompleted: completedTasks,
      compositeScore,
      rank: 0,
    };
  });

  // Sort and assign ranks
  advisors.sort((a, b) => b.compositeScore - a.compositeScore);
  advisors.forEach((a, idx) => {
    a.rank = idx + 1;
  });

  // Comparisons
  const bestPerformer = advisors[0] || null;
  const mostImproved = [...advisors].sort((a, b) => b.tasksCompleted - a.tasksCompleted)[0] || null;
  const needsAttention = [...advisors].sort((a, b) => a.goalAttainment - b.goalAttainment)[0] || null;

  return {
    rankings: advisors,
    comparisons: {
      bestPerformer: bestPerformer?.advisorId || "",
      bestPerformerName: bestPerformer?.advisorName || "",
      mostImproved: mostImproved?.advisorId || "",
      mostImprovedName: mostImproved?.advisorName || "",
      needsAttention: needsAttention?.advisorId || "",
      needsAttentionName: needsAttention?.advisorName || "",
    },
  };
}

// ─── Pipeline Metrics ──────────────────────────────────────────────────────────

async function getPipelineMetrics(orgId: string, period: PeriodFilter): Promise<PipelineMetrics> {
  const now = new Date();
  const { start, end } = getPeriodBounds(period, now);

  const stages = await db.pipelineStage.findMany({
    where: { organizationId: orgId },
    orderBy: { order: "asc" },
  });

  // FIX Q4: Use groupBy instead of include { deals } to avoid loading deal rows.
  // groupBy aggregates in the database, returning a single row per stageId instead of one row per deal.
  const stageIds = stages.map((s) => s.id);
  const stageDealsAgg = await db.deal.groupBy({
    by: ["stageId"],
    where: { organizationId: orgId, stageId: { in: stageIds } },
    _sum: { value: true },
    _count: true,
    _avg: { probability: true },
  });
  const dealsAggMap = new Map(stageDealsAgg.map((d) => [d.stageId, d]));

  const stageDistribution = stages.map((stage) => {
    const agg = dealsAggMap.get(stage.id);
    const count = agg?._count ?? 0;
    const value = agg?._sum?.value ?? 0;
    const avgProbability = agg?._avg?.probability ?? 50;

    return {
      stageId: stage.id,
      stageName: stage.name,
      color: stage.color,
      count,
      value,
      probability: Math.round(avgProbability),
    };
  });

  // Weighted pipeline = sum(value * probability/100)
  const weightedPipeline = stageDistribution.reduce(
    (sum, s) => sum + s.value * (s.probability / 100),
    0
  );

  // Velocity: avg days to close (based on deal createdAt to updatedAt)
  const closedDeals = await db.deal.findMany({
    where: { organizationId: orgId, updatedAt: { gte: start, lte: end } },
    select: { createdAt: true, updatedAt: true, value: true },
  });

  const avgDaysToClose =
    closedDeals.length > 0
      ? Math.round(
          closedDeals.reduce(
            (sum, d) => sum + differenceInDays(d.updatedAt, d.createdAt),
            0
          ) / closedDeals.length
        )
      : 0;

  // Revenue forecast
  const bestCase = stageDistribution.reduce((sum, s) => sum + s.value, 0);
  const mostLikely = weightedPipeline;
  const closedThisPeriod = closedDeals.reduce((sum, d) => sum + d.value, 0);

  // Monthly forecast (simplified)
  const byMonth: PipelineMetrics["revenueForecast"]["byMonth"] = [];
  for (let i = 0; i < 6; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    byMonth.push({
      month: format(monthDate, "MMM yyyy"),
      value: bestCase / 6,
      weightedValue: mostLikely / 6,
    });
  }

  return {
    stageDistribution,
    weightedPipeline: Math.round(weightedPipeline),
    velocityMetrics: {
      avgDaysToClose,
      avgDaysToCloseChange: 0,
      bottleneckStage: null,
    },
    revenueForecast: {
      bestCase: Math.round(bestCase),
      mostLikely: Math.round(mostLikely),
      closedThisPeriod: Math.round(closedThisPeriod),
      forecastVsTarget: null,
      byMonth,
    },
  };
}

// ─── Contacts Metrics ─────────────────────────────────────────────────────────

async function getContactsMetrics(orgId: string): Promise<ContactsMetrics> {
  const now = new Date();
  const staleThreshold = subDays(now, 14);

  // FIX 3: Removed unused `allContacts` query that loaded all contacts with full relations
  const [contactsStale, contactsUnassigned, atRiskContacts] = await Promise.all([
    db.contact.count({
      where: {
        organizationId: orgId,
        updatedAt: { lt: staleThreshold },
        pipelineStage: { name: { notIn: INACTIVE_STAGES } },
      },
    }),
    db.contact.count({ where: { organizationId: orgId, assignedTo: null } }),
    db.contact.findMany({
      where: {
        organizationId: orgId,
        pipelineStage: { name: { notIn: INACTIVE_STAGES } },
      },
      select: {
        id: true,
        name: true,
        updatedAt: true,
        assignedTo: true,
        leadScore: true,
        pipelineStage: { select: { name: true } },
        assignedUser: { select: { name: true, email: true } },
      },
      orderBy: { updatedAt: "asc" },
      take: 10,
    }),
  ]);

  // Compute risk score for at-risk contacts
  const highRiskContacts = atRiskContacts.map((contact) => {
    const daysSinceActivity = differenceInDays(now, contact.updatedAt);
    const unassigned = contact.assignedTo === null ? 20 : 0;
    const riskScore = daysSinceActivity * 2 + unassigned;

    return {
      id: contact.id,
      name: contact.name,
      daysSinceActivity,
      assignedTo: contact.assignedTo,
      assignedToName: contact.assignedUser?.name || contact.assignedUser?.email || null,
      riskScore,
      pipelineStage: contact.pipelineStage?.name || null,
      leadScore: contact.leadScore,
    };
  });

  // Sort by risk score descending
  highRiskContacts.sort((a, b) => b.riskScore - a.riskScore);

  // Segment summary
  const segmentGroups = await db.contact.groupBy({
    by: ["segment"],
    where: { organizationId: orgId, segment: { not: null } },
    _count: true,
    _avg: { leadScore: true },
  });

  const segmentSummary = await Promise.all(
    segmentGroups.map(async (seg) => ({
      segment: seg.segment || "Unknown",
      count: seg._count,
      value: 0,
      avgLeadScore: Math.round((seg._avg?.leadScore || 0) * 100) / 100,
    }))
  );

  // Source summary
  const sourceGroups = await db.contact.groupBy({
    by: ["source"],
    where: { organizationId: orgId, source: { not: null } },
    _count: true,
    _avg: { leadScore: true },
  });

  const sourceSummary = sourceGroups.map((src) => ({
    source: src.source || "Unknown",
    count: src._count,
    avgLeadScore: Math.round((src._avg?.leadScore || 0) * 100) / 100,
    conversionRate: null, // would need more complex query
  }));

  // New vs returning
  const thirtyDaysAgo = subDays(now, 30);
  const newContacts = await db.contact.count({
    where: { organizationId: orgId, createdAt: { gte: thirtyDaysAgo } },
  });
  const totalContactsCount = await db.contact.count({ where: { organizationId: orgId } });
  const returningContacts = Math.max(0, totalContactsCount - newContacts);
  const retentionRate =
    totalContactsCount > 0 ? Math.round((returningContacts / totalContactsCount) * 100) : 0;

  return {
    atRisk: {
      total: contactsStale + contactsUnassigned,
      stale: contactsStale,
      unassigned: contactsUnassigned,
      noFinancialPlan: 0,
      highRiskContacts: highRiskContacts.slice(0, 10),
    },
    bySegment: segmentSummary,
    bySource: sourceSummary,
    newVsReturning: {
      newContacts,
      returningContacts,
      retentionRate,
    },
  };
}

// ─── Trends Metrics ───────────────────────────────────────────────────────────

async function getTrendsMetrics(orgId: string, period: PeriodFilter): Promise<TrendsMetrics> {
  const now = new Date();
  const { start, end } = getPeriodBounds(period, now);
  const { start: prevStart, end: prevEnd } = getPreviousPeriodBounds(period, now);

  const interval = period === "week" ? 7 : period === "month" ? 30 : period === "quarter" ? 90 : 365;
  const numPoints = period === "week" ? 4 : period === "month" ? 4 : period === "quarter" ? 4 : 12;
  const stepMs = (interval / numPoints) * 24 * 60 * 60 * 1000;

  // Build all point ranges upfront to enable parallel queries
  const pointRanges = Array.from({ length: numPoints }, (_, i) => {
    const pointStart = new Date(start.getTime() - (numPoints - 1 - i) * stepMs);
    const pointEnd = new Date(pointStart.getTime() + stepMs - 1);
    const prevPointStart = new Date(prevStart.getTime() - (numPoints - 1 - i) * stepMs);
    const prevPointEnd = new Date(prevPointStart.getTime() - 1);
    return { label: `P${i + 1}`, pointStart, pointEnd, prevPointStart, prevPointEnd };
  });

  // Fetch all trend data in parallel
  const trendResults = await Promise.all(
    pointRanges.map(({ pointStart, pointEnd, prevPointStart, prevPointEnd }) =>
      Promise.all([
        db.contact.count({
          where: { organizationId: orgId, createdAt: { gte: pointStart, lte: pointEnd } },
        }),
        db.contact.count({
          where: { organizationId: orgId, createdAt: { gte: prevPointStart, lte: prevPointEnd } },
        }),
        db.deal.findMany({
          where: { organizationId: orgId, updatedAt: { gte: pointStart, lte: pointEnd } },
          select: { value: true, probability: true },
        }),
        db.task.count({
          where: { organizationId: orgId, status: "completed", completedAt: { gte: pointStart, lte: pointEnd } },
        }),
        db.calendarEvent.count({
          where: { organizationId: orgId, type: "meeting", startAt: { gte: pointStart, lte: pointEnd } },
        }),
      ])
    )
  );

  // Build response arrays from parallel results
  const contacts: TrendsMetrics["contacts"] = [];
  const revenue: TrendsMetrics["revenue"] = [];
  const activity: TrendsMetrics["activity"] = [];

  for (let i = 0; i < numPoints; i++) {
    const { label, pointStart, pointEnd } = pointRanges[i];
    const [contactsCreated, prevContactsCreated, dealsInPoint, tasksCompleted, meetingsInPoint] = trendResults[i];

    const valueInPoint = dealsInPoint.reduce((sum, d) => sum + d.value, 0);
    const weightedValueInPoint = dealsInPoint.reduce((sum, d) => sum + d.value * (d.probability / 100), 0);

    contacts.push({
      label,
      value: contactsCreated,
      cumulative: contactsCreated,
      previousValue: prevContactsCreated,
    });

    revenue.push({
      label,
      value: Math.round(valueInPoint),
      cumulative: Math.round(valueInPoint),
      previousValue: null,
    });

    activity.push({
      label,
      tasksCompleted,
      meetings: meetingsInPoint,
      contactsCreated: contactsCreated,
    });
  }

  // Comparison totals
  const totalContactsChange = contacts.reduce((sum, c) => sum + c.value, 0);
  const totalRevenueChange = revenue.reduce((sum, r) => sum + r.value, 0);
  const totalActivityChange = activity.reduce((sum, a) => sum + a.tasksCompleted, 0);

  return {
    contacts,
    revenue,
    activity,
    comparison: {
      contactsChange: pctChange(totalContactsChange, totalContactsChange), // would need prev period
      revenueChange: 0,
      activityChange: 0,
    },
  };
}

// ─── Cached Analytics Computation ───────────────────────────────────────────

async function computeReportsAnalytics(
  orgId: string,
  period: PeriodFilter
): Promise<Omit<ReportsAnalyticsResponse, "generatedAt">> {
  const [executive, funnel, leadScoring, goals, activity, advisor, pipeline, contacts, trends] =
    await Promise.all([
      getExecutiveMetrics(orgId, period),
      getFunnelMetrics(orgId, period),
      getLeadScoringMetrics(orgId),
      getGoalsMetrics(orgId, period),
      getActivityMetrics(orgId, period),
      getAdvisorMetrics(orgId, period),
      getPipelineMetrics(orgId, period),
      getContactsMetrics(orgId),
      getTrendsMetrics(orgId, period),
    ]);

  return { executive, funnel, leadScoring, goals, activity, advisor, pipeline, contacts, trends };
}

// Cache key includes orgId and period so different orgs/periods are cached separately.
// Cache tag enables targeted revalidation on data mutations.
async function getCachedReportsAnalytics(orgId: string, period: PeriodFilter) {
  return unstable_cache(
    (o: string, p: PeriodFilter) => computeReportsAnalytics(o, p),
    [`reports-analytics-${orgId}-${period}`],
    { tags: [`reports-analytics-${orgId}`], revalidate: 300 }
  )(orgId, period);
}

// ─── Main Route Handler ───────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const orgId = user.organizationId;

    const searchParams = await request.nextUrl.searchParams;
    const period = (searchParams.get("period") as PeriodFilter) || "month";
    const includeParam = searchParams.get("include") || "";

    const sectionsToInclude = includeParam
      ? includeParam.split(",").map((s) => s.trim())
      : [
          "executive",
          "funnel",
          "leadScoring",
          "goals",
          "activity",
          "advisor",
          "pipeline",
          "contacts",
          "trends",
        ];

    // FIX 3: Use unstable_cache so identical org+period requests hit the cache
    // instead of recomputing all 9 parallel metric queries on every request.
    const cached = await getCachedReportsAnalytics(orgId, period);

    const responseBody: ReportsAnalyticsResponse = {
      generatedAt: new Date().toISOString(),
      ...cached,
    };

    const response = NextResponse.json(responseBody);
    response.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    logger.error({ error }, "Failed to generate analytics report");
    return NextResponse.json(
      { error: "Failed to generate analytics report" },
      { status: 500 }
    );
  }
}
