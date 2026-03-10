// ============================================================
// MaatWork CRM — Google Calendar API Functions
// ============================================================

import { and, eq } from "drizzle-orm";
import { type calendar_v3, google } from "googleapis";
import { db } from "../../db";
import { accounts } from "../../db/schema/auth";

/**
 * Creates an authenticated OAuth2 client for Google API calls
 * Uses the user's stored access and refresh tokens
 */
async function getOAuth2Client(userId: string) {
  const account = await db.query.accounts.findFirst({
    where: and(eq(accounts.userId, userId), eq(accounts.providerId, "google")),
  });

  if (!account?.accessToken || !account?.refreshToken) {
    throw new Error("Google account not linked. Please sign in with Google first.");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`,
  );

  oauth2Client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
  });

  return oauth2Client;
}

/**
 * Fetches events from the user's primary Google Calendar
 */
export async function getGoogleCalendarEvents(
  userId: string,
  timeMin?: string,
  timeMax?: string,
): Promise<calendar_v3.Schema$Event[]> {
  const oauth2Client = await getOAuth2Client(userId);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: timeMin || new Date().toISOString(),
    timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items || [];
}

/**
 * Creates a new event in the user's primary Google Calendar
 */
export async function createGoogleCalendarEvent(
  userId: string,
  event: {
    summary: string;
    description?: string;
    start: string;
    end: string;
    location?: string;
  },
): Promise<calendar_v3.Schema$Event> {
  const oauth2Client = await getOAuth2Client(userId);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: { dateTime: event.start, timeZone: "UTC" },
      end: { dateTime: event.end, timeZone: "UTC" },
    },
  });

  return response.data;
}

/**
 * Updates an existing event in Google Calendar
 */
export async function updateGoogleCalendarEvent(
  userId: string,
  eventId: string,
  event: {
    summary?: string;
    description?: string;
    start?: string;
    end?: string;
    location?: string;
  },
): Promise<calendar_v3.Schema$Event> {
  const oauth2Client = await getOAuth2Client(userId);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const requestBody: calendar_v3.Schema$Event = {};

  if (event.summary) requestBody.summary = event.summary;
  if (event.description) requestBody.description = event.description;
  if (event.location) requestBody.location = event.location;
  if (event.start) requestBody.start = { dateTime: event.start, timeZone: "UTC" };
  if (event.end) requestBody.end = { dateTime: event.end, timeZone: "UTC" };

  const response = await calendar.events.patch({
    calendarId: "primary",
    eventId,
    requestBody,
  });

  return response.data;
}

/**
 * Deletes an event from Google Calendar
 */
export async function deleteGoogleCalendarEvent(userId: string, eventId: string): Promise<void> {
  const oauth2Client = await getOAuth2Client(userId);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  await calendar.events.delete({
    calendarId: "primary",
    eventId,
  });
}

/**
 * Gets a single event by ID from Google Calendar
 */
export async function getGoogleCalendarEvent(
  userId: string,
  eventId: string,
): Promise<calendar_v3.Schema$Event | null> {
  const oauth2Client = await getOAuth2Client(userId);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    const response = await calendar.events.get({
      calendarId: "primary",
      eventId,
    });
    return response.data;
  } catch (error) {
    if ((error as any)?.code === 404) {
      return null;
    }
    throw error;
  }
}
