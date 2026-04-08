import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { hasPermission } from '@/lib/permissions';
import { logger } from '@/lib/logger';

type RouteParams = { params: Promise<{ id: string }> };

// PUT /api/admin/users/[id]/activate - Toggle isActive
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

  // Get target user member record
  const memberRecord = await db.member.findFirst({
    where: {
      userId: id,
      organizationId: currentUser.organizationId || undefined,
    },
  });

  if (!memberRecord) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Get current isActive state
  const targetUser = await db.user.findUnique({
    where: { id },
    select: { isActive: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Block deactivating the last owner
  if (memberRecord.role === 'owner' && targetUser.isActive === true) {
    const ownerCount = await db.member.count({
      where: {
        organizationId: currentUser.organizationId || undefined,
        role: 'owner',
      },
    });
    if (ownerCount <= 1) {
      return NextResponse.json({ error: 'No se puede desactivar el último propietario de la organización' }, { status: 400 });
    }
  }

  const newIsActive = !targetUser.isActive;

  const updatedUser = await db.user.update({
    where: { id },
    data: { isActive: newIsActive },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
    },
  });

  return NextResponse.json({ user: updatedUser });
}
