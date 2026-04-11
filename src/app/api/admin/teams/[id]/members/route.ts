import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/db/logger';
import { db } from '@/lib/db/db';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { hasPermission } from '@/lib/roles';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/admin/teams/[id]/members - List all members of a team
export async function GET(request: NextRequest, { params }: RouteParams) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  try {
    const currentUser = await getUserFromSession(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized', requestId },
        { status: 401, headers: { 'x-request-id': requestId } }
      );
    }

    if (!hasPermission(currentUser.role, 'users:manage')) {
      return NextResponse.json(
        { error: 'Forbidden', requestId },
        { status: 403, headers: { 'x-request-id': requestId } }
      );
    }

    const { id } = await params;
    const orgId = currentUser.organizationId ?? undefined;

    // Verify team exists in org
    const team = await db.team.findUnique({ where: { id } });

    if (!team || team.organizationId !== orgId) {
      return NextResponse.json(
        { error: 'Team not found', requestId },
        { status: 404, headers: { 'x-request-id': requestId } }
      );
    }

    const members = await db.teamMember.findMany({
      where: { teamId: id },
      include: {
        user: {
          select: {
            id: true, name: true, email: true, image: true, role: true,
            careerLevel: true, isActive: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return NextResponse.json({ members });
  } catch (e: unknown) {
    logger.error({ requestId, handler: 'GET /api/admin/teams/[id]/members' }, String(e));
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

// POST /api/admin/teams/[id]/members - Add user to team
export async function POST(request: NextRequest, { params }: RouteParams) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  try {
    const currentUser = await getUserFromSession(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized', requestId },
        { status: 401, headers: { 'x-request-id': requestId } }
      );
    }

    if (!hasPermission(currentUser.role, 'users:manage')) {
      return NextResponse.json(
        { error: 'Forbidden', requestId },
        { status: 403, headers: { 'x-request-id': requestId } }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { userId, role } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', requestId },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    const orgId = currentUser.organizationId ?? undefined;

    // Verify team exists in org
    const team = await db.team.findUnique({ where: { id } });

    if (!team || team.organizationId !== orgId) {
      return NextResponse.json(
        { error: 'Team not found', requestId },
        { status: 404, headers: { 'x-request-id': requestId } }
      );
    }

    // Verify user is member of org
    const targetMember = await db.member.findFirst({
      where: { userId, organizationId: orgId },
    });

    if (!targetMember) {
      return NextResponse.json(
        { error: 'User is not a member of the organization', requestId },
        { status: 404, headers: { 'x-request-id': requestId } }
      );
    }

    // Check if already a member of the team
    const existingTeamMember = await db.teamMember.findFirst({
      where: { teamId: id, userId },
    });

    if (existingTeamMember) {
      return NextResponse.json(
        { error: 'User is already a member of this team', requestId },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    const teamMember = await db.teamMember.create({
      data: { teamId: id, userId, role: role || 'member' },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, role: true },
        },
      },
    });

    return NextResponse.json(teamMember, { status: 201 });
  } catch (e: unknown) {
    logger.error({ requestId, handler: 'POST /api/admin/teams/[id]/members' }, String(e));
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

// DELETE /api/admin/teams/[id]/members - Remove user from team
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  try {
    const currentUser = await getUserFromSession(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized', requestId },
        { status: 401, headers: { 'x-request-id': requestId } }
      );
    }

    if (!hasPermission(currentUser.role, 'users:manage')) {
      return NextResponse.json(
        { error: 'Forbidden', requestId },
        { status: 403, headers: { 'x-request-id': requestId } }
      );
    }

    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', requestId },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    const orgId = currentUser.organizationId ?? undefined;

    // Verify team exists in org
    const team = await db.team.findUnique({ where: { id } });

    if (!team || team.organizationId !== orgId) {
      return NextResponse.json(
        { error: 'Team not found', requestId },
        { status: 404, headers: { 'x-request-id': requestId } }
      );
    }

    // Block removing the team leader
    if (team.leaderId === userId) {
      return NextResponse.json(
        { error: 'No se puede eliminar al líder del equipo', requestId },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    await db.teamMember.deleteMany({ where: { teamId: id, userId } });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    logger.error({ requestId, handler: 'DELETE /api/admin/teams/[id]/members' }, String(e));
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}
