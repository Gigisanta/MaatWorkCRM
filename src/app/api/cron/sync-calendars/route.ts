import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calendarSyncEngine } from '@/lib/google-calendar/sync-engine';

export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Solo usuarios con sync activo y tokens de Google válidos
    const syncStates = await db.calendarSyncState.findMany({
      where: {
        syncStatus: { in: ['idle', 'error'] },
        // Skip error states con muchos errores (>5 en 24h)
        errorCount: { lt: 6 },
      },
      include: {
        user: {
          include: {
            accounts: {
              where: { providerId: 'google' },
              select: { access_token: true },
            },
            members: {
              select: { organizationId: true },
            },
          },
        },
      },
    });

    // Filter: solo usuarios con cuenta Google real
    const activeSyncs = syncStates.filter(
      (s) => s.user.accounts.length > 0 && s.user.members.length > 0
    );

    if (activeSyncs.length === 0) {
      return NextResponse.json({ processed: 0, results: [], timestamp: new Date().toISOString() });
    }

    const results = [];
    const BATCH_SIZE = 3; // Más pequeño = menos presión en BD

    for (let i = 0; i < activeSyncs.length; i += BATCH_SIZE) {
      const batch = activeSyncs.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map(async (syncState) => {
          const membership = syncState.user.members[0];
          if (!membership) return { userId: syncState.userId, status: 'skipped' };

          const { synced } = await calendarSyncEngine.deltaSync(
            syncState.userId,
            membership.organizationId,
            syncState.calendarId
          );

          return { userId: syncState.userId, status: 'success', synced };
        })
      );

      for (const result of batchResults) {
        if (result.status === 'rejected') {
          results.push({ status: 'error', message: result.reason?.message });
        } else {
          results.push(result.value);
        }
      }
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
