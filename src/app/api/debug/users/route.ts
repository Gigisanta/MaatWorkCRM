import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// DEBUG ONLY - Remove after troubleshooting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, activate } = body;

    // If activate is set, activate the user
    if (activate) {
      const normalizedIdentifier = identifier.trim();
      let user = await db.user.findFirst({
        where: { email: { equals: normalizedIdentifier, mode: 'insensitive' } },
      });
      if (!user) {
        user = await db.user.findFirst({
          where: { username: { equals: normalizedIdentifier, mode: 'insensitive' } },
        });
      }
      if (!user) {
        return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
      }
      const updated = await db.user.update({
        where: { id: user.id },
        data: { isActive: true },
        select: { id: true, email: true, isActive: true },
      });
      return NextResponse.json({ activated: true, user: updated });
    }

    const normalizedIdentifier = identifier.trim();

    // Try email
    let user = await db.user.findFirst({
      where: { email: { equals: normalizedIdentifier, mode: 'insensitive' } },
    });

    // Try username
    if (!user) {
      user = await db.user.findFirst({
        where: { username: { equals: normalizedIdentifier, mode: 'insensitive' } },
      });
    }

    // Try name
    if (!user) {
      user = await db.user.findFirst({
        where: { name: { equals: normalizedIdentifier, mode: 'insensitive' } },
      });
    }

    if (!user) {
      return NextResponse.json({ found: false, reason: 'user_not_found' });
    }

    return NextResponse.json({
      found: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        hasPassword: !!user.password,
        hasOAuth: false,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
