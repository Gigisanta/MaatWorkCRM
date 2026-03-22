import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';

// PUT /api/pipeline-stages/[id] - Update a pipeline stage
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'updatePipelineStage', requestId }, 'Updating pipeline stage');

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      description,
      order,
      color,
      wipLimit,
      slaHours,
      isDefault,
      isActive,
    } = body;

    const stage = await db.pipelineStage.update({
      where: { id },
      data: {
        name,
        description,
        order,
        color,
        wipLimit,
        slaHours,
        isDefault,
        isActive,
      },
    });

    logger.info({ operation: 'updatePipelineStage', requestId, stageId: id, duration_ms: Date.now() - start }, 'Pipeline stage updated successfully');

    return NextResponse.json(stage, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'updatePipelineStage', requestId, duration_ms: Date.now() - start }, 'Failed to update pipeline stage');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}
