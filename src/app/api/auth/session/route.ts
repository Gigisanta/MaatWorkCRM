import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

async function getUserFromNextAuthToken(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return payload.id as string || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const dbToken = cookieStore.get('session_token')?.value;
    const nextAuthToken = cookieStore.get('next-auth.session-token')?.value;

    if (!dbToken && !nextAuthToken) {
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
          select: { providerId: true },
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
            linkedProviders: accounts.map((a) => a.providerId),
          },
          authenticated: true,
          session: { expiresAt: session.expiresAt.toISOString() },
        });
      }
    }

    // NextAuth JWT token (from Google OAuth)
    if (nextAuthToken) {
      const userId = await getUserFromNextAuthToken(nextAuthToken);
      if (userId) {
        const user = await db.user.findUnique({
          where: { id: userId },
          select: {
            id: true, email: true, username: true, name: true,
            image: true, role: true, isActive: true, managerId: true,
          },
        });

        if (user?.isActive) {
          const membership = await db.member.findFirst({
            where: { userId: user.id },
            select: { organizationId: true, role: true },
          });
          const accounts = await db.account.findMany({
            where: { userId: user.id },
            select: { providerId: true },
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
              linkedProviders: accounts.map((a) => a.providerId),
            },
            authenticated: true,
            session: { expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
          });
        }
      }
    }

    return NextResponse.json({ user: null, authenticated: false });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json({ user: null, authenticated: false });
  }
}
