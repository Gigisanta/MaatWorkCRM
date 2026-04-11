import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { logger } from '@/lib/db/logger';
import { getUserFromSession } from '@/lib/auth/auth-helpers';

// GET /api/calendar-events/[id] - Get a single event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401, headers: { 'x-request-id': requestId } });
  }

  try {
    logger.debug({ operation: 'getCalendarEvent', requestId }, 'Fetching calendar event');

    const { id } = await params;

    const event = await db.calendarEvent.findUnique({
      where: { id },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!event) {
      logger.warn({ operation: 'getCalendarEvent', requestId, eventId: id }, 'Event not found');
      return NextResponse.json({ error: 'Event not found' }, { status: 404, headers: { 'x-request-id': requestId } });
    }

    if (event.organizationId !== user.organizationId) {
      logger.warn({ operation: 'getCalendarEvent', requestId, eventId: id, eventOrgId: event.organizationId, userOrgId: user.organizationId }, 'Acceso denegado: evento no pertenece a la organizacion');
      return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    logger.info({ operation: 'getCalendarEvent', requestId, eventId: id, duration_ms: Date.now() - start }, 'Calendar event fetched successfully');

    return NextResponse.json(event, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'getCalendarEvent', requestId, duration_ms: Date.now() - start }, 'Failed to fetch calendar event');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// PUT /api/calendar-events/[id] - Update an event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401, headers: { 'x-request-id': requestId } });
  }

  try {
    logger.debug({ operation: 'updateCalendarEvent', requestId }, 'Updating calendar event');

    const { id } = await params;

    const existing = await db.calendarEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404, headers: { 'x-request-id': requestId } });
    }
    if (existing.organizationId !== user.organizationId) {
      logger.warn({ operation: 'updateCalendarEvent', requestId, eventId: id, eventOrgId: existing.organizationId, userOrgId: user.organizationId }, 'Acceso denegado: evento no pertenece a la organizacion');
      return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const body = await request.json();
    const {
      title,
      description,
      startAt,
      endAt,
      location,
      type,
      teamId,
    } = body;

    const event = await db.calendarEvent.update({
      where: { id },
      data: {
        title,
        description,
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt ? new Date(endAt) : undefined,
        location,
        type,
        teamId,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    logger.info({ operation: 'updateCalendarEvent', requestId, eventId: id, duration_ms: Date.now() - start }, 'Calendar event updated successfully');

    return NextResponse.json(event, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'updateCalendarEvent', requestId, duration_ms: Date.now() - start }, 'Failed to update calendar event');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// DELETE /api/calendar-events/[id] - Delete an event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401, headers: { 'x-request-id': requestId } });
  }

  try {
    logger.debug({ operation: 'deleteCalendarEvent', requestId }, 'Deleting calendar event');

    const { id } = await params;

    const existing = await db.calendarEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404, headers: { 'x-request-id': requestId } });
    }
    if (existing.organizationId !== user.organizationId) {
      logger.warn({ operation: 'deleteCalendarEvent', requestId, eventId: id, eventOrgId: existing.organizationId, userOrgId: user.organizationId }, 'Acceso denegado: evento no pertenece a la organizacion');
      return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    await db.calendarEvent.delete({
      where: { id },
    });

    logger.info({ operation: 'deleteCalendarEvent', requestId, eventId: id, duration_ms: Date.now() - start }, 'Calendar event deleted successfully');

    return NextResponse.json({ success: true }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'deleteCalendarEvent', requestId, duration_ms: Date.now() - start }, 'Failed to delete calendar event');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}
