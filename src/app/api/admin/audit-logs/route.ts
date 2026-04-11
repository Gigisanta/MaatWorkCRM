import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/db/logger';
import { db } from '@/lib/db/db';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { hasPermission } from '@/lib/roles';

// GET /api/admin/audit-logs - List audit logs for organization
export async function GET(request: NextRequest) {
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

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const orgId = currentUser.organizationId ?? undefined;

    const [auditLogs, total] = await Promise.all([
      db.auditLog.findMany({
        where: { organizationId: orgId },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.auditLog.count({ where: { organizationId: orgId } }),
    ]);

    return NextResponse.json({ auditLogs, total, page, limit });
  } catch (e: unknown) {
    logger.error({ requestId, handler: 'GET /api/admin/audit-logs' }, String(e));
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}
