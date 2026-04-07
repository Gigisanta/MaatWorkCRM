import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// Proxy to NextAuth's built-in session endpoint to get the user's organizationId
// This works because NextAuth's session endpoint already validates the JWT correctly
export async function GET(request: NextRequest) {
  try {
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

    // For Google OAuth users, call the NextAuth session endpoint internally
    // Use proper URL construction for serverless environment
    const sessionUrl = new URL('/api/auth/session', `https://${request.headers.get('host') || 'crm.maat.work'}`);

    let sessionResponse;
    try {
      sessionResponse = await fetch(sessionUrl.toString(), {
        method: 'GET',
        headers: {
          'cookie': request.headers.get('cookie') || '',
          'host': request.headers.get('host') || '',
        },
        credentials: 'include',
      });
    } catch (err) {
      console.error('[session-custom] Failed to call NextAuth session:', err);
    }

    if (sessionResponse?.ok) {
      try {
        const sessionData = await sessionResponse.json();
        if (sessionData.user?.id) {
          const nextAuthUser = sessionData.user;
          const userId = nextAuthUser.id;

          const user = await db.user.findUnique({
            where: { id: userId },
            select: {
              id: true, email: true, username: true, name: true,
              image: true, role: true, isActive: true, managerId: true,
            },
          });

          if (user && user.isActive) {
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
                organizationId: nextAuthUser.organizationId || membership?.organizationId || null,
                organizationRole: membership?.role || null,
                linkedProviders: accounts.map((a) => a.provider),
              },
              authenticated: true,
              session: { expiresAt: sessionData.expires || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
            });
          }
        }
      } catch (err) {
        console.error('[session-custom] Failed to parse NextAuth session:', err);
      }
    }

    return NextResponse.json({ user: null, authenticated: false });
  } catch (error) {
    console.error('[session-custom] Unexpected error:', error);
    return NextResponse.json({ user: null, authenticated: false, error: 'server_error' });
  }
}
