import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { hasPermission } from '@/lib/permissions';

// GET /api/admin/audit-logs - List audit logs for organization
export async function GET(request: NextRequest) {
  const currentUser = await getUserFromSession(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(currentUser.role, 'users:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
}
