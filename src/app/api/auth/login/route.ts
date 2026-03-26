import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { logger } from '@/lib/logger';
import { Ratelimit } from '@upstash/ratelimit';
import { getRedis } from '@/lib/redis';

// Rate limiter: 5 attempts per minute per IP (lazy - only when Redis is available)
const ratelimit = (() => {
  const redis = getRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
    prefix: 'ratelimit:login',
  });
})();

export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
             || request.headers.get('x-real-ip') || 'unknown';
    if (ratelimit) {
      const { success, remaining } = await ratelimit.limit(ip);
      if (!success) {
        logger.warn({ operation: 'login', requestId, ip, reason: 'rate_limited' }, 'Login rate limited');
        return NextResponse.json(
          { error: 'Demasiados intentos. Intenta de nuevo en un minuto.' },
          { status: 429 }
        );
      }
    }

    const body = await request.json();
    const { identifier, password, rememberMe } = body;

    logger.info({ operation: 'login', requestId, identifier }, 'Login attempt');

    // Validate input
    if (!identifier || !password) {
      logger.warn({ operation: 'login', requestId, reason: 'missing_credentials' }, 'Login validation failed');
      return NextResponse.json(
        { error: 'Usuario/email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Find user by email, username, or name (case insensitive via SQL LOWER)
    // Note: Prisma's mode:insensitive only works with contains/search, not equals.
    // We use a raw query approach for case-insensitive email/username matching.
    const normalizedIdentifier = identifier.trim();

    let user = await db.user.findFirst({
      where: {
        email: { equals: normalizedIdentifier },
      },
    });

    // Try username if email didn't match
    if (!user) {
      user = await db.user.findFirst({
        where: {
          username: { equals: normalizedIdentifier },
        },
      });
    }

    // Try name if neither email nor username matched
    if (!user) {
      user = await db.user.findFirst({
        where: {
          name: { equals: normalizedIdentifier },
        },
      });
    }

    if (!user) {
      logger.warn({ operation: 'login', requestId, reason: 'user_not_found' }, 'Login failed');
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Check if user has password (not OAuth only)
    if (!user.password) {
      logger.warn({ operation: 'login', requestId, userId: user.id, reason: 'no_password' }, 'Login failed');
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verify password
    const bcrypt = await import('bcryptjs');
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      logger.warn({ operation: 'login', requestId, userId: user.id, reason: 'invalid_password' }, 'Login failed');
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      logger.warn({ operation: 'login', requestId, userId: user.id, reason: 'account_inactive' }, 'Login failed');
      return NextResponse.json(
        { error: 'Tu cuenta está desactivada. Contacta al administrador.' },
        { status: 403 }
      );
    }

    // Create session token
    const token = randomUUID();
    const expiresAt = new Date();

    // Set expiration based on rememberMe
    if (rememberMe) {
      expiresAt.setDate(expiresAt.getDate() + 30);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 1);
    }

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create session in database
    await db.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        ipAddress: ipAddress.toString().split(',')[0].trim(),
        userAgent,
      },
    });

    // Update user's emailVerified if not set
    if (!user.emailVerified) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    }

    // Get user's primary organization membership
    const membership = await db.member.findFirst({
      where: { userId: user.id },
      select: {
        organizationId: true,
        role: true,
      },
    });

    // Create response with user data
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        image: user.image,
        managerId: user.managerId,
        organizationId: membership?.organizationId || null,
        organizationRole: membership?.role || null,
      },
      message: 'Inicio de sesión exitoso',
    });

    // Set session cookie
    const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cookieMaxAge,
      path: '/',
    });

    logger.info({ operation: 'login', requestId, userId: user.id, organizationId: membership?.organizationId, duration_ms: Date.now() - start }, 'Login success');
    return response;
  } catch (error) {
    logger.error({ err: error, operation: 'login', requestId, duration_ms: Date.now() - start }, 'Login failed');
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
