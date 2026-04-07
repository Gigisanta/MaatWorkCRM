import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { hasPermission, normalizeRole } from '@/lib/permissions';
import { logger } from '@/lib/logger';

// GET /api/teams/[id] - Get a single team with members and goals
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'getTeam', requestId }, 'Fetching team');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'getTeam', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const userRole = normalizeRole(user.role);

    if (!hasPermission(userRole, 'team:view')) {
      logger.warn({ operation: 'getTeam', requestId, userId: user.id }, 'Forbidden: insufficient permissions');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;

    const team = await db.team.findUnique({
      where: { id },
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
          orderBy: { createdAt: 'desc' },
        },
        calendarEvents: {
          take: 10,
          orderBy: { startAt: 'asc' },
        },
      },
    });

    if (!team) {
      logger.warn({ operation: 'getTeam', requestId, teamId: id }, 'Team not found');
      return NextResponse.json({ error: 'Team not found' }, { status: 404, headers: { 'x-request-id': requestId } });
    }

    if (team.organizationId !== user.organizationId) {
      logger.warn({ operation: 'getTeam', requestId, teamId: id }, 'Forbidden: organization mismatch');
      return NextResponse.json({ error: 'No tienes acceso a esta organización' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    logger.info({ operation: 'getTeam', requestId, teamId: id, duration_ms: Date.now() - start }, 'Team fetched successfully');

    return NextResponse.json(team, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'getTeam', requestId, duration_ms: Date.now() - start }, 'Failed to fetch team');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// PUT /api/teams/[id] - Update a team
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'updateTeam', requestId }, 'Updating team');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'updateTeam', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const userRole = normalizeRole(user.role);

    if (!hasPermission(userRole, 'team:update')) {
      logger.warn({ operation: 'updateTeam', requestId, userId: user.id }, 'Forbidden: insufficient permissions');
      return NextResponse.json({ error: 'No tienes permiso para editar este equipo' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, leaderId } = body;

    // Fetch team first to verify organization
    const existingTeam = await db.team.findUnique({ where: { id } });
    if (!existingTeam) {
      logger.warn({ operation: 'updateTeam', requestId, teamId: id }, 'Team not found');
      return NextResponse.json({ error: 'Team not found' }, { status: 404, headers: { 'x-request-id': requestId } });
    }

    if (existingTeam.organizationId !== user.organizationId) {
      logger.warn({ operation: 'updateTeam', requestId, teamId: id }, 'Forbidden: organization mismatch');
      return NextResponse.json({ error: 'No tienes acceso a esta organización' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const team = await db.team.update({
      where: { id },
      data: {
        name,
        description,
        leaderId,
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

    logger.info({ operation: 'updateTeam', requestId, teamId: id, duration_ms: Date.now() - start }, 'Team updated successfully');

    return NextResponse.json(team, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'updateTeam', requestId, duration_ms: Date.now() - start }, 'Failed to update team');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// DELETE /api/teams/[id] - Delete a team
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'deleteTeam', requestId }, 'Deleting team');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'deleteTeam', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const userRole = normalizeRole(user.role);

    if (!hasPermission(userRole, 'team:delete')) {
      logger.warn({ operation: 'deleteTeam', requestId, userId: user.id }, 'Forbidden: insufficient permissions');
      return NextResponse.json({ error: 'No tienes permiso para eliminar este equipo' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;

    // Fetch team first to verify organization
    const existingTeam = await db.team.findUnique({ where: { id } });
    if (!existingTeam) {
      logger.warn({ operation: 'deleteTeam', requestId, teamId: id }, 'Team not found');
      return NextResponse.json({ error: 'Team not found' }, { status: 404, headers: { 'x-request-id': requestId } });
    }

    if (existingTeam.organizationId !== user.organizationId) {
      logger.warn({ operation: 'deleteTeam', requestId, teamId: id }, 'Forbidden: organization mismatch');
      return NextResponse.json({ error: 'No tienes acceso a esta organización' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    // Delete team members first
    await db.teamMember.deleteMany({
      where: { teamId: id },
    });

    // Delete team goals
    await db.teamGoal.deleteMany({
      where: { teamId: id },
    });

    // Delete the team
    await db.team.delete({
      where: { id },
    });

    logger.info({ operation: 'deleteTeam', requestId, teamId: id, duration_ms: Date.now() - start }, 'Team deleted successfully');

    return NextResponse.json({ success: true }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'deleteTeam', requestId, duration_ms: Date.now() - start }, 'Failed to delete team');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}
