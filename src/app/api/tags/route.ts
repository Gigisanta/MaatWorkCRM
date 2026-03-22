import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { getCachedTags, invalidateTagsCache } from '@/lib/cache';
import logger from '@/lib/logger';

export const revalidate = 3600; // 1 hour

// GET /api/tags - List all tags for organization
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'listTags', requestId }, 'Listing tags');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'listTags', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId') || user.organizationId;

    if (!organizationId) {
      logger.warn({ operation: 'listTags', requestId }, 'Validation failed: organizationId is required');
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    // Use cached query
    const tags = await getCachedTags(organizationId);

    logger.info({ operation: 'listTags', requestId, count: tags.length, duration_ms: Date.now() - start }, 'Tags listed successfully');

    return NextResponse.json({ tags }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'listTags', requestId, duration_ms: Date.now() - start }, 'Failed to list tags');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// POST /api/tags - Create a new tag
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'createTag', requestId }, 'Creating tag');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'createTag', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const body = await request.json();
    const { name, color, organizationId, value, expectedCloseDate } = body;

    if (!name || !organizationId) {
      logger.warn({ operation: 'createTag', requestId }, 'Validation failed: name and organizationId are required');
      return NextResponse.json({ error: 'name and organizationId are required' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    // Check if tag already exists
    const existing = await db.tag.findFirst({
      where: { name, organizationId },
    });

    if (existing) {
      logger.info({ operation: 'createTag', requestId, tagId: existing.id }, 'Tag already exists, returning existing');
      return NextResponse.json(existing, { headers: { 'x-request-id': requestId } });
    }

    const tag = await db.tag.create({
      data: {
        name,
        color: color || '#6366f1',
        organizationId,
        value: value ?? 0,
        expectedCloseDate: expectedCloseDate ?? null,
      },
    });

    // Invalidate cache after mutation
    invalidateTagsCache(organizationId);

    logger.info({ operation: 'createTag', requestId, tagId: tag.id, duration_ms: Date.now() - start }, 'Tag created successfully');

    return NextResponse.json(tag, { status: 201, headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'createTag', requestId, duration_ms: Date.now() - start }, 'Failed to create tag');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}
