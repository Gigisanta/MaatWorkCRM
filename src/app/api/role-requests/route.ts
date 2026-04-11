import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { logger } from '@/lib/db/logger';
import { hasPermission } from '@/lib/roles';

// GET /api/role-requests - List pending requests for organization (admin/owner/developer only)
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'listRoleRequests', requestId }, 'Listing role change requests');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'listRoleRequests', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { searchParams } = await request.nextUrl;
    const params = await searchParams;
    const organizationId = params.get('organizationId') || user.organizationId;

    if (!organizationId) {
      logger.warn({ operation: 'listRoleRequests', requestId }, 'Validation failed: organizationId is required');
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    // Admin can only list requests from their own organization
    if (organizationId !== user.organizationId) {
      logger.warn({ operation: 'listRoleRequests', requestId, userId: user.id, requestedOrg: organizationId, userOrg: user.organizationId }, 'Forbidden: cannot list requests from other organization');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    // Only admin/owner/developer can view pending requests
    if (!hasPermission(user.role, 'users:manage')) {
      logger.warn({ operation: 'listRoleRequests', requestId, userId: user.id, role: user.role }, 'Forbidden: insufficient permissions');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const status = params.get('status') || 'pending';

    const roleChangeRequests = await db.roleChangeRequest.findMany({
      where: { organizationId, status },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, role: true },
        },
        reviewer: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    logger.info({ operation: 'listRoleRequests', requestId, count: roleChangeRequests.length, duration_ms: Date.now() - start }, 'Role change requests listed successfully');

    return NextResponse.json({ roleChangeRequests }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'listRoleRequests', requestId, duration_ms: Date.now() - start }, 'Failed to list role change requests');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// POST /api/role-requests - Submit a new role change request
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'createRoleChangeRequest', requestId }, 'Creating role change request');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'createRoleChangeRequest', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const body = await request.json();
    const { requestedRole, reason, organizationId } = body;

    if (!requestedRole || !organizationId) {
      logger.warn({ operation: 'createRoleChangeRequest', requestId }, 'Validation failed: requestedRole and organizationId are required');
      return NextResponse.json({ error: 'requestedRole and organizationId are required' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    // Organization ownership check - user can only request role changes for their own org
    if (organizationId !== user.organizationId) {
      logger.warn({ operation: 'createRoleChangeRequest', requestId, organizationId, userOrg: user.organizationId }, 'Forbidden: org mismatch');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    // Validate requested role is a valid system role (excludes 'admin' - can't request admin)
    const validRoles = ['manager', 'advisor', 'staff', 'member'];
    if (!validRoles.includes(requestedRole)) {
      logger.warn({ operation: 'createRoleChangeRequest', requestId, requestedRole }, 'Validation failed: invalid role');
      return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    // Check user doesn't already have the requested role
    if (user.role === requestedRole) {
      logger.warn({ operation: 'createRoleChangeRequest', requestId, userId: user.id, currentRole: user.role, requestedRole }, 'User already has requested role');
      return NextResponse.json({ error: `You already have the role '${requestedRole}'` }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    // Check no pending request exists for same role
    const existingRequest = await db.roleChangeRequest.findFirst({
      where: {
        userId: user.id,
        requestedRole,
        status: 'pending',
      },
    });

    if (existingRequest) {
      logger.warn({ operation: 'createRoleChangeRequest', requestId, userId: user.id, requestedRole }, 'Pending request already exists');
      return NextResponse.json({ error: 'You already have a pending request for this role' }, { status: 409, headers: { 'x-request-id': requestId } });
    }

    const roleChangeRequest = await db.roleChangeRequest.create({
      data: {
        userId: user.id,
        requestedRole,
        reason: reason || null,
        organizationId,
        status: 'pending',
      },
    });

    logger.info({ operation: 'createRoleChangeRequest', requestId, roleChangeRequestId: roleChangeRequest.id, duration_ms: Date.now() - start }, 'Role change request created successfully');

    return NextResponse.json(roleChangeRequest, { status: 201, headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'createRoleChangeRequest', requestId, duration_ms: Date.now() - start }, 'Failed to create role change request');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}
