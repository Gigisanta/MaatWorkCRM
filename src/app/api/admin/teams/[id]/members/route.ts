import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { hasPermission } from '@/lib/permissions';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/admin/teams/[id]/members - List all members of a team
export async function GET(request: NextRequest, { params }: RouteParams) {
  const currentUser = await getUserFromSession(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(currentUser.role, 'users:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const orgId = currentUser.organizationId ?? undefined;

  // Verify team exists in org
  const team = await db.team.findUnique({ where: { id } });

  if (!team || team.organizationId !== orgId) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
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
}

// POST /api/admin/teams/[id]/members - Add user to team
export async function POST(request: NextRequest, { params }: RouteParams) {
  const currentUser = await getUserFromSession(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(currentUser.role, 'users:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { userId, role } = body;

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const orgId = currentUser.organizationId ?? undefined;

  // Verify team exists in org
  const team = await db.team.findUnique({ where: { id } });

  if (!team || team.organizationId !== orgId) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  // Verify user is member of org
  const targetMember = await db.member.findFirst({
    where: { userId, organizationId: orgId },
  });

  if (!targetMember) {
    return NextResponse.json(
      { error: 'User is not a member of the organization' },
      { status: 404 }
    );
  }

  // Check if already a member of the team
  const existingTeamMember = await db.teamMember.findFirst({
    where: { teamId: id, userId },
  });

  if (existingTeamMember) {
    return NextResponse.json(
      { error: 'User is already a member of this team' },
      { status: 400 }
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
}

// DELETE /api/admin/teams/[id]/members - Remove user from team
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const currentUser = await getUserFromSession(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(currentUser.role, 'users:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const orgId = currentUser.organizationId ?? undefined;

  // Verify team exists in org
  const team = await db.team.findUnique({ where: { id } });

  if (!team || team.organizationId !== orgId) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  // Block removing the team leader
  if (team.leaderId === userId) {
    return NextResponse.json(
      { error: 'No se puede eliminar al líder del equipo' },
      { status: 400 }
    );
  }

  await db.teamMember.deleteMany({ where: { teamId: id, userId } });

  return NextResponse.json({ success: true });
}
