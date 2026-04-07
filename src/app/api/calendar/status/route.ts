import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { google, calendar_v3 } from 'googleapis';
import { decryptTokenIfSet } from '@/lib/crypto';
import { getUserFromSession } from '@/lib/auth-helpers';

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

async function getGoogleCalendars(accessToken: string, refreshToken?: string | null): Promise<{ calendars: calendar_v3.Schema$CalendarListEntry[]; error?: string }> {
  try {
    const calendar = createCalendarClient(accessToken, refreshToken);
    const res = await calendar.calendarList.list({ maxResults: 100 });
    return { calendars: res.data.items ?? [] };
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    const errorCode = error?.code || error?.status || '';
    const errorResponse = error?.response?.data;
    const googleError = errorResponse?.error || '';
    const googleErrorDescription = errorResponse?.error_description || '';

    console.error('[CalendarStatus] Failed to list calendars:', {
      message: errorMessage,
      code: errorCode,
      googleError,
      googleErrorDescription,
    });

    // Return error info so the API can report it properly
    // Ensure error is always a string, not an object
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
  const user = await getUserFromSession(request);
  if (!user) {
    console.log('[CalendarStatus] No user from session - returning 401');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[CalendarStatus] User authenticated:', user.email);

  const googleAccount = await db.account.findFirst({
    where: { userId: user.id, provider: 'google' },
  });

  const syncState = await db.calendarSyncState.findFirst({
    where: { userId: user.id },
  });

  let calendars: { id: string; name: string; selected: boolean }[] = [];
  let selectedCalendarIds: string[] = ['primary'];

  let calendarError: string | undefined;

  // If connected, fetch real calendar list from Google
  if (googleAccount?.access_token) {
    const accessToken = decryptTokenIfSet(googleAccount.access_token) ?? googleAccount.access_token;
    const refreshToken = googleAccount.refresh_token ?? undefined;
    const result = await getGoogleCalendars(accessToken, refreshToken);
    calendarError = result.error;

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
  });
}
