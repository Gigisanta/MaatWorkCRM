import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';

// GET /api/training/[id] - Get a single training material
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'getTrainingMaterial', requestId }, 'Fetching training material');

    const { id } = await params;

    const material = await db.trainingMaterial.findUnique({
      where: { id },
    });

    if (!material) {
      logger.warn({ operation: 'getTrainingMaterial', requestId, materialId: id }, 'Training material not found');
      return NextResponse.json({ error: 'Training material not found' }, { status: 404, headers: { 'x-request-id': requestId } });
    }

    logger.info({ operation: 'getTrainingMaterial', requestId, materialId: id, duration_ms: Date.now() - start }, 'Training material fetched successfully');

    return NextResponse.json(material, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'getTrainingMaterial', requestId, duration_ms: Date.now() - start }, 'Failed to fetch training material');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// PUT /api/training/[id] - Update a training material
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'updateTrainingMaterial', requestId }, 'Updating training material');

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      url,
      content,
      category,
    } = body;

    const material = await db.trainingMaterial.update({
      where: { id },
      data: {
        title,
        description,
        url,
        content,
        category,
      },
    });

    logger.info({ operation: 'updateTrainingMaterial', requestId, materialId: id, duration_ms: Date.now() - start }, 'Training material updated successfully');

    return NextResponse.json(material, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'updateTrainingMaterial', requestId, duration_ms: Date.now() - start }, 'Failed to update training material');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// DELETE /api/training/[id] - Delete a training material
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'deleteTrainingMaterial', requestId }, 'Deleting training material');

    const { id } = await params;

    await db.trainingMaterial.delete({
      where: { id },
    });

    logger.info({ operation: 'deleteTrainingMaterial', requestId, materialId: id, duration_ms: Date.now() - start }, 'Training material deleted successfully');

    return NextResponse.json({ success: true }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'deleteTrainingMaterial', requestId, duration_ms: Date.now() - start }, 'Failed to delete training material');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}
