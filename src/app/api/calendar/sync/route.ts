import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { calendarSyncEngine } from '@/lib/google-calendar/sync-engine';
import { db } from '@/lib/db/db';
import { logger } from '@/lib/db/logger';

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

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
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string | number; status?: string | number; response?: { data?: { error?: string; error_description?: string } } };
    // Log full error for server-side debugging
    logger.error({ operation: 'calendar:sync', requestId, userId: user.id, error: err?.message, code: err?.code, status: err?.status, googleError: err?.response?.data?.error, googleErrorDescription: err?.response?.data?.error_description }, 'Error details');

    const errorMessage = err?.message || 'Sync failed';
    const errorCode = err?.code || err?.status || '';
    const errorResponse = err?.response?.data;

    // Check for specific Google OAuth error codes that indicate token issues
    // These are from Google OAuth's error response format
    const googleError = errorResponse?.error || '';
    const googleErrorDescription = errorResponse?.error_description || '';

    // Token errors that require re-authentication:
    // - invalid_grant: refresh token is invalid, expired, or revoked
    // - token_revoked: token was revoked by user or Google
    // - 401/403 HTTP status codes indicate auth failure
    const isTokenError =
      errorCode === 401 ||
      errorCode === 403 ||
      googleError === 'invalid_grant' ||
      googleError === 'token_revoked' ||
      googleError === 'access_denied' ||
      googleErrorDescription?.includes('token') ||
      errorMessage.includes('invalid_grant') ||
      errorMessage.includes('token_revoked') ||
      (errorCode === 400 && googleError === 'invalid_client');

    if (isTokenError) {
      // Clear sync state so next sync starts fresh
      await db.calendarSyncState.updateMany({
        where: { userId: user.id },
        data: { syncStatus: 'idle', errorCount: 0, syncToken: null },
      });

      const callbackUrl = encodeURIComponent('/calendar');

      // Provide a more informative error message based on the actual error
      let userMessage = 'Google Calendar tokens expired. Please reconnect your account.';
      if (googleError === 'invalid_grant') {
        userMessage = 'La sesión de Google Calendar ha expirado. Por favor reconnecta tu cuenta.';
      } else if (googleError === 'token_revoked' || googleError === 'access_denied') {
        userMessage = 'Acceso a Google Calendar fue revocado. Por favor reconnecta tu cuenta.';
      } else if (googleError === 'invalid_client') {
        userMessage = 'Error de configuración de Google OAuth. Contacta al administrador.';
      }

      return NextResponse.json({
        needsReauth: true,
        error: userMessage,
        url: `/api/auth/signin/google?callbackUrl=${callbackUrl}`,
      }, { status: 401 });
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}