import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { hasPermission, normalizeRole } from '@/lib/permissions';
import { logger } from '@/lib/logger';

// DELETE /api/teams/[id]/members/[memberId] - Remove a member from a team
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  const user = await getUserFromSession(request);
  if (!user) {
    logger.warn({ operation: 'removeTeamMember', requestId }, 'Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = normalizeRole(user.role);
  if (!hasPermission(userRole, 'team:update')) {
    logger.warn({ operation: 'removeTeamMember', requestId, userId: user.id }, 'Forbidden: insufficient permissions');
    return NextResponse.json({ error: 'No tienes permiso para remover miembros de equipos' }, { status: 403 });
  }

  try {
    const { id, memberId } = await params;

    // Get the team and verify user belongs to the same organization
    const team = await db.team.findUnique({
      where: { id },
      include: { organization: true },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (team.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const teamMember = await db.teamMember.findFirst({
      where: {
        teamId: id,
        id: memberId,
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    await db.teamMember.delete({
      where: {
        id: memberId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error, operation: 'removeTeamMember', requestId }, 'Failed to remove team member');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
