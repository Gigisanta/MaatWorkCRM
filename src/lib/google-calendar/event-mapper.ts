import { calendar_v3 } from 'googleapis';
import { Prisma } from '@prisma/client';

// Default timezone — ideally per-user from DB Organization or User profile
const DEFAULT_TIMEZONE = 'UTC';

export function googleEventToLocal(
  googleEvent: calendar_v3.Schema$Event,
  userId: string,
  organizationId: string
): Partial<Prisma.CalendarEventCreateInput> {
  const start = googleEvent.start?.dateTime || googleEvent.start?.date;
  const end = googleEvent.end?.dateTime || googleEvent.end?.date;

  return {
    googleEventId: googleEvent.id || undefined,
    googleEtag: googleEvent.etag || undefined,
    title: googleEvent.summary || '(Sin título)',
    description: googleEvent.description || undefined,
    location: googleEvent.location || undefined,
    recurrenceRule: googleEvent.recurrence?.[0] || undefined,
    attendees: googleEvent.attendees ? JSON.stringify(googleEvent.attendees) : undefined,
    reminders: googleEvent.reminders ? JSON.stringify(googleEvent.reminders) : undefined,
    colorId: googleEvent.colorId || undefined,
    status: googleEvent.status || undefined,
    syncDirection: 'inbound',
    source: 'google',
    startAt: start ? new Date(start) : new Date(),
    endAt: end ? new Date(end) : new Date(),
    type: 'event',
  };
}

export function localEventToGoogle(
  localEvent: {
    title: string;
    description?: string | null;
    location?: string | null;
    startAt: Date;
    endAt: Date;
    recurrenceRule?: string | null;
    timeZone?: string;
  }
): calendar_v3.Schema$Event {
  const tz = localEvent.timeZone || DEFAULT_TIMEZONE;
  return {
    summary: localEvent.title,
    description: localEvent.description || undefined,
    location: localEvent.location || undefined,
    start: {
      dateTime: localEvent.startAt.toISOString(),
      timeZone: tz,
    },
    end: {
      dateTime: localEvent.endAt.toISOString(),
      timeZone: tz,
    },
    recurrence: localEvent.recurrenceRule ? [localEvent.recurrenceRule] : undefined,
  };
}
