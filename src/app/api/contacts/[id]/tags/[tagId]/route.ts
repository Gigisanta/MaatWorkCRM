import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { invalidateTagsCache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { isValidId } from '@/lib/id-validation';

// DELETE /api/contacts/[id]/tags/[tagId] - Remove a tag from a contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'removeTagFromContact', requestId }, 'Removing tag from contact');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'removeTagFromContact', requestId }, 'Unauthorized access attempt');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const { id, tagId } = await params;

    if (!isValidId(id) || !isValidId(tagId)) {
      const response = NextResponse.json({ error: 'ID inválido' }, { status: 400 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    // Verify contact belongs to user's organization before removing tag
    const contact = await db.contact.findUnique({
      where: { id },
      select: { organizationId: true },
    });

    if (!contact) {
      const response = NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    if (contact.organizationId !== user.organizationId) {
      logger.warn({ operation: 'removeTagFromContact', requestId, contactId: id, orgMismatch: true }, 'Access denied: contact org mismatch');
      const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const contactTag = await db.contactTag.findFirst({
      where: {
        contactId: id,
        tagId,
      },
      include: {
        tag: {
          select: { organizationId: true },
        },
      },
    });

    if (!contactTag) {
      logger.warn({ operation: 'removeTagFromContact', requestId, contactId: id, tagId }, 'Tag not associated with contact');
      const response = NextResponse.json({ error: 'Tag no asociado con el contacto' }, { status: 404 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    if (contactTag.tag.organizationId !== user.organizationId) {
      logger.warn({ operation: 'removeTagFromContact', requestId, contactId: id, tagId, orgMismatch: true }, 'Access denied: tag org mismatch');
      const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    if (!contactTag) {
      logger.warn({ operation: 'removeTagFromContact', requestId, contactId: id, tagId }, 'Tag not associated with contact');
      const response = NextResponse.json({ error: 'Tag no asociado con el contacto' }, { status: 404 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    await db.contactTag.delete({
      where: {
        id: contactTag.id,
      },
    });

    // Invalidate tags cache
    invalidateTagsCache(user.organizationId);

    logger.info({ operation: 'removeTagFromContact', requestId, contactId: id, tagId, duration_ms: Date.now() - start }, 'Tag removed from contact successfully');
    const response = NextResponse.json({ success: true });
    response.headers.set('x-request-id', requestId);
    return response;
  } catch (error) {
    logger.error({ err: error, operation: 'removeTagFromContact', requestId, duration_ms: Date.now() - start }, 'Failed to remove tag from contact');
    const errorResponse = NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    errorResponse.headers.set('x-request-id', requestId);
    return errorResponse;
  }
}
