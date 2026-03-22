import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { hasPermission, normalizeRole } from '@/lib/permissions';
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

// POST /api/contacts/[id]/tags - Add a tag to a contact
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'addTagToContact', requestId }, 'Adding tag to contact');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'addTagToContact', requestId }, 'Unauthorized access attempt');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const { id } = await params;
    const userRole = normalizeRole(user.role);
    const body = await request.json();
    const { tagId, organizationId, tagName, tagColor } = body;

    if (!tagId && !tagName) {
      logger.warn({ operation: 'addTagToContact', requestId, contactId: id }, 'tagId or tagName is required');
      const response = NextResponse.json({ error: 'tagId o tagName es requerido' }, { status: 400 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const contact = await db.contact.findUnique({
      where: { id },
      select: { assignedTo: true },
    });

    if (!contact) {
      logger.warn({ operation: 'addTagToContact', requestId, contactId: id }, 'Contact not found');
      const response = NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const isOwner = contact.assignedTo === user.id;
    const isTeamMember = contact.assignedTo
      ? await isInTeam(contact.assignedTo, user.id)
      : false;

    if (!isOwner) {
      if (hasPermission(userRole, 'contacts:update:team') && isTeamMember) {
        // Allow
      } else if (!hasPermission(userRole, 'contacts:update:all')) {
        logger.warn({ operation: 'addTagToContact', requestId, contactId: id }, 'Forbidden: insufficient permissions');
        const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        response.headers.set('x-request-id', requestId);
        return response;
      }
    }

    let finalTagId = tagId;

    if (tagName && !tagId) {
      if (!organizationId) {
        logger.warn({ operation: 'addTagToContact', requestId, contactId: id }, 'organizationId is required when creating a new tag');
        const response = NextResponse.json({ error: 'organizationId es requerido al crear un nuevo tag' }, { status: 400 });
        response.headers.set('x-request-id', requestId);
        return response;
      }

      const existingTag = await db.tag.findFirst({
        where: {
          name: tagName,
          organizationId,
        },
      });

      if (existingTag) {
        finalTagId = existingTag.id;
      } else {
        const newTag = await db.tag.create({
          data: {
            name: tagName,
            color: tagColor || '#6366f1',
            organizationId,
          },
        });
        finalTagId = newTag.id;
      }
    }

    const existingContactTag = await db.contactTag.findFirst({
      where: {
        contactId: id,
        tagId: finalTagId,
      },
    });

    if (existingContactTag) {
      logger.warn({ operation: 'addTagToContact', requestId, contactId: id, tagId: finalTagId }, 'Tag already associated with contact');
      const response = NextResponse.json({ error: 'Tag ya asociado con el contacto' }, { status: 400 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const contactTag = await db.contactTag.create({
      data: {
        contactId: id,
        tagId: finalTagId,
      },
      include: {
        tag: true,
      },
    });

    logger.info({ operation: 'addTagToContact', requestId, contactId: id, tagId: finalTagId, duration_ms: Date.now() - start }, 'Tag added to contact successfully');
    const response = NextResponse.json(contactTag, { status: 201 });
    response.headers.set('x-request-id', requestId);
    return response;
  } catch (error) {
    logger.error({ err: error, operation: 'addTagToContact', requestId, duration_ms: Date.now() - start }, 'Failed to add tag to contact');
    const errorResponse = NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    errorResponse.headers.set('x-request-id', requestId);
    return errorResponse;
  }
}
