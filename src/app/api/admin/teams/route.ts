import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { hasPermission } from '@/lib/permissions';
import { logger } from '@/lib/logger';

// GET /api/admin/teams - List all teams in organization
export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const currentUser = await getUserFromSession(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(currentUser.role, 'users:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const teams = await db.team.findMany({
    where: { organizationId: currentUser.organizationId || undefined },
    include: {
      leader: {
        select: { id: true, name: true, email: true, image: true, role: true },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
              careerLevel: true,
            },
          },
        },
      },
      _count: {
        select: { members: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Add memberCount to each team
  const teamsWithCount = teams.map((team) => ({
    ...team,
    memberCount: team._count.members,
    _count: undefined,
  }));

  return NextResponse.json({ teams: teamsWithCount });
}
