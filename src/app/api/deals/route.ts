import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { revalidateTag } from 'next/cache';
import { logger } from '@/lib/logger';
import { getUserFromSession } from '@/lib/auth-helpers';
import { dealCreateSchema } from '@/lib/schemas';
import type { DealCreateInput } from '@/lib/schemas';

export const revalidate = 300;

// GET /api/deals - List deals with filters
export async function GET(request: NextRequest) {
  const session = await getUserFromSession(request);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'getDeals', requestId }, 'Fetching deals');

    const searchParams = request.nextUrl.searchParams;
    const stageId = searchParams.get('stageId');
    const contactId = searchParams.get('contactId');
    const assignedTo = searchParams.get('assignedTo');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      logger.warn({ operation: 'getDeals', requestId }, 'organizationId is required');
      const response = NextResponse.json({ error: 'organizationId es requerido' }, { status: 400 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { organizationId };

    if (stageId) {
      where.stageId = stageId;
    }

    if (contactId) {
      where.contactId = contactId;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [deals, total] = await Promise.all([
      db.deal.findMany({
        where,
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              company: true,
              tags: {
                select: {
                  tag: { select: { id: true, name: true, color: true } },
                },
              },
            },
          },
          stage: {
            select: {
              id: true,
              name: true,
              color: true,
              order: true,
            },
          },
          assignedUser: {
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
        orderBy: { createdAt: 'desc' },
      }),
      db.deal.count({ where }),
    ]);

    logger.info({ operation: 'getDeals', requestId, count: deals.length, total, page, limit, duration_ms: Date.now() - start }, 'Deals fetched successfully');

    const response = NextResponse.json({
      deals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
    response.headers.set('x-request-id', requestId);
    return response;
  } catch (error) {
    logger.error({ err: error, operation: 'getDeals', requestId, duration_ms: Date.now() - start }, 'Failed to fetch deals');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/deals - Create a new deal
export async function POST(request: NextRequest) {
  const session = await getUserFromSession(request);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'createDeal', requestId }, 'Creating deal');

    const body = await request.json();
    const parsed = dealCreateSchema.safeParse(body);

    if (!parsed.success) {
      logger.warn({ operation: 'createDeal', requestId }, 'Validation failed');
      const response = NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const data: DealCreateInput = parsed.data;

    const deal = await db.deal.create({
      data: {
        organizationId: data.organizationId,
        contactId: data.contactId,
        stageId: data.stageId,
        title: data.title,
        value: data.value ?? 0,
        probability: data.probability ?? 50,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
        assignedTo: data.assignedTo,
      },
      include: {
        contact: true,
        stage: true,
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    logger.info({ operation: 'createDeal', requestId, dealId: deal.id, organizationId: data.organizationId, duration_ms: Date.now() - start }, 'Deal created successfully');

    revalidateTag('deals', 'max');

    const response = NextResponse.json(deal, { status: 201 });
    response.headers.set('x-request-id', requestId);
    return response;
  } catch (error) {
    logger.error({ err: error, operation: 'createDeal', requestId, duration_ms: Date.now() - start }, 'Failed to create deal');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
