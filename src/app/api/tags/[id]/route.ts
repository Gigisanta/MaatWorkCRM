import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { invalidateTagsCache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { isValidId } from '@/lib/id-validation';

// PUT /api/tags/[id] - Update a tag
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'updateTag', requestId }, 'Updating tag');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'updateTag', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    const body = await request.json();
    const { name, color, icon, description, value } = body;

    // Check if tag exists
    const existing = await db.tag.findUnique({
      where: { id },
    });

    if (!existing) {
      logger.warn({ operation: 'updateTag', requestId, tagId: id }, 'Tag not found');
      return NextResponse.json({ error: 'Tag not found' }, { status: 404, headers: { 'x-request-id': requestId } });
    }

    // Organization ownership check
    if (existing.organizationId !== user.organizationId) {
      logger.warn({ operation: 'updateTag', requestId, tagId: id }, 'Access denied - org mismatch');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (description !== undefined) updateData.description = description;
    if (value !== undefined) updateData.value = value;

    const tag = await db.tag.update({
      where: { id },
      data: updateData,
    });

    // Invalidate cache after mutation
    invalidateTagsCache(existing.organizationId);

    logger.info({ operation: 'updateTag', requestId, tagId: tag.id, duration_ms: Date.now() - start }, 'Tag updated successfully');

    return NextResponse.json(tag, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'updateTag', requestId, duration_ms: Date.now() - start }, 'Failed to update tag');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// DELETE /api/tags/[id] - Delete a tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'deleteTag', requestId }, 'Deleting tag');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'deleteTag', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    // Check if tag exists
    const tag = await db.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      logger.warn({ operation: 'deleteTag', requestId, tagId: id }, 'Tag not found');
      return NextResponse.json({ error: 'Tag not found' }, { status: 404, headers: { 'x-request-id': requestId } });
    }

    // Organization ownership check
    if (tag.organizationId !== user.organizationId) {
      logger.warn({ operation: 'deleteTag', requestId, tagId: id }, 'Access denied - org mismatch');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    // Delete related ContactTag entries first
    await db.contactTag.deleteMany({
      where: { tagId: id },
    });

    // Delete the tag
    await db.tag.delete({
      where: { id },
    });

    logger.info({ operation: 'deleteTag', requestId, tagId: id, duration_ms: Date.now() - start }, 'Tag deleted successfully');

    return NextResponse.json({ success: true }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'deleteTag', requestId, duration_ms: Date.now() - start }, 'Failed to delete tag');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}
