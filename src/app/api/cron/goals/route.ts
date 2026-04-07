import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  notifyGoalBehindSchedule,
  notifyGoalCompleted,
  createNotificationForUsers,
} from '@/lib/notifications';
import { calculateGoalHealth } from '@/lib/goal-health';

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
    console.error('CRON_SECRET environment variable is not set');
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

    let teamGoalsProcessed = 0;
    let atRiskNotifications = 0;
    let offTrackNotifications = 0;
    let completedNotifications = 0;

    for (const goal of teamGoals) {
      teamGoalsProcessed++;

      const health = calculateGoalHealth({
        startDate: goal.startDate,
        endDate: goal.endDate,
        currentValue: goal.currentValue,
        targetValue: goal.targetValue,
      });

      // Check if goal is completed
      if (goal.currentValue >= goal.targetValue) {
        // Only notify if not already completed
        if (goal.status !== 'completed') {
          await notifyGoalCompleted({
            goalId: goal.id,
            goalTitle: goal.title,
            teamId: goal.teamId,
            organizationId: goal.team.organizationId,
          });
          completedNotifications++;

          // Update goal status to completed
          await db.teamGoal.update({
            where: { id: goal.id },
            data: { status: 'completed' },
          });
        }
        continue;
      }

      // Calculate expected vs actual progress for at-risk/off-track detection
      const startDate = goal.startDate || today;
      const endDate = goal.endDate!;
      const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const daysElapsed = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

      if (totalDays <= 0 || daysElapsed < 0) {
        continue;
      }

      const expectedProgress = (daysElapsed / totalDays) * 100;
      const actualProgress = (goal.currentValue / goal.targetValue) * 100;

      // Thresholds for notification (same as task description)
      // at-risk: expected > actual + 10%
      // off-track: expected > actual + 25%
      const isAtRisk = expectedProgress > actualProgress + 10;
      const isOffTrack = expectedProgress > actualProgress + 25;

      if (isOffTrack) {
        // Check for existing off-track notification (within last 24h)
        const existingNotification = await db.notification.findFirst({
          where: {
            type: 'warning',
            title: 'Objetivo fuera de trayectoria',
            actionUrl: `/teams?team=${goal.teamId}`,
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        });

        if (!existingNotification) {
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
        // Check for existing at-risk notification (within last 24h)
        const existingNotification = await db.notification.findFirst({
          where: {
            type: 'warning',
            title: 'Objetivo en riesgo',
            actionUrl: `/teams?team=${goal.teamId}`,
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        });

        if (!existingNotification) {
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

    console.log(`[Cron:goals] Processed ${teamGoalsProcessed} team goals`, {
      atRiskNotifications,
      offTrackNotifications,
      completedNotifications,
    });

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
    console.error('Error processing goals cron job:', error);
    return NextResponse.json(
      { error: 'Failed to process goals cron job', details: String(error) },
      { status: 500 }
    );
  }
}
