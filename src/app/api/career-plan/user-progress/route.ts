import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { getUserCareerProgress } from '@/lib/services/career-plan';
import { logger } from '@/lib/db/logger';

export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'getUserCareerProgress', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const progress = await getUserCareerProgress(user.id, user.role, user.organizationId!);

    logger.info({ operation: 'getUserCareerProgress', requestId, userId: user.id, duration_ms: Date.now() - start }, 'User career progress retrieved successfully');

    return NextResponse.json(progress, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'getUserCareerProgress', requestId, duration_ms: Date.now() - start }, 'Failed to get user career progress');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}
