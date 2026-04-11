import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/db/logger';
import { db } from '@/lib/db/db';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { hasPermission } from '@/lib/roles';
import { Prisma } from '@prisma/client';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/admin/users/[id] - Get single user details
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

    const user = await db.user.findFirst({
      where: {
        id,
        members: orgId ? { some: { organizationId: orgId } } : undefined,
      },
      select: {
        id: true, name: true, email: true, image: true,
        role: true, isActive: true, careerLevel: true,
        phone: true, managerId: true, createdAt: true,
        manager: { select: { id: true, name: true, email: true } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found', requestId },
        { status: 404, headers: { 'x-request-id': requestId } }
      );
    }

    return NextResponse.json({ user });
  } catch (e: unknown) {
    logger.error({ requestId, handler: 'GET /api/admin/users/[id]' }, String(e));
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

// PUT /api/admin/users/[id] - Update user fields
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
    const { role, careerLevel, phone, isActive } = body;

    const orgId = currentUser.organizationId ?? undefined;

    const targetUser = await db.user.findFirst({
      where: {
        id,
        members: orgId ? { some: { organizationId: orgId } } : undefined,
      },
      include: {
        members: orgId
          ? { where: { organizationId: orgId }, select: { role: true, organizationId: true } }
          : undefined,
      },
    });

    if (!targetUser || !targetUser.members?.[0]) {
      return NextResponse.json(
        { error: 'User not found in organization', requestId },
        { status: 404, headers: { 'x-request-id': requestId } }
      );
    }

    const memberRecord = targetUser.members[0];

    // Block owner and developer roles
    if (role) {
      if (['owner', 'developer'].includes(role)) {
        return NextResponse.json(
          { error: `Cannot set role to '${role}'`, requestId },
          { status: 400, headers: { 'x-request-id': requestId } }
        );
      }
      if (memberRecord.role === 'owner') {
        return NextResponse.json(
          { error: 'Cannot change owner role', requestId },
          { status: 403, headers: { 'x-request-id': requestId } }
        );
      }
    }

    const updateData: Prisma.UserUpdateInput = {};
    if (role !== undefined) updateData.role = role;
    if (careerLevel !== undefined) updateData.careerLevel = careerLevel;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, name: true, email: true, image: true,
        role: true, isActive: true, careerLevel: true,
        phone: true, managerId: true, createdAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (e: unknown) {
    logger.error({ requestId, handler: 'PUT /api/admin/users/[id]' }, String(e));
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

// DELETE /api/admin/users/[id] - Remove user from organization
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
    const orgId = currentUser.organizationId ?? undefined;

    const memberRecord = await db.member.findFirst({
      where: { userId: id, organizationId: orgId ?? undefined },
    });

    if (!memberRecord) {
      return NextResponse.json(
        { error: 'User not found', requestId },
        { status: 404, headers: { 'x-request-id': requestId } }
      );
    }

    // Block deleting the last owner
    if (memberRecord.role === 'owner') {
      const ownerCount = await db.member.count({
        where: { organizationId: orgId ?? undefined, role: 'owner' },
      });
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'No se puede eliminar el último propietario de la organización', requestId },
          { status: 400, headers: { 'x-request-id': requestId } }
        );
      }
    }

    // Remove Member records in this org
    await db.member.deleteMany({
      where: { userId: id, organizationId: orgId ?? undefined },
    });

    // Remove TeamMember records for this user in this org
    await db.teamMember.deleteMany({
      where: {
        userId: id,
        team: { organizationId: orgId ?? undefined },
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    logger.error({ requestId, handler: 'DELETE /api/admin/users/[id]' }, String(e));
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}
