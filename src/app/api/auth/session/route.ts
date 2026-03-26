import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify, decodeJwt } from 'jose';

async function getUserFromNextAuthToken(token: string) {
  try {
    console.info('[Session] JWT token received, length:', token.length);
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);

    // First, let's just decode without verification to see the payload
    const decoded = decodeJwt(token);
    console.info('[Session] Decoded JWT payload:', JSON.stringify(decoded));

    // Now verify
    const { payload } = await jwtVerify(token, secret);
    console.info('[Session] Verified JWT payload id:', payload.id, 'sub:', payload.sub);
    return (payload.id as string) || (payload.sub as string) || null;
  } catch (err) {
    console.error('[Session] JWT verification error:', err);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const dbToken = cookieStore.get('session_token')?.value;
    // NextAuth uses __Secure- prefix in production (HTTPS), without in development
    let nextAuthToken = cookieStore.get('next-auth.session-token')?.value;
    if (!nextAuthToken) {
      nextAuthToken = cookieStore.get('__Secure-next-auth.session-token')?.value;
    }

    console.info('[Session] Request cookies:', {
      hasDbToken: !!dbToken,
      hasNextAuthToken: !!nextAuthToken,
      nextAuthTokenLength: nextAuthToken?.length || 0,
    });

    if (!dbToken && !nextAuthToken) {
      console.info('[Session] No tokens found, returning unauthenticated');
      return NextResponse.json({ user: null, authenticated: false });
    }

    // Database session (UUID token from custom credentials login)
    if (dbToken) {
      const session = await db.session.findFirst({
        where: { token: dbToken, expiresAt: { gt: new Date() } },
        include: {
          user: {
            select: {
              id: true, email: true, username: true, name: true,
              image: true, role: true, isActive: true, managerId: true,
            },
          },
        },
      });

      if (session?.user && session.user.isActive) {
        const membership = await db.member.findFirst({
          where: { userId: session.user.id },
          select: { organizationId: true, role: true },
        });
        const accounts = await db.account.findMany({
          where: { userId: session.user.id },
          select: { provider: true },
        });

        console.info('[Session] Found user via DB session:', session.user.email);
        return NextResponse.json({
          user: {
            id: session.user.id,
            email: session.user.email,
            username: session.user.username,
            name: session.user.name,
            image: session.user.image,
            role: session.user.role,
            isActive: session.user.isActive,
            managerId: session.user.managerId,
            organizationId: membership?.organizationId || null,
            organizationRole: membership?.role || null,
            linkedProviders: accounts.map((a) => a.provider),
          },
          authenticated: true,
          session: { expiresAt: session.expiresAt.toISOString() },
        });
      }
    }

    // NextAuth JWT token (from Google OAuth)
    if (nextAuthToken) {
      console.info('[Session] Processing NextAuth JWT token');
      const userId = await getUserFromNextAuthToken(nextAuthToken);
      console.info('[Session] User ID from JWT:', userId);

      if (userId) {
        const user = await db.user.findUnique({
          where: { id: userId },
          select: {
            id: true, email: true, username: true, name: true,
            image: true, role: true, isActive: true, managerId: true,
          },
        });

        console.info('[Session] User from DB:', user?.email, 'isActive:', user?.isActive);

        if (user?.isActive) {
          const membership = await db.member.findFirst({
            where: { userId: user.id },
            select: { organizationId: true, role: true },
          });
          const accounts = await db.account.findMany({
            where: { userId: user.id },
            select: { provider: true },
          });

          console.info('[Session] Returning authenticated user:', user.email);
          return NextResponse.json({
            user: {
              id: user.id,
              email: user.email,
              username: user.username,
              name: user.name,
              image: user.image,
              role: user.role,
              isActive: user.isActive,
              managerId: user.managerId,
              organizationId: membership?.organizationId || null,
              organizationRole: membership?.role || null,
              linkedProviders: accounts.map((a) => a.provider),
            },
            authenticated: true,
            session: { expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
          });
        }
      }
    }

    console.info('[Session] No valid session found');
    return NextResponse.json({ user: null, authenticated: false });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json({ user: null, authenticated: false });
  }
}
