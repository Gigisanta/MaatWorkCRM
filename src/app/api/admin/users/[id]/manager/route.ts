import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/db/logger';
import { db } from '@/lib/db/db';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { hasPermission, canBeManager } from '@/lib/roles';

type RouteParams = { params: Promise<{ id: string }> };

// PUT /api/admin/users/[id]/manager - Set/change managerId
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
    const body = await request.json();
    const { managerId } = body;
    const orgId = currentUser.organizationId ?? undefined;

    // Verify target user is in same org
    const targetMember = await db.member.findFirst({
      where: { userId: id, organizationId: orgId },
    });

    if (!targetMember) {
      return NextResponse.json(
        { error: 'User not found', requestId },
        { status: 404, headers: { 'x-request-id': requestId } }
      );
    }

    // If setting a manager
    if (managerId) {
      // Prevent self-assignment
      if (managerId === id) {
        return NextResponse.json(
          { error: 'Un usuario no puede ser su propio gerente', requestId },
          { status: 400, headers: { 'x-request-id': requestId } }
        );
      }

      // Validate manager exists
      const manager = await db.user.findUnique({
        where: { id: managerId },
        include: {
          members: orgId
            ? { where: { organizationId: orgId }, select: { role: true } }
            : undefined,
        },
      });

      if (!manager) {
        return NextResponse.json(
          { error: 'Manager not found', requestId },
          { status: 404, headers: { 'x-request-id': requestId } }
        );
      }

      const managerMember = manager.members?.[0];
      if (!managerMember) {
        return NextResponse.json(
          { error: 'Manager not found in organization', requestId },
          { status: 404, headers: { 'x-request-id': requestId } }
        );
      }

      if (!canBeManager(manager.role)) {
        return NextResponse.json(
          { error: 'El usuario seleccionado no puede ser gerente', requestId },
          { status: 400, headers: { 'x-request-id': requestId } }
        );
      }

      // Prevent circular manager assignments
      const checkCycle = await db.user.findUnique({
        where: { id: managerId },
        select: { managerId: true },
      });

      if (checkCycle?.managerId === id) {
        return NextResponse.json(
          { error: 'No se puede crear una relación circular de gerencia', requestId },
          { status: 400, headers: { 'x-request-id': requestId } }
        );
      }
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: { managerId: managerId || null },
      select: {
        id: true, name: true, email: true, managerId: true,
        manager: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (e: unknown) {
    logger.error({ requestId, handler: 'PUT /api/admin/users/[id]/manager' }, String(e));
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}
