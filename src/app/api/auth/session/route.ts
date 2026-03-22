import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      logger.info({ operation: 'session', requestId, reason: 'no_token' }, 'Session check (no token)');
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      );
    }

    // Find session in database
    const session = await db.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            image: true,
            managerId: true,
            members: {
              select: {
                organizationId: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      // Clear invalid cookie
      logger.warn({ operation: 'session', requestId, reason: 'invalid_token' }, 'Session check (invalid token)');
      const response = NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      );
      response.cookies.set('session_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
      return response;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      // Delete expired session
      await db.session.delete({
        where: { id: session.id },
      });

      logger.info({ operation: 'session', requestId, userId: session.user.id, reason: 'session_expired' }, 'Session check (expired)');
      const response = NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      );
      response.cookies.set('session_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
      return response;
    }

    // Check if user is active
    if (!session.user.isActive) {
      logger.warn({ operation: 'session', requestId, userId: session.user.id, reason: 'user_inactive' }, 'Session check (inactive user)');
      return NextResponse.json(
        { user: null, authenticated: false, error: 'Cuenta desactivada' },
        { status: 200 }
      );
    }

    // Extract organization info from first membership
    const primaryMembership = session.user.members[0];

    logger.info({ operation: 'session', requestId, userId: session.user.id, organizationId: primaryMembership?.organizationId, duration_ms: Date.now() - start }, 'Session check success');

    return NextResponse.json({
      user: {
        ...session.user,
        members: undefined,
        organizationId: primaryMembership?.organizationId || null,
        organizationRole: primaryMembership?.role || null,
      },
      authenticated: true,
      session: {
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    logger.error({ err: error, operation: 'session', requestId, duration_ms: Date.now() - start }, 'Session check failed');
    return NextResponse.json(
      { user: null, authenticated: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
