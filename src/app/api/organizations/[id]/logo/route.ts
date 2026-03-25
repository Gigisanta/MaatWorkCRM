import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/organizations/[id]/logo - Get organization logo
export async function GET(request: NextRequest, { params }: RouteParams) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'getOrganizationLogo', requestId }, 'Fetching organization logo');

    const { id } = await params;

    // Organization ownership check
    const user = await getUserFromSession(request);
    if (!user || user.organizationId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const organization = await db.organization.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        logo: true,
      },
    });

    if (!organization) {
      logger.warn({ operation: 'getOrganizationLogo', requestId, organizationId: id }, 'Organization not found for logo fetch');
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    if (!organization.logo) {
      logger.warn({ operation: 'getOrganizationLogo', requestId, organizationId: id }, 'Organization has no logo');
      return NextResponse.json({ error: 'La organización no tiene logo' }, { status: 404 });
    }

    logger.info({ operation: 'getOrganizationLogo', requestId, organizationId: id, duration_ms: Date.now() - start }, 'Organization logo fetched successfully');

    return NextResponse.json({ logo: organization.logo }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'getOrganizationLogo', requestId, duration_ms: Date.now() - start }, 'Failed to fetch organization logo');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT /api/organizations/[id]/logo - Update organization logo
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'updateOrganizationLogo', requestId }, 'Updating organization logo');

    const { id } = await params;
    const body = await request.json();
    const { logo } = body;

    if (!logo) {
      logger.warn({ operation: 'updateOrganizationLogo', requestId, organizationId: id }, 'Logo data is required');
      return NextResponse.json({ error: 'Logo es requerido' }, { status: 400 });
    }

    // Check if organization exists and user belongs to it
    if (user.organizationId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await db.organization.findUnique({
      where: { id },
    });

    if (!existing) {
      logger.warn({ operation: 'updateOrganizationLogo', requestId, organizationId: id }, 'Organization not found for logo update');
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    // Update logo
    const updated = await db.organization.update({
      where: { id },
      data: { logo },
      select: {
        id: true,
        name: true,
        logo: true,
      },
    });

    logger.info({ operation: 'updateOrganizationLogo', requestId, organizationId: id, duration_ms: Date.now() - start }, 'Organization logo updated successfully');

    return NextResponse.json({ organization: updated }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'updateOrganizationLogo', requestId, duration_ms: Date.now() - start }, 'Failed to update organization logo');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE /api/organizations/[id]/logo - Delete organization logo
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'deleteOrganizationLogo', requestId }, 'Deleting organization logo');

    const { id } = await params;

    // Organization ownership check
    if (user.organizationId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if organization exists
    const existing = await db.organization.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        logo: true,
      },
    });

    if (!existing) {
      logger.warn({ operation: 'deleteOrganizationLogo', requestId, organizationId: id }, 'Organization not found for logo deletion');
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    if (!existing.logo) {
      logger.warn({ operation: 'deleteOrganizationLogo', requestId, organizationId: id }, 'Organization has no logo to delete');
      return NextResponse.json({ error: 'La organización no tiene logo' }, { status: 404 });
    }

    // Delete logo by setting to null
    await db.organization.update({
      where: { id },
      data: { logo: null },
    });

    logger.info({ operation: 'deleteOrganizationLogo', requestId, organizationId: id, duration_ms: Date.now() - start }, 'Organization logo deleted successfully');

    return NextResponse.json({ success: true }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'deleteOrganizationLogo', requestId, duration_ms: Date.now() - start }, 'Failed to delete organization logo');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
