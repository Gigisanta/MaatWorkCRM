import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { hasPermission, normalizeRole } from '@/lib/permissions';
import { contactCreateSchema } from '@/lib/schemas';
import type { ContactCreateInput } from '@/lib/schemas';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Helper to get team member IDs for a manager
async function getTeamMemberIds(managerId: string): Promise<string[]> {
  const team = await db.user.findMany({
    where: { managerId },
    select: { id: true },
  });
  return team.map(u => u.id);
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
      const searchParams = request.nextUrl.searchParams;
      const organizationId = searchParams.get('organizationId');

      const targetOrgId = organizationId || user.organizationId;
      if (!targetOrgId) {
        logger.warn({ operation: 'getContacts', requestId }, 'organizationId is required');
        const response = NextResponse.json({ error: 'organizationId es requerido' }, { status: 400 });
        response.headers.set('x-request-id', requestId);
        return response;
      }

      const stage = searchParams.get('stage');
      const segment = searchParams.get('segment');
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

      if (assignedTo) {
        where.assignedTo = assignedTo;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
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
                    value: true,
                    expectedCloseDate: true,
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
            _count: {
              select: {
                deals: true,
                tasks: true,
              },
            },
            financialPlan: {
              select: { id: true },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        db.contact.count({ where }),
      ]);

      const transformedContacts = contacts.map(contact => ({
        ...contact,
        tags: contact.tags.map(ct => ({
          id: ct.tag.id,
          name: ct.tag.name,
          color: ct.tag.color,
          value: ct.tag.value,
          expectedCloseDate: ct.tag.expectedCloseDate,
        })),
        interactionCount: (contact._count?.deals || 0) + (contact._count?.tasks || 0),
        hasFinancialPlan: !!contact.financialPlan,
      }));

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
      return response;
    }

    // Manager sees team + own contacts
    if (hasPermission(userRole, 'contacts:read:team')) {
      const searchParams = request.nextUrl.searchParams;
      const organizationId = searchParams.get('organizationId');

      const targetOrgId = organizationId || user.organizationId;
      if (!targetOrgId) {
        logger.warn({ operation: 'getContacts', requestId }, 'organizationId is required');
        const response = NextResponse.json({ error: 'organizationId es requerido' }, { status: 400 });
        response.headers.set('x-request-id', requestId);
        return response;
      }

      const teamMemberIds = await getTeamMemberIds(user.id);
      const stage = searchParams.get('stage');
      const segment = searchParams.get('segment');
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

      if (search) {
        where.OR = [
          ...where.OR as Array<Record<string, unknown>>,
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
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
                    value: true,
                    expectedCloseDate: true,
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
            _count: {
              select: {
                deals: true,
                tasks: true,
              },
            },
            financialPlan: {
              select: { id: true },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        db.contact.count({ where }),
      ]);

      const transformedContacts = contacts.map(contact => ({
        ...contact,
        tags: contact.tags.map(ct => ({
          id: ct.tag.id,
          name: ct.tag.name,
          color: ct.tag.color,
          value: ct.tag.value,
          expectedCloseDate: ct.tag.expectedCloseDate,
        })),
        interactionCount: (contact._count?.deals || 0) + (contact._count?.tasks || 0),
        hasFinancialPlan: !!contact.financialPlan,
      }));

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
      return response;
    }

    // Advisor/Member see only their own contacts
    if (hasPermission(userRole, 'contacts:read:own')) {
      const searchParams = request.nextUrl.searchParams;
      const organizationId = searchParams.get('organizationId');

      const targetOrgId = organizationId || user.organizationId;
      if (!targetOrgId) {
        logger.warn({ operation: 'getContacts', requestId }, 'organizationId is required');
        const response = NextResponse.json({ error: 'organizationId es requerido' }, { status: 400 });
        response.headers.set('x-request-id', requestId);
        return response;
      }

      const stage = searchParams.get('stage');
      const segment = searchParams.get('segment');
      const search = searchParams.get('search');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {
        organizationId: targetOrgId,
        assignedToId: user.id,
      };

      if (stage) {
        where.pipelineStageId = stage;
      }

      if (segment) {
        where.segment = segment;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
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
                    value: true,
                    expectedCloseDate: true,
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
            _count: {
              select: {
                deals: true,
                tasks: true,
              },
            },
            financialPlan: {
              select: { id: true },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        db.contact.count({ where }),
      ]);

      const transformedContacts = contacts.map(contact => ({
        ...contact,
        tags: contact.tags.map(ct => ({
          id: ct.tag.id,
          name: ct.tag.name,
          color: ct.tag.color,
          value: ct.tag.value,
          expectedCloseDate: ct.tag.expectedCloseDate,
        })),
        interactionCount: (contact._count?.deals || 0) + (contact._count?.tasks || 0),
        hasFinancialPlan: !!contact.financialPlan,
      }));

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
      return response;
    }

    logger.warn({ operation: 'getContacts', requestId }, 'Forbidden access attempt');
    const forbiddenResponse = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    forbiddenResponse.headers.set('x-request-id', requestId);
    return forbiddenResponse;
  } catch (error) {
    logger.error({ err: error, operation: 'getContacts', requestId, duration_ms: Date.now() - start }, 'Failed to fetch contacts');
    const errorResponse = NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
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
                value: true,
                expectedCloseDate: true,
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

    const responseData = {
      ...contact,
      tags: contact.tags.map(ct => ({
        id: ct.tag.id,
        name: ct.tag.name,
        color: ct.tag.color,
        value: ct.tag.value,
        expectedCloseDate: ct.tag.expectedCloseDate,
      })),
      interactionCount: 0,
    };

    logger.info({ operation: 'createContact', requestId, contactId: contact.id, duration_ms: Date.now() - start }, 'Contact created successfully');
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
