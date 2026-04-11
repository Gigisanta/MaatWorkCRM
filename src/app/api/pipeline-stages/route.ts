import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { getCachedPipelineStages, invalidatePipelineStagesCache } from '@/lib/cache';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { normalizeRole, hasPermission } from '@/lib/roles';
import { logger } from '@/lib/db/logger';
import { ensureDefaultPipelineStages } from '@/lib/utils/pipeline-stages';

// Helper: get IDs of team members (advisors) under a manager
async function getTeamMemberIds(managerId: string): Promise<string[]> {
  const team = await db.user.findMany({
    where: { managerId },
    select: { id: true },
  });
  return team.map(u => u.id);
}

// Helper: check if user can view all contacts (admin/owner/developer)
function userCanViewAllContacts(role: string): boolean {
  return hasPermission(role, 'contacts:read:all');
}

// POST /api/pipeline-stages - Create a new pipeline stage
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    // Auth check
    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'createPipelineStage', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    logger.debug({ operation: 'createPipelineStage', requestId }, 'Creating pipeline stage');

    const body = await request.json();
    const { name, description, color, order, wipLimit, slaHours, isDefault, organizationId } = body;

    if (!name || !organizationId) {
      logger.warn({ operation: 'createPipelineStage', requestId }, 'Validation failed: name and organizationId are required');
      return NextResponse.json(
        { error: 'name and organizationId are required' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    // Organization ownership check - user must belong to the organization they're creating a stage for
    if (user.organizationId !== organizationId) {
      logger.warn({ operation: 'createPipelineStage', requestId, organizationId }, 'Access denied - org mismatch');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    // Get the max order if not provided
    let stageOrder = order;
    if (stageOrder === undefined || stageOrder === null) {
      const maxOrder = await db.pipelineStage.findFirst({
        where: { organizationId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      stageOrder = (maxOrder?.order || 0) + 1;
    }

    const stage = await db.pipelineStage.create({
      data: {
        name,
        description,
        color: color || '#8B5CF6',
        order: stageOrder,
        wipLimit,
        slaHours,
        isDefault: isDefault || false,
        isActive: true,
        organizationId,
      },
    });

    // Invalidate cache after mutation
    invalidatePipelineStagesCache(organizationId);

    logger.info({ operation: 'createPipelineStage', requestId, stageId: stage.id, duration_ms: Date.now() - start }, 'Pipeline stage created successfully');

    return NextResponse.json(stage, { status: 201, headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'createPipelineStage', requestId, duration_ms: Date.now() - start }, 'Failed to create pipeline stage');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// GET /api/pipeline-stages - List all stages ordered by order field with contacts grouped by stage
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    // Auth check
    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'listPipelineStages', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    logger.debug({ operation: 'listPipelineStages', requestId }, 'Listing pipeline stages');

    const { searchParams } = request.nextUrl;
    const organizationId = (await searchParams).get('organizationId');

    if (!organizationId) {
      logger.warn({ operation: 'listPipelineStages', requestId }, 'Validation failed: organizationId is required');
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    // Organization isolation check
    if (organizationId !== user.organizationId) {
      logger.warn({ operation: 'listPipelineStages', requestId, organizationId }, 'Access denied - org mismatch');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    // Determine contact filtering based on user role
    const userRole = normalizeRole(user.role);
    let contactFilter: Record<string, unknown> = {};

    if (!userCanViewAllContacts(userRole)) {
      // Manager sees own + team contacts
      const teamMemberIds = await getTeamMemberIds(user.id);
      contactFilter = { assignedTo: { in: [user.id, ...teamMemberIds] } };
    }
    // admin/owner/developer: no filter (see all)

    // Ensure default stages exist for this organization
    await ensureDefaultPipelineStages(organizationId);

    // Fetch stages with contacts grouped, including tags and assignedUser
    const stages = await db.pipelineStage.findMany({
      where: { organizationId, isActive: true },
      include: {
        contacts: {
          where: contactFilter,
          take: 50,
          orderBy: { createdAt: 'desc' as const },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true,
            emoji: true,
            segment: true,
            source: true,
            pipelineStageId: true,
            createdAt: true,
            updatedAt: true,
            tags: {
              select: {
                tag: {
                  select: { id: true, name: true, color: true, icon: true, description: true },
                },
              },
            },
            assignedUser: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        _count: { select: { contacts: true, deals: true } },
      },
      orderBy: { order: 'asc' },
    });

    // Transform the response to match the required structure
    const transformedStages = stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      color: stage.color,
      order: stage.order,
      isDefault: stage.isDefault,
      isActive: stage.isActive,
      wipLimit: stage.wipLimit,
      contactCount: stage._count.contacts,
      contacts: stage.contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        emoji: contact.emoji,
        pipelineStageId: contact.pipelineStageId,
        tags: contact.tags.map((ct) => ({
          id: ct.tag.id,
          name: ct.tag.name,
          color: ct.tag.color,
          ...(ct.tag.icon && { icon: ct.tag.icon }),
          ...(ct.tag.description && { description: ct.tag.description }),
        })),
        assignedUser: contact.assignedUser,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      })),
    }));

    logger.info({ operation: 'listPipelineStages', requestId, count: stages.length, duration_ms: Date.now() - start }, 'Pipeline stages listed successfully');

    const response = NextResponse.json({ stages: transformedStages }, { headers: { 'x-request-id': requestId } });
    response.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    logger.error({ err: error, operation: 'listPipelineStages', requestId, duration_ms: Date.now() - start }, 'Failed to list pipeline stages');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}
