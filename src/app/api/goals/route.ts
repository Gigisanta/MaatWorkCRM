import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';

// GET /api/goals - List goals by teamId
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'listGoals', requestId }, 'Fetching goals');

    const { searchParams } = await request.nextUrl;
    const teamId = searchParams.get('teamId');
    const status = searchParams.get('status');
    const period = searchParams.get('period');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!teamId) {
      logger.warn({ operation: 'listGoals', requestId }, 'teamId is required');
      return NextResponse.json(
        { error: 'teamId es requerido' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
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

    return NextResponse.json(
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

    const body = await request.json();
    const {
      teamId,
      title,
      description,
      type,
      targetValue,
      currentValue,
      unit,
      period,
      month,
      year,
      startDate,
      endDate,
      status,
    } = body;

    if (!teamId || !title || !type || targetValue === undefined) {
      logger.warn({ operation: 'createGoal', requestId }, 'teamId, title, type, and targetValue are required');
      return NextResponse.json(
        { error: 'teamId, title, type y targetValue son requeridos' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
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
