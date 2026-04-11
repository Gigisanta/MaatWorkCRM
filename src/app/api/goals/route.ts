import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { logger } from '@/lib/db/logger';
import { userGoalCreateSchema } from '@/lib/schemas';
import { z } from 'zod';

// GET /api/goals - List goals by teamId
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'listGoals', requestId }, 'Fetching goals');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'listGoals', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { searchParams } = await request.nextUrl;
    const params = searchParams;
    const teamId = params.get('teamId');
    const status = params.get('status') || undefined;
    const period = params.get('period') || undefined;
    const page = parseInt(params.get('page') || '1');
    const limit = parseInt(params.get('limit') || '20');

    if (!teamId) {
      logger.warn({ operation: 'listGoals', requestId }, 'teamId is required');
      return NextResponse.json(
        { error: 'teamId es requerido' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    // Verify team belongs to user's organization
    const team = await db.team.findUnique({
      where: { id: teamId },
      select: { id: true, organizationId: true },
    });
    if (!team) {
      return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404, headers: { 'x-request-id': requestId } });
    }
    if (team.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { teamId };

    if (status) {
      where.status = status;
    }

    if (period) {
      where.period = period;
    }

    const [goals, total] = await Promise.all([
      db.teamGoal.findMany({
        where,
        include: {
          team: {
            select: { id: true, name: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.teamGoal.count({ where }),
    ]);

    logger.info(
      { operation: 'listGoals', requestId, count: goals.length, total, duration_ms: Date.now() - start },
      'Goals fetched successfully'
    );

    const response = NextResponse.json(
      {
        goals,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { headers: { 'x-request-id': requestId } }
    );
    response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return response;
  } catch (error) {
    logger.error(
      { err: error, operation: 'listGoals', requestId, duration_ms: Date.now() - start },
      'Failed to fetch goals'
    );
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

// POST /api/goals - Create a new goal
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'createGoal', requestId }, 'Creating goal');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'createGoal', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const body = await request.json();
    const parsed = userGoalCreateSchema.safeParse(body);
    if (!parsed.success) {
      logger.warn({ operation: 'createGoal', requestId, errors: parsed.error.flatten() }, 'Invalid goal data');
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    const { teamGoalId: teamId, title, description, type, targetValue, currentValue, unit, period, month, year, startDate, endDate, status } = parsed.data;

    if (!teamId) {
      logger.warn({ operation: 'createGoal', requestId }, 'teamId is required');
      return NextResponse.json(
        { error: 'teamId es requerido' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    // Verify team belongs to user's organization
    const team = await db.team.findUnique({
      where: { id: teamId },
      select: { id: true, organizationId: true },
    });
    if (!team) {
      return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404, headers: { 'x-request-id': requestId } });
    }
    if (team.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const goal = await db.teamGoal.create({
      data: {
        teamId,
        title,
        description,
        type,
        targetValue,
        currentValue: currentValue || 0,
        unit: unit || 'count',
        period: period || `${year}-${String(month).padStart(2, '0')}`,
        month: month || new Date().getMonth() + 1,
        year: year || new Date().getFullYear(),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'active',
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            leader: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    logger.info(
      { operation: 'createGoal', requestId, goalId: goal.id, duration_ms: Date.now() - start },
      'Goal created successfully'
    );

    return NextResponse.json(goal, { status: 201, headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error(
      { err: error, operation: 'createGoal', requestId, duration_ms: Date.now() - start },
      'Failed to create goal'
    );
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}
