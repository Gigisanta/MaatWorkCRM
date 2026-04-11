import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { logger } from '@/lib/db/logger';

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
