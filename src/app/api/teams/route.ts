import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { hasPermission, normalizeRole } from '@/lib/permissions';
import logger from '@/lib/logger';

// GET /api/teams - List teams
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'listTeams', requestId }, 'Listing teams');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'listTeams', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const userRole = normalizeRole(user.role);

    if (!hasPermission(userRole, 'team:view')) {
      logger.warn({ operation: 'listTeams', requestId, userId: user.id }, 'Forbidden: insufficient permissions');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!organizationId) {
      logger.warn({ operation: 'listTeams', requestId }, 'organizationId is required');
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    const skip = (page - 1) * limit;

    const [teams, total] = await Promise.all([
      db.team.findMany({
        where: { organizationId },
        include: {
          leader: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          goals: {
            where: { status: 'active' },
            select: {
              id: true,
              title: true,
              targetValue: true,
              currentValue: true,
              status: true,
            },
          },
          _count: {
            select: {
              members: true,
              goals: true,
              calendarEvents: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.team.count({ where: { organizationId } }),
    ]);

    logger.info({ operation: 'listTeams', requestId, count: teams.length, total, page, limit, duration_ms: Date.now() - start }, 'Teams listed successfully');

    return NextResponse.json({
      teams,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'listTeams', requestId, duration_ms: Date.now() - start }, 'Failed to list teams');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'createTeam', requestId }, 'Creating team');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'createTeam', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const userRole = normalizeRole(user.role);

    if (!hasPermission(userRole, 'team:create')) {
      logger.warn({ operation: 'createTeam', requestId, userId: user.id }, 'Forbidden: insufficient permissions');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const body = await request.json();
    const { organizationId, name, description, leaderId, memberIds } = body;

    if (!organizationId || !name) {
      logger.warn({ operation: 'createTeam', requestId }, 'Validation failed: organizationId and name are required');
      return NextResponse.json({ error: 'organizationId and name are required' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    const team = await db.team.create({
      data: {
        organizationId,
        name,
        description,
        leaderId,
        ...(memberIds && memberIds.length > 0 && {
          members: {
            create: memberIds.map((userId: string) => ({
              userId,
              role: 'member',
            })),
          },
        }),
      },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    logger.info({ operation: 'createTeam', requestId, teamId: team.id, duration_ms: Date.now() - start }, 'Team created successfully');

    return NextResponse.json(team, { status: 201, headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'createTeam', requestId, duration_ms: Date.now() - start }, 'Failed to create team');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}
