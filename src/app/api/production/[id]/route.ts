import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { isValidId } from '@/lib/utils/id-validation';
import { productionUpdateSchema } from '@/lib/schemas/production';
import { logger } from '@/lib/db/logger';

// GET /api/production/[id] - Get a single production
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'getProduction', requestId }, 'Fetching production');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'getProduction', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    const production = await db.production.findUnique({
      where: { id },
      include: { contact: { select: { id: true, name: true, emoji: true, email: true } } },
    });

    if (!production) {
      logger.warn({ operation: 'getProduction', requestId, productionId: id }, 'Production not found');
      return NextResponse.json({ error: 'Producción no encontrada' }, { status: 404, headers: { 'x-request-id': requestId } });
    }

    if (production.organizationId !== user.organizationId) {
      logger.warn({ operation: 'getProduction', requestId, productionId: id }, 'Access denied - org mismatch');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    logger.info(
      { operation: 'getProduction', requestId, productionId: production.id, duration_ms: Date.now() - start },
      'Production fetched successfully'
    );

    return NextResponse.json(production, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'getProduction', requestId, duration_ms: Date.now() - start }, 'Failed to fetch production');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// PUT /api/production/[id] - Update production
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'updateProduction', requestId }, 'Updating production');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'updateProduction', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    const body = await request.json();
    const parsed = productionUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    const existingProduction = await db.production.findUnique({ where: { id } });
    if (!existingProduction) {
      return NextResponse.json({ error: 'Producción no encontrada' }, { status: 404, headers: { 'x-request-id': requestId } });
    }
    if (existingProduction.organizationId !== user.organizationId) {
      logger.warn({ operation: 'updateProduction', requestId, productionId: id }, 'Access denied - org mismatch');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const production = await db.production.update({
      where: { id },
      data: parsed.data,
      include: { contact: { select: { id: true, name: true, emoji: true } } },
    });

    logger.info(
      { operation: 'updateProduction', requestId, productionId: production.id, duration_ms: Date.now() - start },
      'Production updated successfully'
    );

    return NextResponse.json(production, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'updateProduction', requestId, duration_ms: Date.now() - start }, 'Failed to update production');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// DELETE /api/production/[id] - Delete production
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'deleteProduction', requestId }, 'Deleting production');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'deleteProduction', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    const existingProduction = await db.production.findUnique({ where: { id } });
    if (!existingProduction) {
      return NextResponse.json({ error: 'Producción no encontrada' }, { status: 404, headers: { 'x-request-id': requestId } });
    }
    if (existingProduction.organizationId !== user.organizationId) {
      logger.warn({ operation: 'deleteProduction', requestId, productionId: id }, 'Access denied - org mismatch');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    await db.production.delete({ where: { id } });

    logger.info(
      { operation: 'deleteProduction', requestId, productionId: id, duration_ms: Date.now() - start },
      'Production deleted successfully'
    );

    return NextResponse.json({ success: true }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'deleteProduction', requestId, duration_ms: Date.now() - start }, 'Failed to delete production');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}
