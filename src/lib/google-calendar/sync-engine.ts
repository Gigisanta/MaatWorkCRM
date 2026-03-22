import { calendar_v3 as gcal } from 'googleapis';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { decryptTokenIfSet } from '@/lib/crypto';
import { localEventToGoogle } from './event-mapper';

// ─── OAuth Client ────────────────────────────────────────────────

function createCalendarClient(accessToken: string, refreshToken?: string | null): OAuth2Client {
  const client = new google.auth.OAuth2(
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

async function getUserTokens(userId: string) {
  const account = await db.account.findFirst({
    where: { userId, providerId: 'google' },
    select: { access_token: true, refresh_token: true },
  });
  if (!account?.access_token) return null;
  return {
    accessToken: decryptTokenIfSet(account.access_token) || account.access_token,
    refreshToken: account.refresh_token ?? undefined,
  };
}

// ─── Sync Engine ─────────────────────────────────────────────────

export class CalendarSyncEngine {
  /**
   * initialSync — full sync del último mes + próximo mes.
   * Usa syncToken para que las próximas deltaSync sean mínimas.
   */
  async initialSync(
    userId: string,
    organizationId: string,
    calendarId = 'primary'
  ): Promise<{ synced: number }> {
    const tokens = await getUserTokens(userId);
    if (!tokens) throw new Error('Google account not connected');

    const auth = createCalendarClient(tokens.accessToken, tokens.refreshToken);
    const calendar = google.calendar({ version: 'v3', auth });

    await this.updateSyncState(userId, calendarId, 'syncing');

    try {
      const now = new Date();
      const timeMin = new Date(now);
      timeMin.setMonth(timeMin.getMonth() - 1);
      const timeMax = new Date(now);
      timeMax.setMonth(timeMax.getMonth() + 1);

      const allEvents: gcal.Schema$Event[] = [];
      let pageToken: string | undefined;

      // Paginate to handle >250 events
      do {
        const res = await calendar.events.list({
          calendarId,
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 250,
          pageToken,
        });
        if (res.data.items) allEvents.push(...res.data.items);
        pageToken = res.data.nextPageToken ?? undefined;
      } while (pageToken);

      const syncToken = allEvents[allEvents.length - 1]?.id;

      await this.batchUpsertEvents(userId, organizationId, allEvents);

      await this.updateSyncState(userId, calendarId, 'idle', syncToken);
      return { synced: allEvents.length };
    } catch (error) {
      await this.markError(userId, calendarId);
      throw error;
    }
  }

  /**
   * deltaSync — solo eventos que cambiaron desde lastSyncedAt (ventana 24h).
   * Si no hay syncToken, hace initialSync.
   */
  async deltaSync(
    userId: string,
    organizationId: string,
    calendarId = 'primary'
  ): Promise<{ synced: number; direction: 'delta' | 'full' }> {
    const syncState = await db.calendarSyncState.findUnique({
      where: { userId_calendarId: { userId, calendarId } },
    });

    if (!syncState?.syncToken) {
      const result = await this.initialSync(userId, organizationId, calendarId);
      return { ...result, direction: 'full' };
    }

    const tokens = await getUserTokens(userId);
    if (!tokens) throw new Error('Google account not connected');

    const auth = createCalendarClient(tokens.accessToken, tokens.refreshToken);
    const calendar = google.calendar({ version: 'v3', auth });

    await this.updateSyncState(userId, calendarId, 'syncing');

    try {
      const now = new Date();
      const timeMin = new Date(syncState.lastSyncedAt ?? now);
      // Solo ventana de 24h hacia atrás para reducir eventos
      timeMin.setHours(timeMin.getHours() - 24);

      const allEvents: gcal.Schema$Event[] = [];
      let pageToken: string | undefined;

      do {
        const res = await calendar.events.list({
          calendarId,
          timeMin: timeMin.toISOString(),
          timeMax: now.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 250,
          pageToken,
        });
        if (res.data.items) allEvents.push(...res.data.items);
        pageToken = res.data.nextPageToken ?? undefined;
      } while (pageToken);

      if (allEvents.length > 0) {
        await this.batchUpsertEvents(userId, organizationId, allEvents);
      }

      await this.updateSyncState(userId, calendarId, 'idle', syncState.syncToken);
      return { synced: allEvents.length, direction: 'delta' };
    } catch (error: any) {
      // syncToken puede expirar — Google expira después de ~30 días sin uso
      if (error?.status === 410 || error?.message?.includes('syncToken')) {
        await db.calendarSyncState.update({
          where: { userId_calendarId: { userId, calendarId } },
          data: { syncToken: null },
        });
        return this.deltaSync(userId, organizationId, calendarId);
      }
      await this.markError(userId, calendarId);
      throw error;
    }
  }

  /**
   * pushLocalEventToGoogle — crea o actualiza un evento local en Google.
   * Solo llama a Google API, no re-sync todo.
   */
  async pushLocalEventToGoogle(userId: string, localEventId: string): Promise<void> {
    const tokens = await getUserTokens(userId);
    if (!tokens) throw new Error('Google account not connected');

    const auth = createCalendarClient(tokens.accessToken, tokens.refreshToken);
    const calendar = google.calendar({ version: 'v3', auth });

    const localEvent = await db.calendarEvent.findUnique({ where: { id: localEventId } });
    if (!localEvent) throw new Error('Local event not found');

    const googleEvent = localEventToGoogle(localEvent);

    if (localEvent.googleEventId) {
      await calendar.events.patch({
        calendarId: 'primary',
        eventId: localEvent.googleEventId,
        requestBody: googleEvent,
      });
    } else {
      const created = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: googleEvent,
      });
      if (created.data.id) {
        await db.calendarEvent.update({
          where: { id: localEventId },
          data: {
            googleEventId: created.data.id,
            googleEtag: created.data.etag ?? undefined,
            syncDirection: 'outbound',
          },
        });
      }
    }
  }

  /**
   * deleteLocalEventFromGoogle — elimina de Google sin re-sync completo.
   */
  async deleteLocalEventFromGoogle(userId: string, googleEventId: string): Promise<void> {
    const tokens = await getUserTokens(userId);
    if (!tokens) throw new Error('Google account not connected');

    const auth = createCalendarClient(tokens.accessToken, tokens.refreshToken);
    const calendar = google.calendar({ version: 'v3', auth });

    try {
      await calendar.events.delete({ calendarId: 'primary', eventId: googleEventId });
    } catch (error: any) {
      if (error.code !== 404) throw error;
    }
  }

  resolveConflict(localEvent: { updatedAt?: Date | null }, googleEvent: { updated?: string }): 'local' | 'google' {
    const localTs = localEvent.updatedAt ? new Date(localEvent.updatedAt).getTime() : 0;
    const googleTs = googleEvent.updated ? new Date(googleEvent.updated).getTime() : 0;
    return localTs >= googleTs ? 'local' : 'google';
  }

  // ─── Helpers ────────────────────────────────────────────────────

  private async updateSyncState(
    userId: string,
    calendarId: string,
    status: 'idle' | 'syncing' | 'error',
    syncToken?: string | null
  ) {
    await db.calendarSyncState.upsert({
      where: { userId_calendarId: { userId, calendarId } },
      create: {
        userId,
        calendarId,
        syncStatus: status,
        syncToken: syncToken ?? null,
        lastSyncedAt: new Date(),
        errorCount: status === 'error' ? 1 : 0,
      },
      update: {
        syncStatus: status,
        ...(syncToken !== undefined ? { syncToken: syncToken ?? null } : {}),
        ...(status === 'idle' ? { lastSyncedAt: new Date(), errorCount: 0 } : {}),
        ...(status === 'error' ? { errorCount: { increment: 1 } } : {}),
      },
    });
  }

  private async markError(userId: string, calendarId: string) {
    await db.calendarSyncState.update({
      where: { userId_calendarId: { userId, calendarId } },
      data: { syncStatus: 'error', errorCount: { increment: 1 } },
    });
  }

  /**
   * batchUpsertEvents — un solo transaction para todos los eventos.
   * Más rápido que N upserts individuales.
   */
  private async batchUpsertEvents(
    userId: string,
    organizationId: string,
    events: gcal.Schema$Event[]
  ): Promise<void> {
    const validEvents = events.filter((e) => e.id && !e.id.startsWith('_'));
    if (validEvents.length === 0) return;

    await db.$transaction(
      async (tx) => {
        for (const gEvent of validEvents) {
          const start = gEvent.start?.dateTime || gEvent.start?.date;
          const end = gEvent.end?.dateTime || gEvent.end?.date;
          const isCancelled = gEvent.status === 'cancelled';

          const data: Prisma.CalendarEventUncheckedCreateInput = {
            googleEventId: gEvent.id!,
            googleEtag: gEvent.etag || undefined,
            title: gEvent.summary || '(Sin título)',
            description: gEvent.description || undefined,
            location: gEvent.location || undefined,
            recurrenceRule: gEvent.recurrence?.[0] || undefined,
            attendees: gEvent.attendees ? JSON.stringify(gEvent.attendees) : undefined,
            reminders: gEvent.reminders ? JSON.stringify(gEvent.reminders) : undefined,
            colorId: gEvent.colorId || undefined,
            status: isCancelled ? 'cancelled' : (gEvent.status || undefined),
            syncDirection: 'inbound',
            source: 'google',
            startAt: start ? new Date(start) : new Date(),
            endAt: end ? new Date(end) : new Date(),
            type: 'event',
            organizationId,
            createdBy: userId,
          };

          await tx.calendarEvent.upsert({
            where: { googleEventId: gEvent.id! },
            create: data,
            update: {
              title: data.title,
              description: data.description,
              location: data.location,
              recurrenceRule: data.recurrenceRule,
              attendees: data.attendees,
              reminders: data.reminders,
              colorId: data.colorId,
              status: data.status,
              startAt: data.startAt,
              endAt: data.endAt,
              syncDirection: 'inbound',
            },
          });
        }
      },
      { timeout: 30_000 }
    );
  }
}

export const calendarSyncEngine = new CalendarSyncEngine();
