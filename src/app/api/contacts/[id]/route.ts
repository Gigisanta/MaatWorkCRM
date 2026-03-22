import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { hasPermission, normalizeRole } from '@/lib/permissions';
import { contactUpdateSchema } from '@/lib/schemas';
import type { ContactUpdateInput } from '@/lib/schemas';
import logger from '@/lib/logger';

// Helper to check if targetUserId is in the team managed by managerId
async function isInTeam(targetUserId: string, managerId: string): Promise<boolean> {
  const teamMember = await db.user.findFirst({
    where: {
      id: targetUserId,
      managerId: managerId,
    },
    select: { id: true },
  });
  return !!teamMember;
}

// GET /api/contacts/[id] - Get a single contact with relations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'getContact', requestId }, 'Fetching contact');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'getContact', requestId }, 'Unauthorized access attempt');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const { id } = await params;

    const contact = await db.contact.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        pipelineStage: true,
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        deals: {
          include: {
            stage: true,
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          include: {
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        stageHistory: {
          include: {
            fromStage: true,
            toStage: true,
          },
          orderBy: { changedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!contact) {
      logger.warn({ operation: 'getContact', requestId, contactId: id }, 'Contact not found');
      const response = NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    logger.info({ operation: 'getContact', requestId, contactId: id, duration_ms: Date.now() - start }, 'Contact fetched successfully');
    const response = NextResponse.json(contact);
    response.headers.set('x-request-id', requestId);
    return response;
  } catch (error) {
    logger.error({ err: error, operation: 'getContact', requestId, duration_ms: Date.now() - start }, 'Failed to fetch contact');
    const errorResponse = NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    errorResponse.headers.set('x-request-id', requestId);
    return errorResponse;
  }
}

// PUT /api/contacts/[id] - Update a contact
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'updateContact', requestId }, 'Updating contact');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'updateContact', requestId }, 'Unauthorized access attempt');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const { id } = await params;
    const userRole = normalizeRole(user.role);

    const existingContact = await db.contact.findUnique({
      where: { id },
      select: { assignedTo: true, organizationId: true },
    });

    if (!existingContact) {
      logger.warn({ operation: 'updateContact', requestId, contactId: id }, 'Contact not found');
      const response = NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const isOwner = existingContact.assignedTo === user.id;
    const isTeamMember = existingContact.assignedTo
      ? await isInTeam(existingContact.assignedTo, user.id)
      : false;

    if (!isOwner) {
      if (hasPermission(userRole, 'contacts:update:team') && isTeamMember) {
        // Allow
      } else if (!hasPermission(userRole, 'contacts:update:all')) {
        logger.warn({ operation: 'updateContact', requestId, contactId: id }, 'Forbidden: insufficient permissions');
        const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        response.headers.set('x-request-id', requestId);
        return response;
      }
    }

    const body = await request.json();
    const parsed = contactUpdateSchema.safeParse(body);

    if (!parsed.success) {
      logger.warn({ operation: 'updateContact', requestId, contactId: id }, 'Validation failed');
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

    const data: ContactUpdateInput = parsed.data;

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.emoji !== undefined) updateData.emoji = data.emoji;
    if (data.segment !== undefined) updateData.segment = data.segment;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.pipelineStageId !== undefined) updateData.pipelineStageId = data.pipelineStageId;
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;

    const contact = await db.contact.update({
      where: { id },
      data: updateData,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        pipelineStage: true,
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

    logger.info({ operation: 'updateContact', requestId, contactId: id, duration_ms: Date.now() - start }, 'Contact updated successfully');
    const response = NextResponse.json(contact);
    response.headers.set('x-request-id', requestId);
    return response;
  } catch (error) {
    logger.error({ err: error, operation: 'updateContact', requestId, duration_ms: Date.now() - start }, 'Failed to update contact');
    const errorResponse = NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    errorResponse.headers.set('x-request-id', requestId);
    return errorResponse;
  }
}

// DELETE /api/contacts/[id] - Delete a contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'deleteContact', requestId }, 'Deleting contact');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'deleteContact', requestId }, 'Unauthorized access attempt');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const { id } = await params;
    const userRole = normalizeRole(user.role);

    const existingContact = await db.contact.findUnique({
      where: { id },
      select: { assignedTo: true },
    });

    if (!existingContact) {
      logger.warn({ operation: 'deleteContact', requestId, contactId: id }, 'Contact not found');
      const response = NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const isOwner = existingContact.assignedTo === user.id;
    const isTeamMember = existingContact.assignedTo
      ? await isInTeam(existingContact.assignedTo, user.id)
      : false;

    if (!isOwner) {
      if (hasPermission(userRole, 'contacts:delete:team') && isTeamMember) {
        // Allow
      } else if (!hasPermission(userRole, 'contacts:delete:all')) {
        logger.warn({ operation: 'deleteContact', requestId, contactId: id }, 'Forbidden: insufficient permissions');
        const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        response.headers.set('x-request-id', requestId);
        return response;
      }
    }

    await db.$transaction([
      db.contactTag.deleteMany({ where: { contactId: id } }),
      db.pipelineStageHistory.deleteMany({ where: { contactId: id } }),
      db.note.deleteMany({ where: { entityId: id, entityType: 'contact' } }),
      db.contact.delete({ where: { id } }),
    ]);

    logger.info({ operation: 'deleteContact', requestId, contactId: id, duration_ms: Date.now() - start }, 'Contact deleted successfully');
    const response = NextResponse.json({ success: true });
    response.headers.set('x-request-id', requestId);
    return response;
  } catch (error) {
    logger.error({ err: error, operation: 'deleteContact', requestId, duration_ms: Date.now() - start }, 'Failed to delete contact');
    const errorResponse = NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    errorResponse.headers.set('x-request-id', requestId);
    return errorResponse;
  }
}
