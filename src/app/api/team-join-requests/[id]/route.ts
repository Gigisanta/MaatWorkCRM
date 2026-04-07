import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';

// PUT /api/team-join-requests/[id] - Accept, reject, or cancel a request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body; // 'accepted' | 'rejected' | 'cancelled'

    if (!['accepted', 'rejected', 'cancelled'].includes(action)) {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    }

    const joinRequest = await db.teamJoinRequest.findUnique({
      where: { id },
      include: { team: true },
    });

    if (!joinRequest) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    // Verify organization
    if (joinRequest.team.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate permissions based on action
    if (action === 'accepted' || action === 'rejected') {
      // Only the recipient can accept/reject
      if (joinRequest.userId !== user.id) {
        return NextResponse.json({ error: 'Solo el destinatario puede aceptar o rechazar' }, { status: 403 });
      }
    } else if (action === 'cancelled') {
      // Only the inviter can cancel
      if (joinRequest.invitedBy !== user.id) {
        return NextResponse.json({ error: 'Solo quien envió puede cancelar' }, { status: 403 });
      }
    }

    // Check status is pending
    if (joinRequest.status !== 'pending') {
      return NextResponse.json({ error: 'La solicitud ya fue procesada' }, { status: 400 });
    }

    // Process the action
    if (action === 'accepted') {
      // Use transaction to create member and update request
      await db.$transaction(async (tx) => {
        // Create the team member
        await tx.teamMember.create({
          data: {
            teamId: joinRequest.teamId,
            userId: joinRequest.userId,
            role: joinRequest.role,
          },
        });

        // Update request status
        await tx.teamJoinRequest.update({
          where: { id },
          data: { status: 'accepted' },
        });
      });

      // Create notification for the inviter
      await db.notification.create({
        data: {
          userId: joinRequest.invitedBy,
          organizationId: joinRequest.team.organizationId,
          type: 'team_invite_accepted',
          title: 'Invitación aceptada',
          message: `${user.name || user.email} ha aceptado tu invitación al equipo ${joinRequest.team.name}`,
          actionUrl: '/teams',
        },
      });

    } else if (action === 'rejected') {
      await db.teamJoinRequest.update({
        where: { id },
        data: { status: 'rejected' },
      });

      // Notify inviter
      await db.notification.create({
        data: {
          userId: joinRequest.invitedBy,
          organizationId: joinRequest.team.organizationId,
          type: 'team_invite_rejected',
          title: 'Invitación rechazada',
          message: `${user.name || user.email} ha rechazado tu invitación al equipo ${joinRequest.team.name}`,
          actionUrl: '/teams',
        },
      });

    } else if (action === 'cancelled') {
      await db.teamJoinRequest.update({
        where: { id },
        data: { status: 'cancelled' },
      });
    }

    const updated = await db.teamJoinRequest.findUnique({
      where: { id },
      include: {
        team: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
        inviter: { select: { id: true, name: true } },
      },
    });

    logger.info({ operation: 'updateTeamJoinRequest', requestId, id, action }, 'Team join request updated');
    return NextResponse.json(updated);
  } catch (error) {
    logger.error({ err: error, operation: 'updateTeamJoinRequest', requestId }, 'Failed to update team join request');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE /api/team-join-requests/[id] - Cancel a request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const joinRequest = await db.teamJoinRequest.findUnique({ where: { id } });

    if (!joinRequest) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    // Only inviter can cancel
    if (joinRequest.invitedBy !== user.id) {
      return NextResponse.json({ error: 'Solo quien envió puede cancelar' }, { status: 403 });
    }

    if (joinRequest.status !== 'pending') {
      return NextResponse.json({ error: 'La solicitud ya fue procesada' }, { status: 400 });
    }

    await db.teamJoinRequest.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    logger.info({ operation: 'cancelTeamJoinRequest', requestId, id }, 'Team join request cancelled');
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error, operation: 'cancelTeamJoinRequest', requestId }, 'Failed to cancel team join request');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
