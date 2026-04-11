import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import {
  notifyGoalBehindSchedule,
  notifyGoalCompleted,
  createNotificationForUsers,
} from '@/lib/services/notifications';
import { calculateGoalHealth } from '@/lib/services/goal-health';
import { logger } from '@/lib/db/logger';

/**
 * GET /api/cron/goals
 *
 * Vercel Cron Job endpoint for processing goal health notifications.
 * Runs daily to check goal progress and notify teams about at-risk/off-track goals.
 *
 * Security: Verifies CRON_SECRET Bearer token in Authorization header.
 */
export async function GET(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  // Verify CRON_SECRET for security (Vercel Cron sends Bearer token in Authorization header)
  const authHeader = req.headers.get('authorization');
  const cronSecret = authHeader?.replace('Bearer ', '');

  if (!process.env.CRON_SECRET) {
    logger.error({ operation: 'cron:goals', requestId }, 'CRON_SECRET environment variable is not set');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // ========================================
    // Process TeamGoals
    // ========================================
    const teamGoals = await db.teamGoal.findMany({
      where: {
        status: 'active',
        endDate: { not: null },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            organizationId: true,
            members: {
              select: { userId: true },
            },
          },
        },
      },
    });

    // Pre-fetch ALL warning notifications from the last 24h in one query (avoids N+1)
    const recentWarningCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentWarnings = await db.notification.findMany({
      where: {
        type: 'warning',
        title: { in: ['Objetivo fuera de trayectoria', 'Objetivo en riesgo'] },
        createdAt: { gte: recentWarningCutoff },
      },
      select: { title: true, actionUrl: true },
    });

    // Build a Set of "{title}|{actionUrl}" for O(1) lookup
    const sentWarnings = new Set(
      recentWarnings.map(n => `${n.title}|${n.actionUrl}`)
    );

    let teamGoalsProcessed = 0;
    let atRiskNotifications = 0;
    let offTrackNotifications = 0;
    let completedNotifications = 0;

    for (const goal of teamGoals) {
      teamGoalsProcessed++;

      // Check if goal is completed
      if (goal.currentValue >= goal.targetValue) {
        if (goal.status !== 'completed') {
          await notifyGoalCompleted({
            goalId: goal.id,
            goalTitle: goal.title,
            teamId: goal.teamId,
            organizationId: goal.team.organizationId,
          });
          completedNotifications++;
          await db.teamGoal.update({
            where: { id: goal.id },
            data: { status: 'completed' },
          });
        }
        continue;
      }

      const startDate = goal.startDate || today;
      const endDate = goal.endDate!;
      const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const daysElapsed = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

      if (totalDays <= 0 || daysElapsed < 0) {
        continue;
      }

      const expectedProgress = (daysElapsed / totalDays) * 100;
      const actualProgress = (goal.currentValue / goal.targetValue) * 100;
      const isAtRisk = expectedProgress > actualProgress + 10;
      const isOffTrack = expectedProgress > actualProgress + 25;

      if (isOffTrack) {
        // O(1) lookup in pre-fetched notification set
        const warningKey = `Objetivo fuera de trayectoria|/teams?team=${goal.teamId}`;
        if (!sentWarnings.has(warningKey)) {
          const userIds = goal.team.members.map(m => m.userId);
          await createNotificationForUsers(userIds, {
            organizationId: goal.team.organizationId,
            type: 'warning',
            title: 'Objetivo fuera de trayectoria',
            message: `El objetivo "${goal.title}" está significativamente por debajo del progreso esperado`,
            actionUrl: `/teams?team=${goal.teamId}`,
          });
          offTrackNotifications++;
        }
      } else if (isAtRisk) {
        const warningKey = `Objetivo en riesgo|/teams?team=${goal.teamId}`;
        if (!sentWarnings.has(warningKey)) {
          await notifyGoalBehindSchedule({
            goalId: goal.id,
            goalTitle: goal.title,
            progress: Math.round(actualProgress),
            teamId: goal.teamId,
            organizationId: goal.team.organizationId,
          });
          atRiskNotifications++;
        }
      }
    }

    logger.info({
      operation: 'cron:goals',
      requestId,
      teamGoalsProcessed,
      atRiskNotifications,
      offTrackNotifications,
      completedNotifications,
    }, `Processed ${teamGoalsProcessed} team goals`);

    return NextResponse.json({
      ok: true,
      processed: new Date().toISOString(),
      results: {
        teamGoalsProcessed,
        atRiskNotifications,
        offTrackNotifications,
        completedNotifications,
      },
    });
  } catch (error) {
    logger.error({ operation: 'cron:goals', requestId, error: error instanceof Error ? error.message : String(error) }, 'Error processing goals cron job');
    return NextResponse.json(
      { error: 'Failed to process goals cron job', details: String(error) },
      { status: 500 }
    );
  }
}
