import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/db/logger';
import { db } from '@/lib/db/db';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { hasPermission } from '@/lib/roles';

// GET /api/admin/teams - List all teams in organization
export async function GET(request: NextRequest) {
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

    const orgId = currentUser.organizationId ?? undefined;

    const teams = await db.team.findMany({
      where: { organizationId: orgId },
      include: {
        leader: {
          select: { id: true, name: true, email: true, image: true, role: true },
        },
        members: {
          include: {
            user: {
              select: {
                id: true, name: true, email: true, image: true, role: true, careerLevel: true,
              },
            },
          },
        },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const teamsWithCount = teams.map((team) => ({
      ...team,
      memberCount: team._count.members,
      _count: undefined,
    }));

    return NextResponse.json({ teams: teamsWithCount });
  } catch (e: unknown) {
    logger.error({ requestId, handler: 'GET /api/admin/teams' }, String(e));
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}
