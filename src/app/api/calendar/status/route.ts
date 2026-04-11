import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { google, calendar_v3 } from 'googleapis';
import { decryptTokenIfSet } from '@/lib/utils/crypto';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { logger } from '@/lib/db/logger';

function createCalendarClient(accessToken: string, refreshToken?: string | null): calendar_v3.Calendar {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + '/api/auth/callback/google'
  );
  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken ? decryptTokenIfSet(refreshToken) ?? undefined : undefined,
  });
  return google.calendar({ version: 'v3', auth });
}

async function getGoogleCalendars(accessToken: string, refreshToken?: string | null): Promise<{ calendars: calendar_v3.Schema$CalendarListEntry[]; error?: string; isAuthError?: boolean }> {
  try {
    const calendar = createCalendarClient(accessToken, refreshToken);
    const res = await calendar.calendarList.list({ maxResults: 100 });
    return { calendars: res.data.items ?? [] };
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string | number; status?: string | number; response?: { data?: { error?: string; error_description?: string } } };
    const errorMessage = err?.message || 'Unknown error';
    const errorCode = err?.code || err?.status || '';
    const errorResponse = err?.response?.data;
    const googleError = errorResponse?.error || '';
    const googleErrorDescription = errorResponse?.error_description || '';

    // Check for auth errors (401 = invalid/expired tokens)
    const isAuthError =
      errorCode === 401 ||
      err?.status === 401 ||
      googleError === 'invalid_grant' ||
      googleError === 'token_revoked' ||
      googleErrorDescription?.includes('Invalid OAuth 2.0') ||
      errorMessage?.includes('invalid_grant') ||
      errorMessage?.includes('Credentials');

    if (isAuthError) {
      logger.warn({ operation: 'calendar:status:auth', error: errorMessage, code: errorCode, googleError, googleErrorDescription }, 'Google auth error (401)');
      return {
        calendars: [],
        error: 'Sesión de Google Calendar expirada. Por favor reconnecta tu cuenta.',
        isAuthError: true,
      };
    }

    logger.error({ operation: 'calendar:status:list', error: errorMessage, code: errorCode, googleError, googleErrorDescription }, 'Failed to list calendars');

    const errorStr = typeof googleErrorDescription === 'string' && googleErrorDescription
      ? googleErrorDescription
      : typeof googleError === 'string' && googleError
        ? googleError
        : errorMessage;
    return {
      calendars: [],
      error: errorStr,
    };
  }
}

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  const user = await getUserFromSession(request);
  if (!user) {
    logger.debug({ operation: 'calendar:status', requestId }, 'No user from session - returning 401');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.debug({ operation: 'calendar:status', requestId, userId: user.id }, 'User authenticated');

  const googleAccount = await db.account.findFirst({
    where: { userId: user.id, provider: 'google' },
  });

  const syncState = await db.calendarSyncState.findFirst({
    where: { userId: user.id },
  });

  let selectedCalendarIds: string[] = ['primary'];
  if (syncState?.selectedCalendarIds) {
    try {
      const parsed = JSON.parse(syncState.selectedCalendarIds);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
        selectedCalendarIds = parsed as string[];
      }
    } catch { /* keep default ['primary'] */ }
  }

  let calendarError: string | undefined;
  let calendars: { id: string; name: string; selected: boolean }[] = [];

  // If connected, fetch real calendar list from Google
  if (googleAccount?.access_token) {
    const accessToken = decryptTokenIfSet(googleAccount.access_token) ?? googleAccount.access_token;
    const refreshToken = googleAccount.refresh_token ?? undefined;
    const result = await getGoogleCalendars(accessToken, refreshToken);
    calendarError = result.error;

    // If Google returned a 401, auth tokens are bad — user needs to reconnect
    if (result.error && (result.error.includes('Invalid OAuth 2.0') || result.error.includes('401') || result.error.includes('invalid credentials'))) {
      calendarError = result.error;
    }

    calendars = result.calendars.map((cal) => ({
      id: cal.id ?? 'primary',
      name: cal.summary ?? cal.id ?? 'Unknown',
      selected: (selectedCalendarIds).includes(cal.id ?? 'primary'),
    }));
  }

  return NextResponse.json({
    connected: !!googleAccount,
    email: googleAccount?.providerAccountId ?? null,
    syncStatus: syncState?.syncStatus ?? 'idle',
    lastSyncedAt: syncState?.lastSyncedAt ?? null,
    errorCount: syncState?.errorCount ?? 0,
    calendars,
    selectedCalendarIds,
    error: calendarError,
    needsReauth: !!calendarError && (calendarError.includes('Invalid OAuth 2.0') || calendarError.includes('invalid credentials') || calendarError.includes('expirada') || calendarError.includes('expired')),
  });
}