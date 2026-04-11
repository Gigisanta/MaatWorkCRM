import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { normalizeRole } from '@/lib/roles';
import { logger } from '@/lib/db/logger';
import { getTeamMemberIds } from '@/lib/services/team';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SearchedContact {
  id: string;
  name: string;
  email: string | null;
  emoji: string;
}

interface SearchedTask {
  id: string;
  title: string;
  status: string;
  priority: string;
}

// ─── GET /api/search ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'unifiedSearch', requestId }, 'Unified search request');

    // 1. Auth check
    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'unifiedSearch', requestId }, 'Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'x-request-id': requestId } }
      );
    }

    if (!user.organizationId) {
      logger.warn({ operation: 'unifiedSearch', requestId }, 'User has no organization');
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    // 2. Parse query params
    const { searchParams } = request.nextUrl;
    const q = searchParams.get('q')?.trim() ?? '';
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '5', 10), 20);
    const organizationId = searchParams.get('organizationId') ?? user.organizationId;

    // Enforce organization isolation
    if (organizationId !== user.organizationId) {
      logger.warn({ operation: 'unifiedSearch', requestId, organizationId }, 'Forbidden: org mismatch');
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403, headers: { 'x-request-id': requestId } }
      );
    }

    // Skip search for empty queries
    if (q.length < 1) {
      return NextResponse.json(
        { contacts: [], tasks: [] },
        { headers: { 'x-request-id': requestId } }
      );
    }

    const userRole = normalizeRole(user.role);

    // ── Build contacts where clause (mirrors contacts/route.ts role logic) ──
    const contactWhere: Record<string, unknown> = { organizationId };

    if (userRole === 'advisor') {
      // Advisor: own contacts only
      contactWhere.assignedTo = user.id;
    } else if (userRole === 'manager') {
      // Manager: own + team members
      const teamMemberIds = await getTeamMemberIds(user.id);
      contactWhere.OR = [
        { assignedTo: user.id },
        { assignedTo: { in: teamMemberIds } },
      ];
    }
    // admin/owner/developer: no additional filter (sees all in org)

    // Search across name, email, company, phone
    contactWhere.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
      { company: { contains: q } },
      { phone: { contains: q } },
    ];

    // ── Build tasks where clause (mirrors tasks/route.ts role logic) ───────
    const taskWhere: Record<string, unknown> = { organizationId };

    if (!['admin', 'owner', 'developer'].includes(userRole)) {
      const teamMemberIds = await getTeamMemberIds(user.id);
      taskWhere.assignedTo = { in: [user.id, ...teamMemberIds] };
    }
    // admin/owner/developer: no additional filter (sees all in org)

    taskWhere.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
    ];

    // 3. Execute both searches in parallel — select only needed fields
    const [contacts, tasks] = await Promise.all([
      db.contact.findMany({
        where: contactWhere,
        select: {
          id: true,
          name: true,
          email: true,
          emoji: true,
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.task.findMany({
        where: taskWhere,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
        },
        take: limit,
        orderBy: [
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
    ]);

    const duration_ms = Date.now() - start;
    logger.info(
      { operation: 'unifiedSearch', requestId, q, limit, contacts: contacts.length, tasks: tasks.length, duration_ms },
      'Unified search completed'
    );

    // 4. Return with cache headers for performance
    return NextResponse.json(
      { contacts, tasks },
      {
        headers: {
          'x-request-id': requestId,
          'Cache-Control': 's-maxage=10, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    logger.error(
      { err: error, operation: 'unifiedSearch', requestId, duration_ms: Date.now() - start },
      'Unified search failed'
    );
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}
