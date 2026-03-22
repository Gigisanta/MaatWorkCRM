import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ user: null, authenticated: false });
    }

    // Find valid session in database
    const session = await db.session.findFirst({
      where: {
        token: sessionToken,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            image: true,
            role: true,
            isActive: true,
            managerId: true,
            settings: true,
          },
        },
      },
    });

    if (!session || !session.user || !session.user.isActive) {
      return NextResponse.json({ user: null, authenticated: false });
    }

    // Get user's organization membership
    const membership = await db.member.findFirst({
      where: { userId: session.user.id },
      select: {
        organizationId: true,
        role: true,
      },
    });

    // Get linked providers (for Google Calendar integration)
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
      session: {
        expiresAt: session.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json({ user: null, authenticated: false });
  }
}
