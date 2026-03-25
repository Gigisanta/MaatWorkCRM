import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('session_token')?.value;

    if (sessionToken) {
      // Get session before deletion for logging
      const session = await db.session.findUnique({
        where: { token: sessionToken },
        select: { userId: true },
      });

      // Delete session from database
      await db.session.deleteMany({
        where: { token: sessionToken },
      });

      if (session) {
        logger.info({ operation: 'logout', requestId, userId: session.userId, duration_ms: Date.now() - start }, 'Logout success');
      }
    } else {
      logger.info({ operation: 'logout', requestId, reason: 'no_session' }, 'Logout (no session)');
    }

    // Create response
    const response = NextResponse.json({
      message: 'Sesión cerrada exitosamente',
    });

    // Clear session cookie (custom auth)
    response.cookies.set('session_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    // Clear NextAuth session cookie (Google OAuth)
    response.cookies.set('next-auth.session-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    logger.error({ err: error, operation: 'logout', requestId, duration_ms: Date.now() - start }, 'Logout failed');

    // Still clear the cookie even if there's an error
    const response = NextResponse.json({
      message: 'Sesión cerrada',
    });

    response.cookies.set('session_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('next-auth.session-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  }
}
