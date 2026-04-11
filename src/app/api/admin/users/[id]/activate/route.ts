import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/db/logger';
import { db } from '@/lib/db/db';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { hasPermission } from '@/lib/roles';

type RouteParams = { params: Promise<{ id: string }> };

// PUT /api/admin/users/[id]/activate - Toggle isActive
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const memberRecord = await db.member.findFirst({
      where: { userId: id, organizationId: orgId },
    });

    if (!memberRecord) {
      return NextResponse.json(
        { error: 'User not found', requestId },
        { status: 404, headers: { 'x-request-id': requestId } }
      );
    }

    const targetUser = await db.user.findUnique({
      where: { id },
      select: { isActive: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found', requestId },
        { status: 404, headers: { 'x-request-id': requestId } }
      );
    }

    // Block deactivating the last owner
    if (memberRecord.role === 'owner' && targetUser.isActive === true) {
      const ownerCount = await db.member.count({
        where: { organizationId: orgId, role: 'owner' },
      });
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'No se puede desactivar el último propietario de la organización', requestId },
          { status: 400, headers: { 'x-request-id': requestId } }
        );
      }
    }

    const newIsActive = !targetUser.isActive;

    const updatedUser = await db.user.update({
      where: { id },
      data: { isActive: newIsActive },
      select: { id: true, name: true, email: true, isActive: true },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (e: unknown) {
    logger.error({ requestId, handler: 'PUT /api/admin/users/[id]/activate' }, String(e));
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}
