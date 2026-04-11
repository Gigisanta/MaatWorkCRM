import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { db } from '@/lib/db/db';
import { calendarSyncEngine } from '@/lib/google-calendar/sync-engine';
import { logger } from '@/lib/db/logger';

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.info({ operation: 'calendar:disconnect', requestId, userId: user.id }, 'User disconnecting Google Calendar');

  // Unregister webhook from Google and mark inactive in DB
  try {
    await calendarSyncEngine.unregisterWebhook(user.id, 'primary');
  } catch (err) {
    logger.warn({ operation: 'calendar:disconnect:webhook', userId: user.id, error: err instanceof Error ? err.message : String(err) }, 'Failed to unregister webhook');
  }

  // Delete sync state and webhook records
  await db.calendarSyncState.deleteMany({ where: { userId: user.id } });
  await db.calendarWebhook.deleteMany({ where: { userId: user.id } });

  // Unlink Google account entirely
  await db.account.deleteMany({
    where: { userId: user.id, provider: 'google' },
  });

  logger.info({ operation: 'calendar:disconnect', requestId, userId: user.id }, 'User disconnected successfully');

  return NextResponse.json({ success: true });
}