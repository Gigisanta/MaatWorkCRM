import { google, calendar_v3 as gcal } from 'googleapis';
import { db } from '@/lib/db/db';
import { Prisma } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { decryptTokenIfSet } from '@/lib/utils/crypto';
import { localEventToGoogle } from './event-mapper';

const MAX_EVENTS_PER_PAGE = 250;
const SYNC_LOOKBACK_DAYS = 7; // Fallback lookback if no syncToken

// Debug logger — only logs in development
const debug = process.env.NODE_ENV === 'development'
  ? (msg: string, ...args: unknown[]) => console.log(`[SyncEngine] ${msg}`, ...args)
  : (..._: unknown[]) => {};

// ─── OAuth Client ────────────────────────────────────────────────

function createCalendarClient(accessToken: string, refreshToken?: string | null): OAuth2Client {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + '/api/auth/callback/google'
  );
  client.setCredentials({
    access_token: accessToken,
    // refreshToken puede venir encriptado o plano — intentamos decrypt y caemos al plano
    refresh_token: refreshToken
      ? (decryptTokenIfSet(refreshToken) ?? refreshToken)
      : undefined,
  });
  return client;
}

async function getUserTokens(userId: string) {
  const account = await db.account.findFirst({
    where: { userId, provider: 'google' },
    select: { access_token: true, refresh_token: true },
  });
  if (!account) {
    debug('No Google account found for user:', userId);
    return null;
  }
  if (!account.access_token) {
    debug('No access_token in Google account for user:', userId);
    return null;
  }
  return {
    // Token puede estar encriptado o plano — intentamos decrypt y caemos al plano
    accessToken: (() => {
      const decrypted = decryptTokenIfSet(account.access_token!);
      return decrypted ?? account.access_token!;
    })(),
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
      let nextSyncToken: string | undefined;
      let pageToken: string | undefined;

      // Paginate to handle >250 events
      // nextSyncToken appears on EVERY page response when no syncToken is passed
      do {
        const res = await calendar.events.list({
          calendarId,
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: MAX_EVENTS_PER_PAGE,
          pageToken,
        });
        if (res.data.items) allEvents.push(...res.data.items);
        // Store the latest nextSyncToken (last page has the definitive token)
        if (res.data.nextSyncToken) nextSyncToken = res.data.nextSyncToken;
        pageToken = res.data.nextPageToken ?? undefined;
      } while (pageToken);

      // Store null syncToken to force initial sync next time (expires after ~30 days)
      await this.batchUpsertEvents(userId, organizationId, allEvents);

      await this.updateSyncState(userId, calendarId, 'idle', nextSyncToken ?? null);
      return { synced: allEvents.length };
    } catch (error: any) {
      // Log full error details for debugging
      console.error('[SyncEngine] initialSync error:', {
        message: error?.message,
        code: error?.code,
        status: error?.status,
        response: error?.response?.data,
      });

      // 401 = auth failure — tokens are invalid/revoked, user needs to reconnect
      if (error?.status === 401 || error?.code === 401) {
        await this.updateSyncState(userId, calendarId, 'idle');
        throw Object.assign(new Error('GOOGLE_AUTH_EXPIRED'), {
          needsReauth: true,
          url: `/api/auth/signin/google?callbackUrl=${encodeURIComponent('/calendar')}`,
        });
      }

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
      const allEvents: gcal.Schema$Event[] = [];
      let nextSyncToken: string | undefined;
      let pageToken: string | undefined;

      // Use syncToken if available — Google returns ONLY changed events since that token
      // If expired (410), clear and do initialSync
      const listParams: any = {
        calendarId,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: MAX_EVENTS_PER_PAGE,
        pageToken,
      };

      if (syncState.syncToken) {
        // Delta mode: use syncToken for efficient change detection
        listParams.syncToken = syncState.syncToken;
      } else {
        // Fallback: time-based window if no syncToken
        const timeMin = new Date(syncState.lastSyncedAt ?? now);
        timeMin.setDate(timeMin.getDate() - SYNC_LOOKBACK_DAYS);
        listParams.timeMin = timeMin.toISOString();
        listParams.timeMax = now.toISOString();
      }

      do {
        const res = await calendar.events.list(listParams);
        if (res.data.items) allEvents.push(...res.data.items);
        // nextSyncToken appears on every page; keep the latest
        if (res.data.nextSyncToken) nextSyncToken = res.data.nextSyncToken;
        pageToken = res.data.nextPageToken ?? undefined;
        // When using syncToken, don't pass pageToken on subsequent calls (use nextPageToken)
        if (syncState.syncToken && pageToken) {
          // With syncToken, pagination still works but pageToken gets the nextPageToken
        }
      } while (pageToken);

      if (allEvents.length > 0) {
        await this.batchUpsertEvents(userId, organizationId, allEvents);
      }

      // Store the new nextSyncToken for next delta
      await this.updateSyncState(userId, calendarId, 'idle', nextSyncToken ?? syncState.syncToken);
      return { synced: allEvents.length, direction: 'delta' };
    } catch (error: any) {
      // Log full error details for debugging
      console.error('[SyncEngine] deltaSync error:', {
        message: error?.message,
        code: error?.code,
        status: error?.status,
        response: error?.response?.data,
      });

      // syncToken expired (410) — Google tokens expire after ~30 days without use
      if (error?.status === 410 || error?.message?.includes('syncToken')) {
        await db.calendarSyncState.update({
          where: { userId_calendarId: { userId, calendarId } },
          data: { syncToken: null },
        });
        debug('syncToken expired, re-running initialSync');
        const result = await this.initialSync(userId, organizationId, calendarId);
        return { ...result, direction: 'full' };
      }

      // 401 = auth failure — tokens are invalid/revoked, user needs to reconnect
      if (error?.status === 401 || error?.code === 401) {
        await this.updateSyncState(userId, calendarId, 'idle');
        throw Object.assign(new Error('GOOGLE_AUTH_EXPIRED'), {
          needsReauth: true,
          url: `/api/auth/signin/google?callbackUrl=${encodeURIComponent('/calendar')}`,
        });
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

  /**
   * registerWebhook — crea un canal de push notifications en Google Calendar.
   * Debe llamarse después de un initialSync exitoso.
   */
  async registerWebhook(userId: string, calendarId = 'primary'): Promise<void> {
    const tokens = await getUserTokens(userId);
    if (!tokens) throw new Error('Google account not connected');

    const auth = createCalendarClient(tokens.accessToken, tokens.refreshToken);
    const calendar = google.calendar({ version: 'v3', auth });

    // Generar canal único
    const channelId = `maatwork-${userId}-${calendarId}-${Date.now()}`;
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/google-calendar`;

    // Expiración: 1 semana (Google max es 1 semana)
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 6);

    // Verificar si ya existe uno activo
    const existing = await db.calendarWebhook.findFirst({
      where: { userId, calendarId, isActive: true },
    });

    if (existing) {
      // Ya existe canal activo — lo detenemos primero
      try {
        await calendar.channels.stop({
          requestBody: { id: existing.channelId, resourceId: existing.channelId },
        });
      } catch {
        // Ignorar errores al detener canal anterior
      }
    }

    // Crear nuevo canal
    const watchRes = await calendar.events.watch({
      calendarId,
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
        expiration: expiration.getTime().toString(),
      },
    });

    // resourceId es enviado por Google en la respuesta del watch
    const resourceId = watchRes.data?.resourceId ?? null;

    // Guardar en BD
    await db.calendarWebhook.upsert({
      where: { userId_calendarId: { userId, calendarId } },
      create: {
        userId,
        calendarId,
        channelId,
        resourceId,
        expiration,
        isActive: true,
      },
      update: {
        channelId,
        resourceId,
        expiration,
        isActive: true,
      },
    });

    debug(`Webhook registered for user ${userId}, calendar ${calendarId}`);
  }

  /**
   * unregisterWebhook — detiene el canal de push y lo marca inactivo en BD.
   */
  async unregisterWebhook(userId: string, calendarId = 'primary'): Promise<void> {
    const tokens = await getUserTokens(userId);
    if (!tokens) return; // No connected, nothing to unregister

    const webhook = await db.calendarWebhook.findFirst({
      where: { userId, calendarId, isActive: true },
    });

    if (webhook) {
      try {
        const auth = createCalendarClient(tokens.accessToken, tokens.refreshToken);
        const calendar = google.calendar({ version: 'v3', auth });
        // resourceId es obligatorio para detener el canal — si no lo tenemos, el stop fallará
        // (no importa: el canal expirará y marcaremos isActive=false en BD igual)
        if (webhook.resourceId) {
          await calendar.channels.stop({
            requestBody: { id: webhook.channelId, resourceId: webhook.resourceId },
          });
        }
      } catch (error) {
        debug('Failed to stop Google webhook:', (error as Error).message);
      }
    }

    await db.calendarWebhook.updateMany({
      where: { userId, calendarId },
      data: { isActive: false },
    });

    debug(`Webhook unregistered for user ${userId}, calendar ${calendarId}`);
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

          if (isCancelled) {
            // Cancelled in Google → hard delete locally (not soft delete)
            await tx.calendarEvent.deleteMany({
              where: { googleEventId: gEvent.id! },
            }).catch(() => {});
            continue;
          }

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
            status: gEvent.status || undefined,
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
