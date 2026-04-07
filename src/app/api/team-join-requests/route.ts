import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { hasPermission, normalizeRole } from '@/lib/permissions';
import { logger } from '@/lib/logger';

// GET /api/team-join-requests - List team join requests
export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = await request.nextUrl;
    const teamId = (await searchParams).get('teamId');
    const userId = (await searchParams).get('userId');
    const status = (await searchParams).get('status');

    // Build where clause
    const where: Record<string, unknown> = {};

    if (teamId) {
      where.teamId = teamId;
    }

    if (userId) {
      where.userId = userId;
    } else if (!teamId) {
      // If no teamId, get requests sent TO this user or BY this user
      where.OR = [{ userId: user.id }, { invitedBy: user.id }];
    }

    if (status) {
      where.status = status;
    }

    const requests = await db.teamJoinRequest.findMany({
      where,
      include: {
        team: { select: { id: true, name: true, organizationId: true } },
        user: { select: { id: true, name: true, email: true, image: true } },
        inviter: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter by organization
    const filtered = requests.filter(r => r.team.organizationId === user.organizationId);

    return NextResponse.json({ requests: filtered });
  } catch (error) {
    logger.error({ err: error, operation: 'listTeamJoinRequests', requestId }, 'Failed to list team join requests');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/team-join-requests - Create a team join request (invitation)
export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = normalizeRole(user.role);
    if (!hasPermission(userRole, 'team:update')) {
      return NextResponse.json({ error: 'No tienes permiso para enviar invitaciones' }, { status: 403 });
    }

    const body = await request.json();
    const { teamId, targetUserId, role = 'member' } = body;

    if (!teamId || !targetUserId) {
      return NextResponse.json({ error: 'teamId y userId son requeridos' }, { status: 400 });
    }

    // Verify team belongs to user's organization
    const team = await db.team.findUnique({ where: { id: teamId } });
    if (!team || team.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMember = await db.teamMember.findFirst({
      where: { teamId, userId: targetUserId },
    });
    if (existingMember) {
      return NextResponse.json({ error: 'El usuario ya es miembro del equipo' }, { status: 400 });
    }

    // Check if there's already a pending request
    const existingRequest = await db.teamJoinRequest.findFirst({
      where: { teamId, userId: targetUserId, status: 'pending' },
    });
    if (existingRequest) {
      return NextResponse.json({ error: 'Ya existe una solicitud pendiente para este usuario' }, { status: 400 });
    }

    // Create the request
    const joinRequest = await db.teamJoinRequest.create({
      data: {
        teamId,
        userId: targetUserId,
        invitedBy: user.id,
        role,
        status: 'pending',
      },
      include: {
        team: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
        inviter: { select: { id: true, name: true } },
      },
    });

    // Create notification for the target user
    await db.notification.create({
      data: {
        userId: targetUserId,
        organizationId: team.organizationId,
        type: 'team_invite',
        title: 'Invitación a equipo',
        message: `${user.name || user.email} te ha invitado a unirte al equipo ${team.name}`,
        actionUrl: '/settings?tab=team-requests',
      },
    });

    logger.info({ operation: 'createTeamJoinRequest', requestId, joinRequestId: joinRequest.id }, 'Team join request created');
    return NextResponse.json(joinRequest, { status: 201 });
  } catch (error) {
    logger.error({ err: error, operation: 'createTeamJoinRequest', requestId }, 'Failed to create team join request');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
