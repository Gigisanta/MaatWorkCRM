import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { hasPermission } from '@/lib/permissions';
import { productionCreateSchema } from '@/lib/schemas/production';
import { logger } from '@/lib/logger';

// Helper: get IDs of team members (advisors) under a manager
async function getTeamMemberIds(managerId: string): Promise<string[]> {
  const team = await db.user.findMany({
    where: { managerId },
    select: { id: true },
  });
  return team.map(u => u.id);
}

// GET /api/production - List productions
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'listProductions', requestId }, 'Fetching productions');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'listProductions', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { searchParams } = await request.nextUrl;
    const contactId = searchParams.get('contactId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = { organizationId: user.organizationId };
    if (contactId) where.contactId = contactId;
    if (status) where.estado = status;

    // Managers see their team's productions; advisors see only their own
    const userRole = user.role;
    if (hasPermission(userRole, 'contacts:read:team')) {
      const teamMemberIds = await getTeamMemberIds(user.id);
      where.contact = { assignedTo: { in: [user.id, ...teamMemberIds] } };
    } else if (hasPermission(userRole, 'contacts:read:own')) {
      where.contact = { assignedTo: user.id };
    }
    // admin/owner/developer see all (no filter)

    const [items, total] = await Promise.all([
      db.production.findMany({
        where,
        include: { contact: { select: { id: true, name: true, emoji: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.production.count({ where }),
    ]);

    logger.info(
      { operation: 'listProductions', requestId, count: items.length, total, duration_ms: Date.now() - start },
      'Productions fetched successfully'
    );

    return NextResponse.json(
      {
        items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      { headers: { 'x-request-id': requestId } }
    );
  } catch (error) {
    logger.error({ err: error, operation: 'listProductions', requestId, duration_ms: Date.now() - start }, 'Failed to fetch productions');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// POST /api/production - Create production
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'createProduction', requestId }, 'Creating production');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'createProduction', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const body = await request.json();
    const parsed = productionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    const data = parsed.data;

    // Verify contact belongs to organization
    const contact = await db.contact.findFirst({
      where: { id: data.contactId, organizationId: user.organizationId as string },
    });
    if (!contact) {
      return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404, headers: { 'x-request-id': requestId } });
    }

    const production = await db.production.create({
      data: {
        ...data,
        organizationId: user.organizationId as string,
      },
      include: { contact: { select: { id: true, name: true, emoji: true } } },
    });

    logger.info(
      { operation: 'createProduction', requestId, productionId: production.id, duration_ms: Date.now() - start },
      'Production created successfully'
    );

    return NextResponse.json(production, { status: 201, headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'createProduction', requestId, duration_ms: Date.now() - start }, 'Failed to create production');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}
