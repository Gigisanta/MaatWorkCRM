import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getUserFromSession(request as any);
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = session.organizationId;
  if (!organizationId) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  // Single parallel query with aggregations
  const [
    dealsResult,
    contactsCount,
    tasksCount,
    teamsResult,
    goalsResult,
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
  ]);

  const activeDealsCount = dealsResult._count || 0;
  const pipelineValue = dealsResult._sum?.value || 0;
  const activeContacts = contactsCount;
  const pendingTasks = tasksCount;

  // Calculate average goal progress
  const totalProgress = goalsResult.reduce(
    (sum, g) => sum + (g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0),
    0
  );
  const avgGoalProgress = goalsResult.length > 0
    ? Math.round(totalProgress / goalsResult.length)
    : 0;

  const response = NextResponse.json({
    pipelineValue,
    activeDealsCount,
    activeContacts,
    pendingTasks,
    avgGoalProgress,
  });
  response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  return response;
}
