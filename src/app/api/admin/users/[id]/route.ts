import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { hasPermission } from '@/lib/permissions';
import { logger } from '@/lib/logger';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/admin/users/[id] - Get single user details
export async function GET(request: NextRequest, { params }: RouteParams) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const currentUser = await getUserFromSession(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(currentUser.role, 'users:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const user = await db.user.findFirst({
    where: {
      id,
      members: { some: { organizationId: currentUser.organizationId || undefined } },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      isActive: true,
      careerLevel: true,
      phone: true,
      managerId: true,
      createdAt: true,
      manager: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user });
}

// PUT /api/admin/users/[id] - Update user fields
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
  const { role, careerLevel, phone, isActive } = body;

  // Get target user and verify in same org
  const targetUser = await db.user.findFirst({
    where: {
      id,
      members: { some: { organizationId: currentUser.organizationId || undefined } },
    },
    include: {
      members: {
        where: { organizationId: currentUser.organizationId || undefined },
        select: { role: true, organizationId: true },
      },
    },
  });

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const memberRecord = targetUser.members[0];
  if (!memberRecord) {
    return NextResponse.json({ error: 'User not found in organization' }, { status: 404 });
  }

  // Block owner and developer roles
  if (role) {
    const blockedRoles = ['owner', 'developer'];
    if (blockedRoles.includes(role)) {
      return NextResponse.json({ error: `Cannot set role to '${role}'` }, { status: 400 });
    }

    // Cannot change owner role
    if (memberRecord.role === 'owner') {
      return NextResponse.json({ error: 'Cannot change owner role' }, { status: 403 });
    }
  }

  // Prepare update data
  const updateData: Record<string, unknown> = {};
  if (role !== undefined) updateData.role = role;
  if (careerLevel !== undefined) updateData.careerLevel = careerLevel;
  if (phone !== undefined) updateData.phone = phone;
  if (isActive !== undefined) updateData.isActive = isActive;

  const updatedUser = await db.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      isActive: true,
      careerLevel: true,
      phone: true,
      managerId: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user: updatedUser });
}

// DELETE /api/admin/users/[id] - Remove user from organization
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const currentUser = await getUserFromSession(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(currentUser.role, 'users:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  // Verify target user is in same org
  const memberRecord = await db.member.findFirst({
    where: {
      userId: id,
      organizationId: currentUser.organizationId || undefined,
    },
  });

  if (!memberRecord) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Block deleting the last owner
  if (memberRecord.role === 'owner') {
    const ownerCount = await db.member.count({
      where: {
        organizationId: currentUser.organizationId || undefined,
        role: 'owner',
      },
    });
    if (ownerCount <= 1) {
      return NextResponse.json({ error: 'No se puede eliminar el último propietario de la organización' }, { status: 400 });
    }
  }

  // Remove all Member records
  await db.member.deleteMany({
    where: { userId: id, organizationId: currentUser.organizationId || undefined },
  });

  // Remove all TeamMember records for this user in this org
  await db.teamMember.deleteMany({
    where: {
      userId: id,
      team: { organizationId: currentUser.organizationId || undefined },
    },
  });

  return NextResponse.json({ success: true });
}
