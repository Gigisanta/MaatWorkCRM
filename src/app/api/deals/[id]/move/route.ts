import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// POST /api/deals/[id]/move - Move deal to different stage
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromSession(request);
  if (!user) {
    const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    response.headers.set('x-request-id', request.headers.get('x-request-id') || '');
    return response;
  }

  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'moveDeal', requestId }, 'Moving deal to different stage');

    const { id } = await params;
    const body = await request.json();
    const { toStageId, stageId } = body;
    const targetStageId = toStageId || stageId;

    if (!targetStageId) {
      logger.warn({ operation: 'moveDeal', requestId, dealId: id }, 'toStageId is required');
      const response = NextResponse.json({ error: 'toStageId es requerido' }, { status: 400 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    // Get current deal
    const currentDeal = await db.deal.findUnique({
      where: { id },
      include: { stage: true },
    });

    if (!currentDeal) {
      logger.warn({ operation: 'moveDeal', requestId, dealId: id }, 'Deal not found');
      const response = NextResponse.json({ error: 'Deal no encontrado' }, { status: 404 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    // Organization ownership check
    if (currentDeal.contact?.organizationId !== user.organizationId) {
      logger.warn({ operation: 'moveDeal', requestId, dealId: id }, 'Access denied - org mismatch');
      const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const fromStageId = currentDeal.stageId;

    // Update deal stage
    const updatedDeal = await db.deal.update({
      where: { id },
      data: {
        stageId: targetStageId,
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

    logger.info({
      operation: 'moveDeal',
      requestId,
      dealId: id,
      fromStageId,
      toStageId: targetStageId,
      duration_ms: Date.now() - start,
    }, 'Deal moved successfully');

    const response = NextResponse.json(updatedDeal);
    response.headers.set('x-request-id', requestId);
    return response;
  } catch (error) {
    logger.error({ err: error, operation: 'moveDeal', requestId, duration_ms: Date.now() - start }, 'Failed to move deal');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
