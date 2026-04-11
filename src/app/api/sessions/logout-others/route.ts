import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { db } from '@/lib/db/db';
import { logger } from '@/lib/db/logger';

// POST /api/sessions/logout-others - Log out all other sessions
export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    logger.debug({ operation: 'logoutOtherSessions', requestId, userId: user.id }, 'Logging out other sessions');

    // Get current session ID from cookie
    const currentSessionId = request.cookies.get('session_token')?.value;

    if (!currentSessionId) {
      // No cookie means nothing to exclude; delete all sessions for this user
      const result = await db.session.deleteMany({
        where: { userId: user.id },
      });
      return NextResponse.json({
        success: true,
        message: `Se cerraron ${result.count} sesiones`,
      });
    }

    // Delete all other sessions for this user (exclude current session by id)
    const result = await db.session.deleteMany({
      where: {
        userId: user.id,
        id: { not: currentSessionId },
      },
    });

    logger.info({ operation: 'logoutOtherSessions', requestId, userId: user.id, count: result.count }, 'Other sessions logged out');
    return NextResponse.json({
      success: true,
      message: `Se cerraron ${result.count} sesiones`,
    });
  } catch (error) {
    logger.error({ err: error, operation: 'logoutOtherSessions', requestId }, 'Error logging out other sessions');
    return NextResponse.json({ error: 'Error al cerrar sesiones' }, { status: 500 });
  }
}
