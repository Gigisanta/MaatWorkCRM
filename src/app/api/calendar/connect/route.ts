import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { db } from '@/lib/db/db';
import { calendarSyncEngine } from '@/lib/google-calendar/sync-engine';
import { logger } from '@/lib/db/logger';

// POST /api/calendar/connect — Trigger Google OAuth flow or re-sync if already connected
export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

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
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string | number; status?: string | number; response?: { data?: { error?: string; error_description?: string } } };
      const errorCode = err?.code || err?.status || '';
      const errorResponse = err?.response?.data;
      const googleError = errorResponse?.error || '';
      const googleErrorDescription = errorResponse?.error_description || '';

      // Check for specific Google OAuth error codes that indicate token issues
      const isTokenError =
        errorCode === 401 ||
        errorCode === 403 ||
        googleError === 'invalid_grant' ||
        googleError === 'token_revoked' ||
        googleError === 'access_denied' ||
        googleErrorDescription?.includes('token') ||
        err?.message?.includes('invalid_grant') ||
        err?.message?.includes('token_revoked') ||
        (errorCode === 400 && googleError === 'invalid_client');

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

      // Log the actual error for debugging
      logger.error({ operation: 'calendar:connect:resync', requestId, userId: user.id, error: err?.message, code: errorCode, googleError, googleErrorDescription }, 'Re-sync failed');

      return NextResponse.json({ error: err?.message || 'Re-sync failed' }, { status: 500 });
    }
  }

  // Not connected — redirect to Google OAuth
  const callbackUrl = encodeURIComponent('/calendar');
  return NextResponse.json({
    url: `/api/auth/signin/google?callbackUrl=${callbackUrl}`,
  });
}