import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/organizations/[id] - Get organization details
export async function GET(request: NextRequest, { params }: RouteParams) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'getOrganization', requestId }, 'Fetching organization details');

    const { id } = await params;

    const organization = await db.organization.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        createdAt: true,
        updatedAt: true,
        members: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                isActive: true,
              },
            },
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            members: true,
            contacts: true,
            deals: true,
            teams: true,
          },
        },
      },
    });

    if (!organization) {
      logger.warn({ operation: 'getOrganization', requestId, organizationId: id }, 'Organization not found');
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    logger.info({ operation: 'getOrganization', requestId, organizationId: id, duration_ms: Date.now() - start }, 'Organization fetched successfully');

    return NextResponse.json({ organization }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'getOrganization', requestId, duration_ms: Date.now() - start }, 'Failed to fetch organization');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT /api/organizations/[id] - Update organization
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'updateOrganization', requestId }, 'Updating organization');

    const { id } = await params;
    const body = await request.json();
    const { name, logo } = body;

    // Check if organization exists
    const existing = await db.organization.findUnique({
      where: { id },
    });

    if (!existing) {
      logger.warn({ operation: 'updateOrganization', requestId, organizationId: id }, 'Organization not found for update');
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    // Update organization
    const updated = await db.organization.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        logo: logo ?? existing.logo,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
      },
    });

    logger.info({ operation: 'updateOrganization', requestId, organizationId: id, duration_ms: Date.now() - start }, 'Organization updated successfully');

    return NextResponse.json({ organization: updated }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'updateOrganization', requestId, duration_ms: Date.now() - start }, 'Failed to update organization');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
