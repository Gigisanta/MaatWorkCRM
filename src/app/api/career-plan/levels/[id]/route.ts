import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { hasPermission } from '@/lib/permissions';
import { careerPlanLevelUpdateSchema } from '@/lib/schemas/career-plan';
import { logger } from '@/lib/logger';
import { isValidId } from '@/lib/id-validation';

// GET /api/career-plan/levels/[id] - Get single level
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    const level = await db.careerPlanLevel.findUnique({
      where: { id },
    });

    if (!level) {
      return NextResponse.json({ error: 'Nivel no encontrado' }, { status: 404, headers: { 'x-request-id': requestId } });
    }

    if (level.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    return NextResponse.json(level, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'getCareerPlanLevel', requestId, duration_ms: Date.now() - start }, 'Failed to get career plan level');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// PUT /api/career-plan/levels/[id] - Update level (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    if (!hasPermission(user.role, 'settings:manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    const existing = await db.careerPlanLevel.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Nivel no encontrado' }, { status: 404, headers: { 'x-request-id': requestId } });
    }

    if (existing.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const body = await request.json();
    const parsed = careerPlanLevelUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    // If changing level number, check no conflict
    if (parsed.data.levelNumber !== undefined && parsed.data.levelNumber !== existing.levelNumber) {
      const conflict = await db.careerPlanLevel.findFirst({
        where: {
          organizationId: user.organizationId!,
          levelNumber: parsed.data.levelNumber,
          id: { not: id },
        },
      });
      if (conflict) {
        return NextResponse.json(
          { error: 'Ya existe un nivel con este número para la organización' },
          { status: 409, headers: { 'x-request-id': requestId } }
        );
      }
    }

    const level = await db.careerPlanLevel.update({
      where: { id },
      data: parsed.data,
    });

    logger.info({ operation: 'updateCareerPlanLevel', requestId, levelId: id, duration_ms: Date.now() - start }, 'Career plan level updated successfully');

    return NextResponse.json(level, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'updateCareerPlanLevel', requestId, duration_ms: Date.now() - start }, 'Failed to update career plan level');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// DELETE /api/career-plan/levels/[id] - Delete level (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    if (!hasPermission(user.role, 'settings:manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    const existing = await db.careerPlanLevel.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Nivel no encontrado' }, { status: 404, headers: { 'x-request-id': requestId } });
    }

    if (existing.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    await db.careerPlanLevel.delete({ where: { id } });

    logger.info({ operation: 'deleteCareerPlanLevel', requestId, levelId: id, duration_ms: Date.now() - start }, 'Career plan level deleted successfully');

    return NextResponse.json({ success: true }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'deleteCareerPlanLevel', requestId, duration_ms: Date.now() - start }, 'Failed to delete career plan level');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}
