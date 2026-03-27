import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      // Try to get user ID from token via NextAuth's getToken
      const { getToken } = await import('next-auth/jwt');
      const token = await getToken({ req: { cookies: {} } as any });
      if (!token) {
        return NextResponse.json({ user: null });
      }
      const userId = (token as any).id || (token as any).sub;
      if (!userId) {
        return NextResponse.json({ user: null });
      }

      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true, email: true, username: true, name: true,
          image: true, role: true, isActive: true, managerId: true,
        },
      });

      if (!user || !user.isActive) {
        return NextResponse.json({ user: null });
      }

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
          ...user,
          organizationId: membership?.organizationId || null,
          organizationRole: membership?.role || null,
          linkedProviders: accounts.map((a) => a.provider),
        },
      });
    }

    // Session-based lookup
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, email: true, username: true, name: true,
        image: true, role: true, isActive: true, managerId: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ user: null });
    }

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
        ...user,
        organizationId: membership?.organizationId || null,
        organizationRole: membership?.role || null,
        linkedProviders: accounts.map((a) => a.provider),
      },
    });
  } catch (error) {
    console.error('[UserProfile] Error:', error);
    return NextResponse.json({ user: null });
  }
}
