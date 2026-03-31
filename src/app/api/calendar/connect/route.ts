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
      // If tokens are expired/invalid, redirect to OAuth to get fresh tokens
      const errorMessage = error?.message || '';
      const isTokenError =
        errorMessage.includes('Token') ||
        errorMessage.includes('invalid') ||
        errorMessage.includes('expired') ||
        errorMessage.includes('401') ||
        errorMessage.includes('403');

      if (isTokenError) {
        // Clear sync state so next sync starts fresh
        await db.calendarSyncState.updateMany({
          where: { userId: user.id },
          data: { syncStatus: 'idle', errorCount: 0, syncToken: null },
        });

        const callbackUrl = encodeURIComponent('/calendar');
        return NextResponse.json({
          needsReauth: true,
          url: `/api/auth/signin/google?callbackUrl=${callbackUrl}`,
        });
      }

      return NextResponse.json({ error: errorMessage || 'Re-sync failed' }, { status: 500 });
    }
  }

  // Not connected — redirect to Google OAuth
  const callbackUrl = encodeURIComponent('/calendar');
  return NextResponse.json({
    url: `/api/auth/signin/google?callbackUrl=${callbackUrl}`,
  });
}
