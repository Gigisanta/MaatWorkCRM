import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { revalidateTag } from 'next/cache';
import { logger } from '@/lib/db/logger';
import { isValidId } from '@/lib/utils/id-validation';
import { getUserFromSession } from '@/lib/auth/auth-helpers';

// GET /api/deals/[id] - Get a single deal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const sessionUser = await getUserFromSession(request);
    if (!sessionUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    logger.debug({ operation: 'getDeal', requestId }, 'Fetching deal');

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    const deal = await db.deal.findUnique({
      where: { id },
      include: {
        contact: {
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
            pipelineStage: true,
          },
        },
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

    if (!deal) {
      logger.warn({ operation: 'getDeal', requestId, dealId: id }, 'Deal not found');
      const response = NextResponse.json({ error: 'Deal no encontrado' }, { status: 404 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    // Organization ownership check
    if (deal.organizationId !== sessionUser.organizationId) {
      logger.warn({ operation: 'getDeal', requestId, dealId: id }, 'Access denied - org mismatch');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    logger.info({ operation: 'getDeal', requestId, dealId: id, duration_ms: Date.now() - start }, 'Deal fetched successfully');

    const response = NextResponse.json(deal);
    response.headers.set('x-request-id', requestId);
    return response;
  } catch (error) {
    logger.error({ err: error, operation: 'getDeal', requestId, duration_ms: Date.now() - start }, 'Failed to fetch deal');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT /api/deals/[id] - Update a deal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const sessionUser = await getUserFromSession(request);
    if (!sessionUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    logger.debug({ operation: 'updateDeal', requestId }, 'Updating deal');

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    // Ownership/organization check using deal's own organizationId field
    const deal = await db.deal.findUnique({
      where: { id },
    });
    if (!deal) {
      return NextResponse.json({ error: 'Deal no encontrado' }, { status: 404, headers: { 'x-request-id': requestId } });
    }
    const isSameOrg = deal.organizationId === sessionUser.organizationId;
    const isAssignedUser = deal.assignedTo === sessionUser.id;
    if (!isSameOrg && !isAssignedUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const body = await request.json();
    const {
      contactId,
      stageId,
      title,
      value,
      probability,
      expectedCloseDate,
      assignedTo,
    } = body;

    const updatedDeal = await db.deal.update({
      where: { id },
      data: {
        contactId,
        stageId,
        title,
        value,
        probability,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        assignedTo,
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

    logger.info({ operation: 'updateDeal', requestId, dealId: id, duration_ms: Date.now() - start }, 'Deal updated successfully');

    revalidateTag('deals', 'max');

    const response = NextResponse.json(updatedDeal);
    response.headers.set('x-request-id', requestId);
    return response;
  } catch (error) {
    logger.error({ err: error, operation: 'updateDeal', requestId, duration_ms: Date.now() - start }, 'Failed to update deal');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE /api/deals/[id] - Delete a deal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const sessionUser = await getUserFromSession(request);
    if (!sessionUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    logger.debug({ operation: 'deleteDeal', requestId }, 'Deleting deal');

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    // Ownership/organization check using deal's own organizationId field
    const deal = await db.deal.findUnique({
      where: { id },
    });
    if (!deal) {
      return NextResponse.json({ error: 'Deal no encontrado' }, { status: 404, headers: { 'x-request-id': requestId } });
    }
    const isSameOrg = deal.organizationId === sessionUser.organizationId;
    const isAssignedUser = deal.assignedTo === sessionUser.id;
    if (!isSameOrg && !isAssignedUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    await db.deal.delete({
      where: { id },
    });

    logger.info({ operation: 'deleteDeal', requestId, dealId: id, duration_ms: Date.now() - start }, 'Deal deleted successfully');

    revalidateTag('deals', 'max');

    const response = NextResponse.json({ success: true });
    response.headers.set('x-request-id', requestId);
    return response;
  } catch (error) {
    logger.error({ err: error, operation: 'deleteDeal', requestId, duration_ms: Date.now() - start }, 'Failed to delete deal');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
