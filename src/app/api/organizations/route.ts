import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { ensureDefaultPipelineStages } from '@/lib/pipeline-stages';

// GET /api/organizations - List all organizations
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    // Auth check
    const session = await getUserFromSession(request);
    if (!session) {
      logger.warn({ operation: 'listOrganizations', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    logger.debug({ operation: 'listOrganizations', requestId }, 'Fetching organizations list');

    const organizations = await db.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            members: true,
            contacts: true,
            deals: true,
            teams: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    logger.info({ operation: 'listOrganizations', requestId, count: organizations.length, duration_ms: Date.now() - start }, 'Organizations list fetched successfully');

    return NextResponse.json({ organizations }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'listOrganizations', requestId, duration_ms: Date.now() - start }, 'Failed to fetch organizations list');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/organizations - Create new organization
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'createOrganization', requestId }, 'Creating new organization');

    const body = await request.json();
    const { name, slug, logo } = body;

    if (!name || !slug) {
      logger.warn({ operation: 'createOrganization', requestId }, 'Missing required fields for organization creation');
      return NextResponse.json({ error: 'Nombre y slug son requeridos' }, { status: 400 });
    }

    const organization = await db.organization.create({
      data: {
        name,
        slug,
        logo: logo || null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info({ operation: 'createOrganization', requestId, organizationId: organization.id, duration_ms: Date.now() - start }, 'Organization created successfully');

    // Create default pipeline stages for the new organization
    await ensureDefaultPipelineStages(organization.id);

    return NextResponse.json({ organization }, { status: 201, headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'createOrganization', requestId, duration_ms: Date.now() - start }, 'Failed to create organization');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
