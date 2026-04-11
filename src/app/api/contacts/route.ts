import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { hasPermission, normalizeRole } from '@/lib/roles';
import { contactCreateSchema } from '@/lib/schemas';
import type { ContactCreateInput } from '@/lib/schemas';
import { revalidateTag } from 'next/cache';
import { logger } from '@/lib/db/logger';
import { trackGoalProgress } from '@/lib/services/goal-tracking';

export const dynamic = 'force-dynamic';

// Helper to get team member IDs for a manager
async function getTeamMemberIds(managerId: string): Promise<string[]> {
  logger.debug({ operation: 'getTeamMemberIds', managerId }, 'Getting team members');
  const team = await db.user.findMany({
    where: { managerId },
    select: { id: true },
  });
  logger.debug({ operation: 'getTeamMemberIds', managerId, count: team.length }, 'Team members fetched');
  return team.map(u => u.id);
}

// Helper to get interaction stats for contacts using groupBy (avoids N+1)
async function getInteractionStats(contactIds: string[]) {
  if (contactIds.length === 0) return new Map();
  const stats = await db.interaction.groupBy({
    by: ['contactId'],
    _count: { _all: true },
    _max: { createdAt: true },
    where: { contactId: { in: contactIds } },
  });
  return new Map(
    stats.map(r => [r.contactId, { count: r._count._all, lastDate: r._max.createdAt }])
  );
}

// GET /api/contacts - List contacts with filters and pagination
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'getContacts', requestId }, 'Fetching contacts');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'getContacts', requestId }, 'Unauthorized access attempt');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const userRole = normalizeRole(user.role);

    // Admin/Staff/Owner/Developer see all contacts in organization
    if (hasPermission(userRole, 'contacts:read:all')) {
      const searchParams = await request.nextUrl.searchParams;
      const organizationId = searchParams.get('organizationId');

      const targetOrgId = organizationId || user.organizationId;
      if (!targetOrgId) {
        logger.warn({ operation: 'getContacts', requestId }, 'organizationId is required');
        const response = NextResponse.json({ error: 'organizationId es requerido' }, { status: 400 });
        response.headers.set('x-request-id', requestId);
        return response;
      }

      if (targetOrgId !== user.organizationId) {
        logger.warn({ operation: 'getContacts', requestId, targetOrgId }, 'Forbidden: organization mismatch');
        const response = NextResponse.json({ error: 'No tienes acceso a esta organización' }, { status: 403 });
        response.headers.set('x-request-id', requestId);
        return response;
      }

      const stage = searchParams.get('stage');
      const segment = searchParams.get('segment');
      const source = searchParams.get('source');
      const assignedTo = searchParams.get('assignedTo');
      const search = searchParams.get('search');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = { organizationId: targetOrgId };

      if (stage) {
        where.pipelineStageId = stage;
      }

      if (segment) {
        where.segment = segment;
      }

      if (source) {
        where.source = source;
      }

      if (assignedTo) {
        where.assignedTo = assignedTo;
      }

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { email: { contains: search } },
          { company: { contains: search } },
          { phone: { contains: search } },
        ];
      }

      const [contacts, total] = await Promise.all([
        db.contact.findMany({
          where,
          include: {
            tags: {
              include: {
                tag: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                  },
                },
              },
            },
            pipelineStage: {
              select: {
                id: true,
                name: true,
                color: true,
                order: true,
              },
            },
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        db.contact.count({ where }),
      ]);

      // Get real interaction counts using groupBy (avoids N+1)
      const contactIds = contacts.map(c => c.id);
      const statMap = await getInteractionStats(contactIds);

      const transformedContacts = contacts.map(contact => {
        const stats = statMap.get(contact.id);
        return {
          ...contact,
          tags: contact.tags.map(ct => ({
            id: ct.tag.id,
            name: ct.tag.name,
            color: ct.tag.color,
          })),
          interactionCount: stats?.count ?? 0,
          lastInteractionDate: stats?.lastDate ?? null,
        };
      });

      logger.info({ operation: 'getContacts', requestId, count: contacts.length, total, duration_ms: Date.now() - start }, 'Contacts fetched successfully');
      const response = NextResponse.json({
        contacts: transformedContacts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
      response.headers.set('x-request-id', requestId);
      response.headers.set('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
      return response;
    }

    // Manager sees team + own contacts
    if (hasPermission(userRole, 'contacts:read:team')) {
      const searchParams = await request.nextUrl.searchParams;
      const organizationId = searchParams.get('organizationId');

      const targetOrgId = organizationId || user.organizationId;
      if (!targetOrgId) {
        logger.warn({ operation: 'getContacts', requestId }, 'organizationId es requerido');
        const response = NextResponse.json({ error: 'organizationId es requerido' }, { status: 400 });
        response.headers.set('x-request-id', requestId);
        return response;
      }

      const teamMemberIds = await getTeamMemberIds(user.id);
      const stage = searchParams.get('stage');
      const segment = searchParams.get('segment');
      const source = searchParams.get('source');
      const search = searchParams.get('search');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {
        organizationId: targetOrgId,
        OR: [
          { assignedTo: user.id },
          { assignedTo: { in: teamMemberIds } },
        ],
      };

      if (stage) {
        where.pipelineStageId = stage;
      }

      if (segment) {
        where.segment = segment;
      }

      if (source) {
        where.source = source;
      }

      if (search) {
        where.OR = [
          ...where.OR as Array<Record<string, unknown>>,
          { name: { contains: search } },
          { email: { contains: search } },
          { company: { contains: search } },
          { phone: { contains: search } },
        ];
      }

      const [contacts, total] = await Promise.all([
        db.contact.findMany({
          where,
          include: {
            tags: {
              include: {
                tag: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                  },
                },
              },
            },
            pipelineStage: {
              select: {
                id: true,
                name: true,
                color: true,
                order: true,
              },
            },
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        db.contact.count({ where }),
      ]);

      // Get real interaction counts using groupBy (avoids N+1)
      const contactIds = contacts.map(c => c.id);
      const statMap = await getInteractionStats(contactIds);

      const transformedContacts = contacts.map(contact => {
        const stats = statMap.get(contact.id);
        return {
          ...contact,
          tags: contact.tags.map(ct => ({
            id: ct.tag.id,
            name: ct.tag.name,
            color: ct.tag.color,
          })),
          interactionCount: stats?.count ?? 0,
          lastInteractionDate: stats?.lastDate ?? null,
        };
      });

      logger.info({ operation: 'getContacts', requestId, count: contacts.length, total, duration_ms: Date.now() - start }, 'Contacts fetched successfully');
      const response = NextResponse.json({
        contacts: transformedContacts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
      response.headers.set('x-request-id', requestId);
      response.headers.set('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
      return response;
    }

    // Advisor/Member see only their own contacts
    if (hasPermission(userRole, 'contacts:read:own')) {
      const searchParams = await request.nextUrl.searchParams;
      const organizationId = searchParams.get('organizationId');

      const targetOrgId = organizationId || user.organizationId;
      if (!targetOrgId) {
        logger.warn({ operation: 'getContacts', requestId }, 'organizationId es requerido');
        const response = NextResponse.json({ error: 'organizationId es requerido' }, { status: 400 });
        response.headers.set('x-request-id', requestId);
        return response;
      }

      if (targetOrgId !== user.organizationId) {
        logger.warn({ operation: 'getContacts', requestId, targetOrgId }, 'Forbidden: organization mismatch');
        const response = NextResponse.json({ error: 'No tienes acceso a esta organización' }, { status: 403 });
        response.headers.set('x-request-id', requestId);
        return response;
      }

      const stage = searchParams.get('stage');
      const segment = searchParams.get('segment');
      const source = searchParams.get('source');
      const search = searchParams.get('search');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {
        organizationId: targetOrgId,
        assignedTo: user.id,
      };

      if (stage) {
        where.pipelineStageId = stage;
      }

      if (segment) {
        where.segment = segment;
      }

      if (source) {
        where.source = source;
      }

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { email: { contains: search } },
          { company: { contains: search } },
          { phone: { contains: search } },
        ];
      }

      const [contacts, total] = await Promise.all([
        db.contact.findMany({
          where,
          include: {
            tags: {
              include: {
                tag: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                  },
                },
              },
            },
            pipelineStage: {
              select: {
                id: true,
                name: true,
                color: true,
                order: true,
              },
            },
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        db.contact.count({ where }),
      ]);

      // Get real interaction counts using groupBy (avoids N+1)
      const contactIds = contacts.map(c => c.id);
      const statMap = await getInteractionStats(contactIds);

      const transformedContacts = contacts.map(contact => {
        const stats = statMap.get(contact.id);
        return {
          ...contact,
          tags: contact.tags.map(ct => ({
            id: ct.tag.id,
            name: ct.tag.name,
            color: ct.tag.color,
          })),
          interactionCount: stats?.count ?? 0,
          lastInteractionDate: stats?.lastDate ?? null,
        };
      });

      logger.info({ operation: 'getContacts', requestId, count: contacts.length, total, duration_ms: Date.now() - start }, 'Contacts fetched successfully');
      const response = NextResponse.json({
        contacts: transformedContacts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
      response.headers.set('x-request-id', requestId);
      response.headers.set('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
      return response;
    }

    logger.warn({ operation: 'getContacts', requestId }, 'Forbidden access attempt');
    const forbiddenResponse = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    forbiddenResponse.headers.set('x-request-id', requestId);
    return forbiddenResponse;
  } catch (error) {
    logger.error({
      err: error,
      operation: 'getContacts',
      requestId,
      duration_ms: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    }, 'Failed to fetch contacts');
    const errorResponse = NextResponse.json({
      error: 'Error interno del servidor',
      requestId,
    }, { status: 500 });
    errorResponse.headers.set('x-request-id', requestId);
    return errorResponse;
  }
}

// POST /api/contacts - Create a new contact
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'createContact', requestId }, 'Creating contact');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'createContact', requestId }, 'Unauthorized access attempt');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const userRole = normalizeRole(user.role);
    if (!hasPermission(userRole, 'contacts:create')) {
      logger.warn({ operation: 'createContact', requestId }, 'Forbidden: insufficient permissions');
      const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const body = await request.json();
    const parsed = contactCreateSchema.safeParse(body);

    if (!parsed.success) {
      logger.warn({ operation: 'createContact', requestId }, 'Validation failed');
      const response = NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const data: ContactCreateInput = parsed.data;

    const targetOrgId = data.organizationId || user.organizationId;
    if (!targetOrgId) {
      logger.warn({ operation: 'createContact', requestId }, 'organizationId is required');
      const response = NextResponse.json(
        { error: 'organizationId es requerido' },
        { status: 400 }
      );
      response.headers.set('x-request-id', requestId);
      return response;
    }

    // Enforce organization isolation
    if (targetOrgId !== user.organizationId) {
      logger.warn({ operation: 'createContact', requestId, targetOrgId, userOrgId: user.organizationId }, 'Access denied: org mismatch');
      const response = NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
      response.headers.set('x-request-id', requestId);
      return response;
    }

    let stageId = data.pipelineStageId;
    if (!stageId) {
      const defaultStage = await db.pipelineStage.findFirst({
        where: { organizationId: targetOrgId, isDefault: true },
      });
      stageId = defaultStage?.id;
    }

    const contact = await db.contact.create({
      data: {
        organizationId: targetOrgId,
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        company: data.company ?? null,
        emoji: data.emoji ?? '👤',
        segment: data.segment ?? null,
        source: data.source ?? null,
        pipelineStageId: stageId ?? null,
        assignedTo: data.assignedTo || user.id,
        ...(data.tagIds && data.tagIds.length > 0 && {
          tags: {
            create: data.tagIds.map((tagId: string) => ({
              tagId,
            })),
          },
        }),
      },
      include: {
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        pipelineStage: {
          select: {
            id: true,
            name: true,
            color: true,
            order: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // If tags were provided, batch-create missing tags and associate
    if (data.tags && data.tags.length > 0) {
      // 1. Fetch all existing tags in one query
      const existingTags = await db.tag.findMany({
        where: { organizationId: targetOrgId, name: { in: data.tags.map(t => t.name) } },
        select: { id: true, name: true },
      });
      const existingMap = new Map(existingTags.map(t => [t.name, t.id]));

      // 2. Create only missing tags
      const missingTags = data.tags.filter(t => !existingMap.has(t.name));
      if (missingTags.length > 0) {
        const created = await db.tag.createMany({
          data: missingTags.map(t => ({
            organizationId: targetOrgId,
            name: t.name,
            color: t.color ?? '#8b5cf6',
          })),
        });
        // Re-fetch newly created tags so we have their IDs
        const newTags = await db.tag.findMany({
          where: { organizationId: targetOrgId, name: { in: missingTags.map(t => t.name) } },
          select: { id: true, name: true },
        });
        for (const t of newTags) existingMap.set(t.name, t.id);
      }

      // 3. Batch-associate all tags with the contact
      await db.contactTag.createMany({
        data: data.tags
          .map(t => existingMap.get(t.name))
          .filter((id): id is string => id !== undefined)
          .map(tagId => ({ contactId: contact.id, tagId })),
      });
    }

    // Re-fetch contact with updated tags
    const contactWithTags = await db.contact.findUnique({
      where: { id: contact.id },
      include: {
        tags: { include: { tag: true } },
        pipelineStage: { select: { id: true, name: true, color: true, order: true } },
        assignedUser: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    const responseData = {
      ...contactWithTags,
      tags: contactWithTags?.tags.map(ct => ({
        id: ct.tag.id,
        name: ct.tag.name,
        color: ct.tag.color,
      })) ?? [],
      interactionCount: 0,
      lastInteractionDate: null,
    };

    logger.info({ operation: 'createContact', requestId, contactId: contact.id, duration_ms: Date.now() - start }, 'Contact created successfully');

    // Track goal progress for new client goals
    await trackGoalProgress(user.id, 'contact', contact.id, 1);

    revalidateTag('contacts', 'max');
    revalidateTag('dashboard', 'max');

    const response = NextResponse.json(responseData, { status: 201 });
    response.headers.set('x-request-id', requestId);
    return response;
  } catch (error) {
    logger.error({ err: error, operation: 'createContact', requestId, duration_ms: Date.now() - start }, 'Failed to create contact');
    const errorResponse = NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    errorResponse.headers.set('x-request-id', requestId);
    return errorResponse;
  }
}