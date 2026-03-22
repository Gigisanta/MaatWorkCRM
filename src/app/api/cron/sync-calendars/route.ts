import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calendarSyncEngine } from '@/lib/google-calendar/sync-engine';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all users with Google accounts and active sync
    const syncStates = await db.calendarSyncState.findMany({
      where: {
        syncStatus: { in: ['idle', 'error'] },
      },
      include: {
        user: {
          select: {
            id: true,
            members: {
              select: { organizationId: true },
            },
          },
        },
      },
    });

    const results = [];

    const BATCH_SIZE = 5;
    for (let i = 0; i < syncStates.length; i += BATCH_SIZE) {
      const batch = syncStates.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(async (syncState) => {
        try {
          const membership = syncState.user.members[0];
          if (!membership) return { userId: syncState.userId, status: 'skipped' };

          // Only retry error states after some time
          if (syncState.syncStatus === 'error' && syncState.errorCount > 5) {
            return { userId: syncState.userId, status: 'skipped' };
          }

          await calendarSyncEngine.deltaSync(
            syncState.userId,
            membership.organizationId,
            syncState.calendarId
          );

          return { userId: syncState.userId, status: 'success' };
        } catch (error: any) {
          // Increment error count
          await db.calendarSyncState.update({
            where: { id: syncState.id },
            data: { errorCount: { increment: 1 }, syncStatus: 'error' },
          });
          return { userId: syncState.userId, status: 'error', message: error.message };
        }
      }));
      results.push(...batchResults);
    }

    return NextResponse.json({
      processed: results.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Calendar sync cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
