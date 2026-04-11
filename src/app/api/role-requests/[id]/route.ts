import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { logger } from '@/lib/db/logger';
import { hasPermission } from '@/lib/roles';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/role-requests/[id] - Get single request details
export async function GET(request: NextRequest, { params }: RouteParams) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const { id } = await params;
    logger.debug({ operation: 'getRoleChangeRequest', requestId, roleChangeRequestId: id }, 'Getting role change request');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'getRoleChangeRequest', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const roleChangeRequest = await db.roleChangeRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, role: true },
        },
        reviewer: {
          select: { id: true, name: true, email: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    if (!roleChangeRequest) {
      logger.warn({ operation: 'getRoleChangeRequest', requestId, roleChangeRequestId: id }, 'Role change request not found');
      return NextResponse.json({ error: 'Role change request not found' }, { status: 404, headers: { 'x-request-id': requestId } });
    }

    // User can view their own request, or admin/owner/developer can view any in their org
    const isOwnRequest = roleChangeRequest.userId === user.id;
    const isAdminWithOrgAccess = hasPermission(user.role, 'users:manage') && roleChangeRequest.organizationId === user.organizationId;
    if (!isOwnRequest && !isAdminWithOrgAccess) {
      logger.warn({ operation: 'getRoleChangeRequest', requestId, userId: user.id, roleChangeRequestUserId: roleChangeRequest.userId }, 'Forbidden: cannot view this request');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    logger.info({ operation: 'getRoleChangeRequest', requestId, roleChangeRequestId: id, duration_ms: Date.now() - start }, 'Role change request retrieved successfully');

    return NextResponse.json({ roleChangeRequest }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'getRoleChangeRequest', requestId, duration_ms: Date.now() - start }, 'Failed to get role change request');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// PUT /api/role-requests/[id] - Approve or reject request (admin/owner/developer only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const { id } = await params;
    logger.debug({ operation: 'updateRoleChangeRequest', requestId, roleChangeRequestId: id }, 'Updating role change request');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'updateRoleChangeRequest', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    // Only admin/owner/developer can approve/reject
    if (!hasPermission(user.role, 'role:manage')) {
      logger.warn({ operation: 'updateRoleChangeRequest', requestId, userId: user.id, role: user.role }, 'Forbidden: insufficient permissions');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const roleChangeRequest = await db.roleChangeRequest.findUnique({
      where: { id },
    });

    if (!roleChangeRequest) {
      logger.warn({ operation: 'updateRoleChangeRequest', requestId, roleChangeRequestId: id }, 'Role change request not found');
      return NextResponse.json({ error: 'Role change request not found' }, { status: 404, headers: { 'x-request-id': requestId } });
    }

    // Admin can only approve/reject requests from their own organization
    if (roleChangeRequest.organizationId !== user.organizationId) {
      logger.warn({ operation: 'updateRoleChangeRequest', requestId, userId: user.id, requestOrg: roleChangeRequest.organizationId, userOrg: user.organizationId }, 'Forbidden: cannot manage requests from other organization');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    if (roleChangeRequest.status !== 'pending') {
      logger.warn({ operation: 'updateRoleChangeRequest', requestId, roleChangeRequestId: id, status: roleChangeRequest.status }, 'Request already processed');
      return NextResponse.json({ error: 'This request has already been processed' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    const body = await request.json();
    const { action, reviewedReason } = body;

    if (!action || !['approved', 'rejected'].includes(action)) {
      logger.warn({ operation: 'updateRoleChangeRequest', requestId, action }, 'Validation failed: action must be approved or rejected');
      return NextResponse.json({ error: 'Action must be "approved" or "rejected"' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    // Update the request
    const updatedRequest = await db.roleChangeRequest.update({
      where: { id },
      data: {
        status: action,
        reviewedBy: user.id,
        reviewedAt: new Date(),
        reviewedReason: reviewedReason || null,
      },
    });

    // If approved, update the user's role
    if (action === 'approved') {
      await db.user.update({
        where: { id: roleChangeRequest.userId },
        data: {
          role: roleChangeRequest.requestedRole,
        },
      });
      logger.info({ operation: 'updateRoleChangeRequest', requestId, roleChangeRequestId: id, userId: roleChangeRequest.userId, newRole: roleChangeRequest.requestedRole }, 'User role updated successfully');
    }

    logger.info({ operation: 'updateRoleChangeRequest', requestId, roleChangeRequestId: id, action, duration_ms: Date.now() - start }, 'Role change request updated successfully');

    return NextResponse.json({ roleChangeRequest: updatedRequest }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'updateRoleChangeRequest', requestId, duration_ms: Date.now() - start }, 'Failed to update role change request');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}
