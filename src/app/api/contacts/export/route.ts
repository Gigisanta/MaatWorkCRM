import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { hasPermission, normalizeRole } from '@/lib/roles';
import { logger } from '@/lib/db/logger';
import { Ratelimit } from '@upstash/ratelimit';
import { getRedis } from '@/lib/db/redis';
import * as XLSX from 'xlsx';

// Rate limiter: 30 exports per minute per IP (only when Redis is available)
const ratelimit = (() => {
  const redis = getRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true,
    prefix: 'ratelimit:contacts-export',
  });
})();

export const dynamic = 'force-dynamic';

// Helper to get team member IDs for a manager
async function getTeamMemberIds(managerId: string): Promise<string[]> {
  const team = await db.user.findMany({
    where: { managerId },
    select: { id: true },
  });
  return team.map(u => u.id);
}

// GET /api/contacts/export - Export contacts as CSV or XLSX
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
           || request.headers.get('x-real-ip') || 'unknown';
  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      logger.warn({ operation: 'exportContacts', requestId, ip }, 'Rate limited');
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' }, { status: 429 });
    }
  }

  try {
    logger.debug({ operation: 'exportContacts', requestId }, 'Starting contact export');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'exportContacts', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = normalizeRole(user.role);
    const searchParams = request.nextUrl.searchParams;
    const format = (searchParams.get('format') || 'csv').toLowerCase(); // csv | xlsx

    // Build where clause based on user permissions
    const where: Record<string, unknown> = { organizationId: user.organizationId };

    if (hasPermission(userRole, 'contacts:read:all')) {
      // Admin/Staff/Owner/Developer see all contacts - no additional filter
    } else if (hasPermission(userRole, 'contacts:read:team')) {
      const teamMemberIds = await getTeamMemberIds(user.id);
      where.assignedTo = { in: [user.id, ...teamMemberIds] };
    } else if (hasPermission(userRole, 'contacts:read:own')) {
      where.assignedTo = user.id;
    } else {
      logger.warn({ operation: 'exportContacts', requestId }, 'Forbidden: insufficient permissions');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const contacts = await db.contact.findMany({
      where,
      include: {
        tags: { include: { tag: true } },
        pipelineStage: { select: { name: true, color: true } },
        assignedUser: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to export format
    const exportData = contacts.map(c => ({
      Name: c.name,
      Email: c.email || '',
      Phone: c.phone || '',
      Company: c.company || '',
      Segment: c.segment || '',
      Source: c.source || '',
      Tags: c.tags.map(t => t.tag.name).join(', '),
      Notes: '',
      'Pipeline Stage': c.pipelineStage?.name || '',
      Assigned: c.assignedUser?.name || '',
    }));

    const dateStr = new Date().toISOString().split('T')[0];

    if (format === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      logger.info({ operation: 'exportContacts', requestId, count: contacts.length, format, duration_ms: Date.now() - start }, 'Export completed successfully');

      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="contacts-${dateStr}.xlsx"`,
        },
      });
    }

    // CSV fallback
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    logger.info({ operation: 'exportContacts', requestId, count: contacts.length, format: 'csv', duration_ms: Date.now() - start }, 'Export completed successfully');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="contacts-${dateStr}.csv"`,
      },
    });
  } catch (error) {
    logger.error({
      err: error,
      operation: 'exportContacts',
      requestId,
      duration_ms: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : String(error),
    }, 'Failed to export contacts');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}