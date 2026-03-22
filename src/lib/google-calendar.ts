import googleapis from 'googleapis';
import { calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { db } from '@/lib/db';
import { decryptTokenIfSet } from '@/lib/crypto';

export function createCalendarClient(accessToken: string, refreshToken?: string | null): OAuth2Client {
  const client = new googleapis.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + '/api/auth/callback/google'
  );
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken ? decryptTokenIfSet(refreshToken) : undefined,
  });
  return client;
}

export async function getUserGoogleTokens(userId: string): Promise<{ accessToken: string; refreshToken?: string } | null> {
  const account = await db.account.findFirst({
    where: { userId, providerId: 'google' },
  });
  if (!account || !account.access_token) return null;

  return {
    accessToken: decryptTokenIfSet(account.access_token) || account.access_token,
    refreshToken: account.refresh_token ?? undefined,
  };
}

export async function listEvents(
  userId: string,
  options: { timeMin?: string; timeMax?: string; calendarId?: string } = {}
): Promise<calendar_v3.Schema$Event[]> {
  const tokens = await getUserGoogleTokens(userId);
  if (!tokens) throw new Error('Google account not connected');

  const auth = createCalendarClient(tokens.accessToken, tokens.refreshToken);
  const calendar = googleapis.calendar({ version: 'v3', auth });
  const calendarId = options.calendarId || 'primary';

  const response = await calendar.events.list({
    calendarId,
    timeMin: options.timeMin,
    timeMax: options.timeMax,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250,
  });

  return response.data.items || [];
}

export async function createEvent(
  userId: string,
  event: calendar_v3.Schema$Event,
  calendarId = 'primary'
): Promise<calendar_v3.Schema$Event> {
  const tokens = await getUserGoogleTokens(userId);
  if (!tokens) throw new Error('Google account not connected');

  const auth = createCalendarClient(tokens.accessToken, tokens.refreshToken);
  const calendar = googleapis.calendar({ version: 'v3', auth });

  const response = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });

  return response.data;
}

export async function updateEvent(
  userId: string,
  eventId: string,
  event: calendar_v3.Schema$Event,
  calendarId = 'primary'
): Promise<calendar_v3.Schema$Event> {
  const tokens = await getUserGoogleTokens(userId);
  if (!tokens) throw new Error('Google account not connected');

  const auth = createCalendarClient(tokens.accessToken, tokens.refreshToken);
  const calendar = googleapis.calendar({ version: 'v3', auth });

  const response = await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: event,
  });

  return response.data;
}

export async function deleteEvent(
  userId: string,
  eventId: string,
  calendarId = 'primary'
): Promise<void> {
  const tokens = await getUserGoogleTokens(userId);
  if (!tokens) throw new Error('Google account not connected');

  const auth = createCalendarClient(tokens.accessToken, tokens.refreshToken);
  const calendar = googleapis.calendar({ version: 'v3', auth });

  await calendar.events.delete({ calendarId, eventId });
}
