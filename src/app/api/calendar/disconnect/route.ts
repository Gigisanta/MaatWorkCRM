import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { calendarSyncEngine } from '@/lib/google-calendar/sync-engine';

export async function POST(request: NextRequest) {
  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log(`[CalendarDisconnect] User ${user.id} disconnecting Google Calendar`);

  // Unregister webhook from Google and mark inactive in DB
  try {
    await calendarSyncEngine.unregisterWebhook(user.id, 'primary');
  } catch (err) {
    console.warn('[CalendarDisconnect] Failed to unregister webhook:', (err as Error).message);
  }

  // Delete sync state and webhook records
  await db.calendarSyncState.deleteMany({ where: { userId: user.id } });
  await db.calendarWebhook.deleteMany({ where: { userId: user.id } });

  // Unlink Google account entirely
  await db.account.deleteMany({
    where: { userId: user.id, providerId: 'google' },
  });

  console.log(`[CalendarDisconnect] User ${user.id} disconnected successfully`);

  return NextResponse.json({ success: true });
}
