import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { db } from '@/lib/db/db';
import { logger } from '@/lib/db/logger';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const membership = await db.member.findFirst({
      where: { userId: user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const syncState = await db.calendarSyncState.findFirst({
      where: { userId: user.id, calendarId: 'primary' },
    });

    let selectedCalendarIds: string[] = ['primary'];
    if (syncState?.selectedCalendarIds) {
      try {
        selectedCalendarIds = JSON.parse(syncState.selectedCalendarIds);
      } catch {
        selectedCalendarIds = ['primary'];
      }
    }

    return NextResponse.json({ selectedCalendarIds });
  } catch (error) {
    logger.error(
      { operation: 'GET /api/calendar/preferences', requestId, error },
      'Error fetching calendar preferences'
    );
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const membership = await db.member.findFirst({
      where: { userId: user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.calendars)) {
      return NextResponse.json({ error: 'Invalid request: calendars array required' }, { status: 400 });
    }

    const calendars = body.calendars as string[];

    await db.calendarSyncState.upsert({
      where: {
        userId_calendarId: {
          userId: user.id,
          calendarId: 'primary',
        },
      },
      update: {
        selectedCalendarIds: JSON.stringify(calendars),
      },
      create: {
        userId: user.id,
        calendarId: 'primary',
        selectedCalendarIds: JSON.stringify(calendars),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      { operation: 'POST /api/calendar/preferences', requestId, error },
      'Error saving calendar preferences'
    );
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
