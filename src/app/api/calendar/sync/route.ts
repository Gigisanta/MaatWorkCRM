import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth-helpers';
import { calendarSyncEngine } from '@/lib/google-calendar/sync-engine';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { action = 'delta' } = await request.json().catch(() => ({}));

  // Get user's organization
  const membership = await db.member.findFirst({
    where: { userId: user.id },
  });

  if (!membership) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 });
  }

  try {
    if (action === 'full') {
      const { synced } = await calendarSyncEngine.initialSync(user.id, membership.organizationId);
      return NextResponse.json({ success: true, action, synced });
    } else {
      const { synced, direction } = await calendarSyncEngine.deltaSync(user.id, membership.organizationId);
      return NextResponse.json({ success: true, action, synced, direction });
    }
  } catch (error: any) {
    const errorMessage = error?.message || 'Sync failed';
    const errorCode = error?.code || error?.status || '';

    // Token errors (401, 403) mean tokens are expired/invalid
    const isTokenError =
      errorCode === 401 ||
      errorCode === 403 ||
      errorMessage.includes('Token') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('expired') ||
      errorMessage.includes(' unauthorized') ||
      errorMessage.includes('Daily Limit Exceeded');

    if (isTokenError) {
      // Clear sync state so next sync starts fresh
      await db.calendarSyncState.updateMany({
        where: { userId: user.id },
        data: { syncStatus: 'idle', errorCount: 0, syncToken: null },
      });

      const callbackUrl = encodeURIComponent('/calendar');
      return NextResponse.json({
        needsReauth: true,
        error: 'Google Calendar tokens expired. Please reconnect your account.',
        url: `/api/auth/signin/google?callbackUrl=${callbackUrl}`,
      }, { status: 401 });
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
