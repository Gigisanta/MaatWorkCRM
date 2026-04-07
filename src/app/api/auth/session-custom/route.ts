import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { getToken } from 'next-auth/jwt';

// NextAuth v4: use getToken for proper JWT validation
async function getUserFromNextAuthSession(request: NextRequest) {
  try {
    // getToken is the officially supported way to get the JWT token in NextAuth v4
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
    });

    if (!token) {
      console.log('[session-custom] No token found via getToken');
      return null;
    }

    console.log('[session-custom] getToken success, token payload:', JSON.stringify(token).substring(0, 200));

    const userId = token.id || token.sub;
    if (!userId) {
      console.log('[session-custom] No userId in token');
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: userId as string },
      select: {
        id: true, email: true, username: true, name: true,
        image: true, role: true, isActive: true, managerId: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const exp = token.exp;
    const expiresAt = exp ? new Date(exp * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return { user, expiresAt };
  } catch (error) {
    console.error('[session-custom] getUserFromNextAuthSession error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('[session-custom] NODE_ENV:', process.env.NODE_ENV);

    // Database session (UUID token from custom credentials login)
    const cookieStore = await cookies();
    const dbToken = cookieStore.get('session_token')?.value;

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

    // NextAuth session token (from Google OAuth via PrismaAdapter)
    const result = await getUserFromNextAuthSession(request);

    if (result?.user) {
      const { user, expiresAt } = result;
      const membership = await db.member.findFirst({
        where: { userId: user.id },
        select: { organizationId: true, role: true },
      });
      const accounts = await db.account.findMany({
        where: { userId: user.id },
        select: { provider: true },
      });

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
        session: { expiresAt: expiresAt.toISOString() },
      });
    }

    return NextResponse.json({ user: null, authenticated: false });
  } catch (error) {
    console.error('[session-custom] Unexpected error:', error);
    return NextResponse.json({ user: null, authenticated: false, error: 'server_error' });
  }
}
