import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth/auth-helpers";
import { db } from "@/lib/db/db";
import { cacheGet, cacheSet } from "@/lib/db/redis";

export async function GET(request: Request) {
  const session = await getUserFromSession(request as any);
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = session.organizationId;
  if (!organizationId) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const cacheKey = `dashboard:stats:${organizationId}`;

  // Cache-aside: try cache first
  const cached = await cacheGet<Record<string, unknown>>(cacheKey);
  if (cached) {
    const response = NextResponse.json(cached);
    response.headers.set("X-Cache", "HIT");
    return response;
  }

  // Fecha de hace 30 días para calcular trend
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Single parallel query with aggregations
  const [
    dealsResult,
    contactsCount,
    tasksCount,
    teamsResult,
    goalsResult,
    prevContactsCount,
  ] = await Promise.all([
    // Deals - get aggregate value only
    db.deal.aggregate({
      where: { organizationId },
      _count: true,
      _sum: { value: true },
    }),
    // Contacts count
    db.contact.count({ where: { organizationId } }),
    // Tasks - pending count
    db.task.count({
      where: {
        organizationId,
        status: { notIn: ["completed", "cancelled"] },
      },
    }),
    // Teams with active goals
    db.team.findMany({
      where: { organizationId },
      select: {
        _count: { select: { members: true } },
        goals: {
          where: { status: "active" },
          select: { targetValue: true, currentValue: true },
        },
      },
    }),
    // Active goals for avg calculation
    db.teamGoal.findMany({
      where: {
        team: { organizationId },
        status: "active",
      },
      select: { targetValue: true, currentValue: true },
    }),
    // Contacts that existed 30 days ago (created before that date)
    db.contact.count({
      where: {
        organizationId,
        createdAt: { lt: thirtyDaysAgo },
      },
    }),
  ]);

  const activeDealsCount = dealsResult._count || 0;
  const pipelineValue = dealsResult._sum?.value || 0;
  const activeContacts = contactsCount;
  const pendingTasks = tasksCount;
  const teamsCount = teamsResult.length;

  // Calculate average goal progress
  const totalProgress = goalsResult.reduce(
    (sum, g) => sum + (g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0),
    0
  );
  const avgGoalProgress = goalsResult.length > 0
    ? Math.round(totalProgress / goalsResult.length)
    : 0;

  // Calcular trend de contactos: % cambio vs mes anterior
  const contactsTrend = prevContactsCount > 0
    ? Math.round(((activeContacts - prevContactsCount) / prevContactsCount) * 100)
    : null;

  const stats = {
    pipelineValue,
    activeDealsCount,
    activeContacts,
    pendingTasks,
    avgGoalProgress,
    teamsCount,
    contactsTrend,
  };

  // Cache for 5 minutes
  await cacheSet(cacheKey, stats, 300);

  const response = NextResponse.json(stats);
  response.headers.set("X-Cache", "MISS");
  return response;
}
