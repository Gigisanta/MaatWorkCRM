import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { isValidId } from '@/lib/id-validation';

// PUT /api/pipeline-stages/[id] - Update a pipeline stage
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': request.headers.get('x-request-id') || '' } });
  }

  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'updatePipelineStage', requestId }, 'Updating pipeline stage');

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

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

    // Fetch the stage first to verify ownership
    const existingStage = await db.pipelineStage.findUnique({
      where: { id },
    });

    if (!existingStage) {
      return NextResponse.json({ error: 'Pipeline stage not found' }, { status: 404, headers: { 'x-request-id': requestId } });
    }

    if (existingStage.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

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
