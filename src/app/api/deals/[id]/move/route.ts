import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';

// POST /api/deals/[id]/move - Move deal to different stage
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'moveDeal', requestId }, 'Moving deal to different stage');

    const { id } = await params;
    const body = await request.json();
    const { toStageId, stageId, reason, changedByUserId, organizationId } = body;
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

    // Create stage history record
    if (organizationId && currentDeal.contactId) {
      await db.pipelineStageHistory.create({
        data: {
          organizationId,
          contactId: currentDeal.contactId,
          fromStageId,
          toStageId: targetStageId,
          reason: reason || `Deal "${currentDeal.title}" moved to ${updatedDeal.stage?.name || 'new stage'}`,
          changedByUserId,
        },
      });
    }

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
