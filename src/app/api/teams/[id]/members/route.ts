import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { hasPermission, normalizeRole } from '@/lib/permissions';
import { logger } from '@/lib/logger';

// POST /api/teams/[id]/members - Add a member to a team
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'addTeamMember', requestId }, 'Adding team member');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'addTeamMember', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const userRole = normalizeRole(user.role);
    if (!hasPermission(userRole, 'team:update')) {
      logger.warn({ operation: 'addTeamMember', requestId, userId: user.id }, 'Forbidden: insufficient permissions');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;
    const body = await request.json();
    const { userId, role } = body;

    if (!userId) {
      logger.warn({ operation: 'addTeamMember', requestId }, 'Validation failed: userId is required');
      return NextResponse.json({ error: 'userId is required' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    // Check if team exists
    const team = await db.team.findUnique({
      where: { id },
    });

    if (!team) {
      logger.warn({ operation: 'addTeamMember', requestId, teamId: id }, 'Team not found');
      return NextResponse.json({ error: 'Team not found' }, { status: 404, headers: { 'x-request-id': requestId } });
    }

    if (team.organizationId !== user.organizationId) {
      logger.warn({ operation: 'addTeamMember', requestId, teamId: id }, 'Forbidden: organization mismatch');
      return NextResponse.json({ error: 'No tienes acceso a esta organización' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    // Check if user is already a member
    const existingMember = await db.teamMember.findFirst({
      where: {
        teamId: id,
        userId,
      },
    });

    if (existingMember) {
      logger.warn({ operation: 'addTeamMember', requestId, teamId: id, userId }, 'User is already a member of this team');
      return NextResponse.json({ error: 'User is already a member of this team' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    const teamMember = await db.teamMember.create({
      data: {
        teamId: id,
        userId,
        role: role || 'member',
      },
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
    });

    logger.info({ operation: 'addTeamMember', requestId, teamId: id, memberId: teamMember.id, duration_ms: Date.now() - start }, 'Team member added successfully');

    return NextResponse.json(teamMember, { status: 201, headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'addTeamMember', requestId, duration_ms: Date.now() - start }, 'Failed to add team member');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}
