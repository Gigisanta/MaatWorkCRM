import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';

// GET /api/feedback - List feedback for organization (owner only)
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'listFeedback', requestId }, 'Listing feedback');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'listFeedback', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { searchParams } = request.nextUrl;
    const organizationId = (await searchParams).get('organizationId') || user.organizationId;

    if (!organizationId) {
      logger.warn({ operation: 'listFeedback', requestId }, 'Validation failed: organizationId is required');
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    // Only owner can view all feedback
    if (user.role !== 'owner' && user.role !== 'dueno') {
      logger.warn({ operation: 'listFeedback', requestId, userId: user.id, role: user.role }, 'Forbidden: non-owner attempted to view feedback');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const feedback = await db.feedback.findMany({
      where: { organizationId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    logger.info({ operation: 'listFeedback', requestId, count: feedback.length, duration_ms: Date.now() - start }, 'Feedback listed successfully');

    return NextResponse.json({ feedback }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'listFeedback', requestId, duration_ms: Date.now() - start }, 'Failed to list feedback');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// POST /api/feedback - Create feedback
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'createFeedback', requestId }, 'Creating feedback');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'createFeedback', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const body = await request.json();
    const { type, subject, content, priority, organizationId } = body;

    if (!subject || !content || !organizationId) {
      logger.warn({ operation: 'createFeedback', requestId }, 'Validation failed: subject, content and organizationId are required');
      return NextResponse.json({ error: 'subject, content and organizationId are required' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    // Enforce organization isolation
    if (organizationId !== user.organizationId) {
      logger.warn({ operation: 'createFeedback', requestId, organizationId, userOrgId: user.organizationId }, 'Access denied - org mismatch');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const feedback = await db.feedback.create({
      data: {
        type: type || 'general',
        subject,
        content,
        priority: priority || 'medium',
        organizationId,
        userId: user.id,
      },
    });

    logger.info({ operation: 'createFeedback', requestId, feedbackId: feedback.id, duration_ms: Date.now() - start }, 'Feedback created successfully');

    return NextResponse.json(feedback, { status: 201, headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'createFeedback', requestId, duration_ms: Date.now() - start }, 'Failed to create feedback');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}
