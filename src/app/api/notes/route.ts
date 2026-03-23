import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// GET /api/notes - List notes by entityType and entityId
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'listNotes', requestId }, 'Fetching notes');

    const { searchParams } = await request.nextUrl;
    const organizationId = searchParams.get('organizationId');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const authorId = searchParams.get('authorId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!organizationId) {
      logger.warn({ operation: 'listNotes', requestId }, 'organizationId is required');
      return NextResponse.json(
        { error: 'organizationId es requerido' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { organizationId };

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (authorId) {
      where.authorId = authorId;
    }

    const [notes, total] = await Promise.all([
      db.note.findMany({
        where,
        include: {
          author: {
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
      db.note.count({ where }),
    ]);

    logger.info(
      { operation: 'listNotes', requestId, count: notes.length, total, duration_ms: Date.now() - start },
      'Notes fetched successfully'
    );

    return NextResponse.json(
      {
        notes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { headers: { 'x-request-id': requestId } }
    );
  } catch (error) {
    logger.error(
      { err: error, operation: 'listNotes', requestId, duration_ms: Date.now() - start },
      'Failed to fetch notes'
    );
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

// POST /api/notes - Create a new note
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'createNote', requestId }, 'Creating note');

    const body = await request.json();
    const {
      organizationId,
      entityType,
      entityId,
      content,
      authorId,
    } = body;

    if (!organizationId || !entityType || !entityId || !content) {
      logger.warn({ operation: 'createNote', requestId }, 'organizationId, entityType, entityId, and content are required');
      return NextResponse.json(
        { error: 'organizationId, entityType, entityId y content son requeridos' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    const note = await db.note.create({
      data: {
        organizationId,
        entityType,
        entityId,
        content,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    logger.info(
      { operation: 'createNote', requestId, noteId: note.id, duration_ms: Date.now() - start },
      'Note created successfully'
    );

    return NextResponse.json(note, { status: 201, headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error(
      { err: error, operation: 'createNote', requestId, duration_ms: Date.now() - start },
      'Failed to create note'
    );
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}
