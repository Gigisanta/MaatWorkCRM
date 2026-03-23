import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// GET /api/sessions - Get active sessions for current user
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'getSessions', requestId }, 'Fetching sessions');

    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      logger.info({ operation: 'getSessions', requestId }, 'No session token found');
      return NextResponse.json({ sessions: [] }, { headers: { 'x-request-id': requestId } });
    }

    // Get current session to find user
    const currentSession = await db.session.findUnique({
      where: { token: sessionToken },
      select: { userId: true },
    });

    if (!currentSession) {
      logger.info({ operation: 'getSessions', requestId }, 'Session not found');
      return NextResponse.json({ sessions: [] }, { headers: { 'x-request-id': requestId } });
    }

    // Get all active sessions for user
    const sessions = await db.session.findMany({
      where: {
        userId: currentSession.userId,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        token: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Mark current session
    const sessionsWithCurrent = sessions.map((session) => ({
      ...session,
      isCurrent: session.token === sessionToken,
      token: undefined, // Don't expose tokens
    }));

    logger.info({ operation: 'getSessions', requestId, count: sessions.length, duration_ms: Date.now() - start }, 'Sessions fetched successfully');

    return NextResponse.json({ sessions: sessionsWithCurrent }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'getSessions', requestId, duration_ms: Date.now() - start }, 'Failed to fetch sessions');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}
