import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';

// GET /api/calendar-events - List events with date range filter
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'listCalendarEvents', requestId }, 'Listing calendar events');

    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const teamId = searchParams.get('teamId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!organizationId) {
      logger.warn({ operation: 'listCalendarEvents', requestId }, 'Validation failed: organizationId is required');
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { organizationId };

    if (teamId) {
      where.teamId = teamId;
    }

    if (type) {
      where.type = type;
    }

    // Date range filter
    if (startDate || endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate);
      }
      // Filter events that overlap with the date range
      where.OR = [
        { startAt: dateFilter },
        { endAt: dateFilter },
        {
          AND: [
            { startAt: { lte: startDate ? new Date(startDate) : new Date() } },
            { endAt: { gte: endDate ? new Date(endDate) : new Date() } },
          ],
        },
      ];
    }

    const [events, total] = await Promise.all([
      db.calendarEvent.findMany({
        where,
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
        skip,
        take: limit,
        orderBy: { startAt: 'asc' },
      }),
      db.calendarEvent.count({ where }),
    ]);

    logger.info({ operation: 'listCalendarEvents', requestId, count: events.length, total, duration_ms: Date.now() - start }, 'Calendar events listed successfully');

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'listCalendarEvents', requestId, duration_ms: Date.now() - start }, 'Failed to list calendar events');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// POST /api/calendar-events - Create a new event
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'createCalendarEvent', requestId }, 'Creating calendar event');

    const body = await request.json();
    const {
      organizationId,
      teamId,
      title,
      description,
      startAt,
      endAt,
      location,
      type,
      createdBy,
    } = body;

    if (!organizationId || !title || !startAt || !endAt) {
      logger.warn({ operation: 'createCalendarEvent', requestId }, 'Validation failed: organizationId, title, startAt, and endAt are required');
      return NextResponse.json(
        { error: 'organizationId, title, startAt, and endAt are required' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    const event = await db.calendarEvent.create({
      data: {
        organizationId,
        teamId,
        title,
        description,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        location,
        type: type || 'meeting',
        createdBy,
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

    logger.info({ operation: 'createCalendarEvent', requestId, eventId: event.id, duration_ms: Date.now() - start }, 'Calendar event created successfully');

    return NextResponse.json(event, { status: 201, headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'createCalendarEvent', requestId, duration_ms: Date.now() - start }, 'Failed to create calendar event');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}
