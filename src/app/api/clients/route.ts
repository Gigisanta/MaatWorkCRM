import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { hasPermission, normalizeRole } from '@/lib/auth/permissions';
import { revalidateTag } from 'next/cache';
import { logger } from '@/lib/db/logger';

export const dynamic = 'force-dynamic';

// GET /api/clients - List clients (contacts with interactions) with filters
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'getClients', requestId }, 'Fetching clients');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'getClients', requestId }, 'Unauthorized access attempt');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const userRole = normalizeRole(user.role);

    // Only admins, owners, managers can access clients
    if (!hasPermission(userRole, 'contacts:read:all') && !hasPermission(userRole, 'contacts:read:team')) {
      logger.warn({ operation: 'getClients', requestId }, 'Forbidden access attempt');
      const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const searchParams = await request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const search = searchParams.get('search');
    const segment = searchParams.get('segment');
    const assignedTo = searchParams.get('assignedTo');
    const source = searchParams.get('source');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const targetOrgId = organizationId || user.organizationId;
    if (!targetOrgId) {
      logger.warn({ operation: 'getClients', requestId }, 'organizationId is required');
      const response = NextResponse.json({ error: 'organizationId es requerido' }, { status: 400 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    if (targetOrgId !== user.organizationId) {
      logger.warn({ operation: 'getClients', requestId, targetOrgId }, 'Forbidden: organization mismatch');
      const response = NextResponse.json({ error: 'No tienes acceso a esta organización' }, { status: 403 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    // Build where clause
    const where: Record<string, unknown> = { organizationId: targetOrgId };

    if (segment) {
      where.segment = segment;
    }

    if (source) {
      where.source = source;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [contacts, total] = await Promise.all([
      db.contact.findMany({
        where,
        include: {
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          _count: {
            select: {
              deals: true,
              tasks: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.contact.count({ where }),
    ]);

    // Get interaction counts and last interaction date for each contact
    const clients = await Promise.all(
      contacts.map(async (contact) => {
        // Get interaction count from Interaction table
        const interactionCount = await db.interaction.count({
          where: { contactId: contact.id },
        });

        // Get last interaction date
        const lastInteraction = await db.interaction.findFirst({
          where: { contactId: contact.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        });

        return {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          segment: contact.segment,
          source: contact.source,
          assignedTo: contact.assignedUser
            ? { id: contact.assignedUser.id, name: contact.assignedUser.name || '' }
            : null,
          lastInteractionDate: lastInteraction?.createdAt || null,
          interactionCount,
          isLandsClient: false, // TODO: Implement based on business logic
          createdAt: contact.createdAt,
        };
      })
    );

    logger.info({
      operation: 'getClients',
      requestId,
      count: clients.length,
      total,
      duration_ms: Date.now() - start,
    }, 'Clients fetched successfully');

    const response = NextResponse.json({
      clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
    response.headers.set('x-request-id', requestId);
    response.headers.set('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    return response;
  } catch (error) {
    logger.error({
      err: error,
      operation: 'getClients',
      requestId,
      duration_ms: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    }, 'Failed to fetch clients');
    const errorResponse = NextResponse.json({
      error: 'Error interno del servidor',
      requestId,
    }, { status: 500 });
    errorResponse.headers.set('x-request-id', requestId);
    return errorResponse;
  }
}
