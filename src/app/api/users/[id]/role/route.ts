import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { hasPermission } from '@/lib/permissions';

type RouteParams = { params: Promise<{ id: string }> };

// PUT /api/users/[id]/role - Change user role (admin/owner/developer only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const { id: userId } = await params;
    logger.debug({ operation: 'changeUserRole', requestId, targetUserId: userId }, 'Changing user role');

    const currentUser = await getUserFromSession(request);
    if (!currentUser) {
      logger.warn({ operation: 'changeUserRole', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    // Only admin/owner/developer can change roles
    if (!hasPermission(currentUser.role, 'role:manage') && !hasPermission(currentUser.role, 'users:manage')) {
      logger.warn({ operation: 'changeUserRole', requestId, userId: currentUser.id, role: currentUser.role }, 'Forbidden: insufficient permissions');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const body = await request.json();
    const { role } = body;

    if (!role) {
      logger.warn({ operation: 'changeUserRole', requestId }, 'Validation failed: role is required');
      return NextResponse.json({ error: 'role is required' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    // Validate role is a valid system role (not owner)
    const validRoles = ['admin', 'manager', 'advisor', 'staff', 'member', 'developer'];
    if (!validRoles.includes(role)) {
      logger.warn({ operation: 'changeUserRole', requestId, role }, 'Validation failed: invalid role');
      return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    // Get target user
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      include: {
        members: {
          where: { organizationId: currentUser.organizationId || undefined },
          select: { role: true, organizationId: true },
        },
      },
    });

    if (!targetUser) {
      logger.warn({ operation: 'changeUserRole', requestId, targetUserId: userId }, 'Target user not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: { 'x-request-id': requestId } });
    }

    // Check target user is in the same organization
    const memberRecord = targetUser.members.find(m => m.organizationId === currentUser.organizationId);
    if (!memberRecord) {
      logger.warn({ operation: 'changeUserRole', requestId, targetUserId: userId, orgId: currentUser.organizationId }, 'Target user not in same organization');
      return NextResponse.json({ error: 'User not found in organization' }, { status: 404, headers: { 'x-request-id': requestId } });
    }

    // Cannot change owner's role
    if (memberRecord.role === 'owner') {
      logger.warn({ operation: 'changeUserRole', requestId, targetUserId: userId }, 'Cannot change owner role');
      return NextResponse.json({ error: 'Cannot change owner role' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    // Update user role
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    logger.info({ operation: 'changeUserRole', requestId, targetUserId: userId, newRole: role, duration_ms: Date.now() - start }, 'User role changed successfully');

    return NextResponse.json({ user: updatedUser }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'changeUserRole', requestId, duration_ms: Date.now() - start }, 'Failed to change user role');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}
