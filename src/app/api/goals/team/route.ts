import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';

// GET /api/goals/team - List all team goals for the user's organization
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'listTeamGoals', requestId }, 'Fetching team goals');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'listTeamGoals', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { searchParams } = await request.nextUrl;
    const params = await searchParams;
    const teamId = params.get('teamId');
    const status = params.get('status');
    const period = params.get('period');
    const page = parseInt(params.get('page') || '1');
    const limit = parseInt(params.get('limit') || '20');

    // Get user's team memberships
    const memberships = await db.teamMember.findMany({
      where: { userId: user.id },
      select: { teamId: true },
    });
    const userTeamIds = memberships.map((m) => m.teamId);

    // Build where clause
    const where: Record<string, unknown> = {};

    if (teamId) {
      // If specific team requested, verify user has access
      if (!userTeamIds.includes(teamId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
      }
      where.teamId = teamId;
    } else {
      // Filter to teams user belongs to
      where.teamId = { in: userTeamIds };
    }

    if (status) {
      where.status = status;
    }

    if (period) {
      where.period = period;
    }

    const skip = (page - 1) * limit;

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
      { operation: 'listTeamGoals', requestId, count: goals.length, total, duration_ms: Date.now() - start },
      'Team goals fetched successfully'
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
      { err: error, operation: 'listTeamGoals', requestId, duration_ms: Date.now() - start },
      'Failed to fetch team goals'
    );
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

// POST /api/goals/team - Delegate to existing /api/goals (TeamGoal) endpoint
// The team goal creation is handled by the existing /api/goals route
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'createTeamGoal', requestId }, 'Delegating team goal creation');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'createTeamGoal', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    // Forward to the existing /api/goals endpoint
    // Build the URL with the user's session cookie
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const url = `${origin}/api/goals`;

    // Extract body from the incoming request
    const body = await request.json();

    // Call the internal endpoint
    const internalRequest = new NextRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': requestId,
        cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });

    // Use db directly to create the team goal (more efficient than HTTP redirect)
    const { teamId, title, description, type, targetValue, currentValue, unit, period, month, year, startDate, endDate, status } = body;

    if (!teamId || !title || !type || targetValue === undefined) {
      return NextResponse.json(
        { error: 'teamId, title, type y targetValue son requeridos' },
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
        period: period || `${year || new Date().getFullYear()}-${String(month || new Date().getMonth() + 1).padStart(2, '0')}`,
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
      { operation: 'createTeamGoal', requestId, goalId: goal.id, duration_ms: Date.now() - start },
      'Team goal created successfully'
    );

    return NextResponse.json(goal, { status: 201, headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error(
      { err: error, operation: 'createTeamGoal', requestId, duration_ms: Date.now() - start },
      'Failed to create team goal'
    );
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}