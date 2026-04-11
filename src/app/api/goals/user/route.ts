import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { logger } from '@/lib/db/logger';
import { userGoalCreateSchema, userGoalQuerySchema } from '@/lib/schemas/goal';
import { calculateGoalHealth } from '@/lib/services/goal-health';

// GET /api/goals/user - List goals for the current user
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'listUserGoals', requestId }, 'Fetching user goals');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'listUserGoals', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { searchParams } = await request.nextUrl;
    const params = await searchParams;

    // Parse and validate query params (convert null to undefined for Zod optional fields)
    const queryResult = userGoalQuerySchema.safeParse({
      status: params.get('status') || undefined,
      type: params.get('type') || undefined,
      period: params.get('period') || undefined,
      teamGoalId: params.get('teamGoalId') || undefined,
      health: params.get('health') || undefined,
      page: params.get('page') || '1',
      limit: params.get('limit') || '20',
    });

    if (!queryResult.success) {
      logger.warn({ operation: 'listUserGoals', requestId, errors: queryResult.error.flatten() }, 'Invalid query params');
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: queryResult.error.flatten() },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    const { status, type, period, teamGoalId, health, page, limit } = queryResult.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = { ownerId: user.id };

    if (status) where.status = status;
    if (type) where.type = type;
    if (period) where.period = period;
    if (teamGoalId) where.teamGoalId = teamGoalId;
    if (health) where.health = health;

    const [goals, total] = await Promise.all([
      db.userGoal.findMany({
        where,
        include: {
          owner: {
            select: { id: true, name: true, email: true, image: true },
          },
          teamGoal: {
            select: { id: true, title: true, teamId: true },
            include: {
              team: {
                select: { id: true, name: true },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.userGoal.count({ where }),
    ]);

    // Calculate health for each goal if not already set
    const goalsWithHealth = goals.map((goal) => {
      if (!goal.health && goal.startDate && goal.endDate && goal.targetValue > 0) {
        const calculatedHealth = calculateGoalHealth({
          startDate: new Date(goal.startDate),
          endDate: new Date(goal.endDate),
          currentValue: goal.currentValue,
          targetValue: goal.targetValue,
        });
        return { ...goal, calculatedHealth };
      }
      return { ...goal, calculatedHealth: goal.health };
    });

    logger.info(
      { operation: 'listUserGoals', requestId, count: goals.length, total, duration_ms: Date.now() - start },
      'User goals fetched successfully'
    );

    const response = NextResponse.json(
      {
        goals: goalsWithHealth,
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
      { err: error, operation: 'listUserGoals', requestId, duration_ms: Date.now() - start },
      'Failed to fetch user goals'
    );
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

// POST /api/goals/user - Create a new user goal
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'createUserGoal', requestId }, 'Creating user goal');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'createUserGoal', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const body = await request.json();

    const createResult = userGoalCreateSchema.safeParse(body);
    if (!createResult.success) {
      logger.warn({ operation: 'createUserGoal', requestId, errors: createResult.error.flatten() }, 'Invalid input');
      return NextResponse.json(
        { error: 'Datos inválidos', details: createResult.error.flatten() },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    const data = createResult.data;

    // If teamGoalId is provided, verify it belongs to user's organization
    if (data.teamGoalId) {
      const teamGoal = await db.teamGoal.findUnique({
        where: { id: data.teamGoalId },
        include: { team: true },
      });

      if (!teamGoal) {
        return NextResponse.json({ error: 'Meta de equipo no encontrada' }, { status: 404, headers: { 'x-request-id': requestId } });
      }

      if (teamGoal.team.organizationId !== user.organizationId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
      }
    }

    // If parentGoalId is provided, verify it belongs to the user
    if (data.parentGoalId) {
      const parentGoal = await db.userGoal.findUnique({
        where: { id: data.parentGoalId },
      });

      if (!parentGoal) {
        return NextResponse.json({ error: 'Meta padre no encontrada' }, { status: 404, headers: { 'x-request-id': requestId } });
      }

      if (parentGoal.ownerId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
      }
    }

    // Default period to current month-year if not provided
    const now = new Date();
    const period = data.period || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const month = data.month || now.getMonth() + 1;
    const year = data.year || now.getFullYear();

    // Auto-calculate health based on start/end dates using the centralized function
    let health = data.health;
    if (!health && data.startDate && data.endDate && data.targetValue > 0) {
      health = calculateGoalHealth({
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        currentValue: data.currentValue || 0,
        targetValue: data.targetValue,
      });
    }

    const goal = await db.userGoal.create({
      data: {
        ownerId: user.id,
        teamGoalId: data.teamGoalId || null,
        title: data.title,
        description: data.description || null,
        type: data.type,
        targetValue: data.targetValue,
        currentValue: data.currentValue || 0,
        unit: data.unit || 'count',
        period,
        month,
        year,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status || 'active',
        health: health || null,
        progressMethod: data.progressMethod || 'manual',
        parentGoalId: data.parentGoalId || null,
        linkedDeals: data.linkedDeals || [],
        linkedContacts: data.linkedContacts || [],
        privacy: data.privacy || 'private',
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        teamGoal: {
          include: {
            team: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    logger.info(
      { operation: 'createUserGoal', requestId, goalId: goal.id, duration_ms: Date.now() - start },
      'User goal created successfully'
    );

    return NextResponse.json(goal, { status: 201, headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error(
      { err: error, operation: 'createUserGoal', requestId, duration_ms: Date.now() - start },
      'Failed to create user goal'
    );
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}