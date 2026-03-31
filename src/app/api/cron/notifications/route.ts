import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { processOverdueTasks, processTasksDueSoon } from '@/lib/notifications';

/**
 * GET /api/cron/notifications
 *
 * Vercel Cron Job endpoint for processing task notifications.
 * Runs daily at 8:00 AM to notify users about overdue tasks and tasks due soon.
 *
 * Security: Verifies CRON_SECRET Bearer token in Authorization header.
 */
export async function GET(req: NextRequest) {
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
    // Get all organizations that have tasks with due dates
    const organizationsWithTasks = await db.task.findMany({
      where: {
        dueDate: { not: null },
        status: { notIn: ['completed', 'cancelled'] },
      },
      select: { organizationId: true },
      distinct: ['organizationId'],
    });

    const organizationIds = organizationsWithTasks.map(t => t.organizationId);

    let totalOverdueNotifications = 0;
    let totalDueSoonNotifications = 0;

    // Process notifications for each organization in batches
    const BATCH_SIZE = 10;
    for (let i = 0; i < organizationIds.length; i += BATCH_SIZE) {
      const batch = organizationIds.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (organizationId) => {
        try {
          const overdueResults = await processOverdueTasks(organizationId);
          const dueSoonResults = await processTasksDueSoon(organizationId);

          totalOverdueNotifications += Array.isArray(overdueResults) ? 0 : overdueResults.count;
          totalDueSoonNotifications += Array.isArray(dueSoonResults) ? 0 : dueSoonResults.count;
        } catch (error) {
          console.error(`Notification processing failed for org ${organizationId}:`, error);
        }
      }));
    }

    return NextResponse.json({
      ok: true,
      processed: new Date().toISOString(),
      results: {
        organizationsProcessed: organizationIds.length,
        overdueNotifications: totalOverdueNotifications,
        dueSoonNotifications: totalDueSoonNotifications,
      },
    });
  } catch (error) {
    console.error('Error processing notifications cron job:', error);
    return NextResponse.json(
      { error: 'Failed to process notifications', details: String(error) },
      { status: 500 }
    );
  }
}
