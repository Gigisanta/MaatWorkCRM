import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { hasPermission, canBeManager } from '@/lib/permissions';
import { logger } from '@/lib/logger';

type RouteParams = { params: Promise<{ id: string }> };

// PUT /api/admin/users/[id]/manager - Set/change managerId
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const currentUser = await getUserFromSession(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(currentUser.role, 'users:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { managerId } = body;

  // Verify target user is in same org
  const targetMember = await db.member.findFirst({
    where: {
      userId: id,
      organizationId: currentUser.organizationId || undefined,
    },
  });

  if (!targetMember) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // If setting a manager
  if (managerId) {
    // Validate manager exists and has canBeManager permission
    const manager = await db.user.findUnique({
      where: { id: managerId },
      include: {
        members: {
          where: { organizationId: currentUser.organizationId || undefined },
          select: { role: true },
        },
      },
    });

    if (!manager) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    const managerMember = manager.members[0];
    if (!managerMember) {
      return NextResponse.json({ error: 'Manager not found in organization' }, { status: 404 });
    }

    if (!canBeManager(manager.role)) {
      return NextResponse.json({ error: 'El usuario seleccionado no puede ser gerente' }, { status: 400 });
    }

    // Prevent circular manager assignments: target user cannot be their own manager
    if (managerId === id) {
      return NextResponse.json({ error: 'Un usuario no puede ser su propio gerente' }, { status: 400 });
    }

    // Prevent circular: check if managerId already reports to id (would create cycle)
    const checkCycle = await db.user.findUnique({
      where: { id: managerId },
      select: { managerId: true },
    });

    if (checkCycle?.managerId === id) {
      return NextResponse.json({ error: 'No se puede crear una relación circular de gerencia' }, { status: 400 });
    }
  }

  const updatedUser = await db.user.update({
    where: { id },
    data: { managerId: managerId || null },
    select: {
      id: true,
      name: true,
      email: true,
      managerId: true,
      manager: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json({ user: updatedUser });
}
