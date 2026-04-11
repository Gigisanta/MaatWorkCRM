import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { logger } from '@/lib/db/logger';
import { Ratelimit } from '@upstash/ratelimit';
import { getRedis } from '@/lib/db/redis';

// Rate limiter: 10 feedback submissions per minute per IP (only when Redis is available)
const ratelimit = (() => {
  const redis = getRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'ratelimit:feedback',
  });
})();

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

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where = { organizationId };

    const [feedback, total] = await Promise.all([
      db.feedback.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.feedback.count({ where }),
    ]);

    logger.info({ operation: 'listFeedback', requestId, count: feedback.length, total, duration_ms: Date.now() - start }, 'Feedback listed successfully');

    return NextResponse.json({
      feedback,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'listFeedback', requestId, duration_ms: Date.now() - start }, 'Failed to list feedback');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// POST /api/feedback - Create feedback
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
           || request.headers.get('x-real-ip') || 'unknown';
  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      logger.warn({ operation: 'createFeedback', requestId, ip }, 'Rate limited');
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' }, { status: 429 });
    }
  }

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
