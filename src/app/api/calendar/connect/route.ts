import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { calendarSyncEngine } from '@/lib/google-calendar/sync-engine';

// POST /api/calendar/connect — Trigger Google OAuth flow or re-sync if already connected
export async function POST(request: NextRequest) {
  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const googleAccount = await db.account.findFirst({
    where: { userId: user.id, provider: 'google' },
  });

  const membership = await db.member.findFirst({
    where: { userId: user.id },
  });

  // If already connected, trigger a re-sync instead of re-starting OAuth
  if (googleAccount && membership) {
    try {
      // Re-register webhook (in case it expired)
      await calendarSyncEngine.registerWebhook(user.id, 'primary');
      // Full re-sync
      const { synced } = await calendarSyncEngine.initialSync(user.id, membership.organizationId);
      return NextResponse.json({ success: true, action: 'resync', synced });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Re-sync failed' }, { status: 500 });
    }
  }

  // Not connected — redirect to Google OAuth
  const callbackUrl = encodeURIComponent('/settings/google-calendar?connected=1');
  return NextResponse.json({
    url: `/api/auth/signin/google?callbackUrl=${callbackUrl}`,
  });
}
