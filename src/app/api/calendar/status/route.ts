import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { google, calendar_v3 } from 'googleapis';
import { decryptTokenIfSet } from '@/lib/crypto';

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

async function getGoogleCalendars(accessToken: string, refreshToken?: string | null): Promise<calendar_v3.Schema$CalendarListEntry[]> {
  try {
    const calendar = createCalendarClient(accessToken, refreshToken);
    const res = await calendar.calendarList.list({ maxResults: 100 });
    return res.data.items ?? [];
  } catch (error) {
    console.error('[CalendarStatus] Failed to list calendars:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const googleAccount = await db.account.findFirst({
    where: { userId: user.id, provider: 'google' },
  });

  const syncState = await db.calendarSyncState.findFirst({
    where: { userId: user.id },
  });

  const membership = await db.member.findFirst({
    where: { userId: user.id },
  });

  let calendars: { id: string; name: string; selected: boolean }[] = [];
  let selectedCalendarIds: string[] = ['primary'];

  // If connected, fetch real calendar list from Google
  if (googleAccount?.access_token) {
    const accessToken = decryptTokenIfSet(googleAccount.access_token) ?? googleAccount.access_token;
    const refreshToken = googleAccount.refresh_token ?? undefined;
    const googleCalendars = await getGoogleCalendars(accessToken, refreshToken);

    calendars = googleCalendars.map((cal) => ({
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
  });
}
