import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { hasPermission } from '@/lib/permissions';
import { careerPlanLevelSchema, DEFAULT_CAREER_PLAN_LEVELS } from '@/lib/schemas/career-plan';
import { logger } from '@/lib/logger';

// GET /api/career-plan/levels - List all levels
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'listCareerPlanLevels', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const levels = await db.careerPlanLevel.findMany({
      where: { organizationId: user.organizationId! },
      orderBy: { levelNumber: 'asc' },
    });

    logger.info({ operation: 'listCareerPlanLevels', requestId, count: levels.length, duration_ms: Date.now() - start }, 'Career plan levels listed successfully');

    return NextResponse.json(levels, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'listCareerPlanLevels', requestId, duration_ms: Date.now() - start }, 'Failed to list career plan levels');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// POST /api/career-plan/levels - Create level (admin only)
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'createCareerPlanLevel', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    if (!hasPermission(user.role, 'settings:manage')) {
      logger.warn({ operation: 'createCareerPlanLevel', requestId }, 'Forbidden: insufficient permissions');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const body = await request.json();
    const parsed = careerPlanLevelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    // Check if level already exists for this organization
    const existing = await db.careerPlanLevel.findFirst({
      where: {
        organizationId: user.organizationId!,
        levelNumber: parsed.data.levelNumber,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un nivel con este número para la organización' },
        { status: 409, headers: { 'x-request-id': requestId } }
      );
    }

    const level = await db.careerPlanLevel.create({
      data: {
        ...parsed.data,
        organizationId: user.organizationId!,
      },
    });

    logger.info({ operation: 'createCareerPlanLevel', requestId, levelId: level.id, duration_ms: Date.now() - start }, 'Career plan level created successfully');

    return NextResponse.json(level, { status: 201, headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'createCareerPlanLevel', requestId, duration_ms: Date.now() - start }, 'Failed to create career plan level');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// POST /api/career-plan/levels/restore - Restore default levels (admin only)
export async function PUT(request: NextRequest) {
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

    // Delete existing levels for this organization
    await db.careerPlanLevel.deleteMany({
      where: { organizationId: user.organizationId! },
    });

    // Create default levels
    const created = await db.careerPlanLevel.createMany({
      data: DEFAULT_CAREER_PLAN_LEVELS.map(level => ({
        ...level,
        organizationId: user.organizationId!,
      })),
    });

    logger.info({ operation: 'restoreDefaultCareerPlanLevels', requestId, count: created.count, duration_ms: Date.now() - start }, 'Default career plan levels restored');

    // Fetch all levels to return
    const levels = await db.careerPlanLevel.findMany({
      where: { organizationId: user.organizationId! },
      orderBy: { levelNumber: 'asc' },
    });

    return NextResponse.json(levels, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'restoreDefaultCareerPlanLevels', requestId, duration_ms: Date.now() - start }, 'Failed to restore default career plan levels');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}
