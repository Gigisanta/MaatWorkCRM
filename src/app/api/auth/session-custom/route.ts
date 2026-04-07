import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtDecrypt } from 'jose';
import { hkdf } from '@panva/hkdf';

// Derive the encryption key using the same algorithm as NextAuth
async function getDerivedEncryptionKey(keyMaterial: string, salt: string): Promise<Uint8Array> {
  const derivedKey = await hkdf(
    'sha256',
    keyMaterial,
    salt || 'nextauth.authjs.com',
    `NextAuth.js Generated Encryption Key${salt ? ` (${salt})` : ''}`,
    32
  );
  return new Uint8Array(derivedKey);
}

async function getUserFromNextAuthSession(token: string) {
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('[session-custom] NEXTAUTH_SECRET not set');
      return null;
    }

    console.log('[session-custom] Token length:', token?.length, 'First 50 chars:', token?.substring(0, 50));

    const encryptionKey = await getDerivedEncryptionKey(secret, '');
    console.log('[session-custom] EncryptionKey derived, length:', encryptionKey.length);

    let payload: any;
    try {
      const result = await jwtDecrypt(token, encryptionKey, {
        clockTolerance: 15,
      });
      payload = result.payload;
      console.log('[session-custom] Decryption success, payload:', JSON.stringify(payload));
    } catch (err) {
      console.error('[session-custom] jwtDecrypt failed:', err);
      return null;
    }

    const userId = payload.id || payload.sub;
    console.log('[session-custom] userId from payload (id || sub):', userId);
    console.log('[session-custom] payload.id:', payload.id, 'payload.sub:', payload.sub);
    if (!userId) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, username: true, name: true,
        image: true, role: true, isActive: true, managerId: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const exp = payload.exp;
    const expiresAt = exp ? new Date(exp * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return { user, expiresAt };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    console.log('[session-custom] All cookies received:', JSON.stringify(Object.keys(cookieStore).filter(k => k.includes('session') || k.includes('next'))));
    console.log('[session-custom] NODE_ENV:', process.env.NODE_ENV);

    const dbToken = cookieStore.get('session_token')?.value;
    console.log('[session-custom] dbToken exists:', !!dbToken, 'length:', dbToken?.length);

    // NextAuth uses __Secure- prefix in production (HTTPS), without in development
    const isProduction = process.env.NODE_ENV === 'production';
    console.log('[session-custom] isProduction:', isProduction);

    // Try both cookie names to find the right one
    const secureToken = cookieStore.get('__Secure-next-auth.session-token')?.value;
    const nonSecureToken = cookieStore.get('next-auth.session-token')?.value;
    const hostSecureToken = cookieStore.get('__Host-next-auth.session-token')?.value;
    console.log('[session-custom] Cookie values - __Secure-:', !!secureToken, 'next-auth:', !!nonSecureToken, '__Host-:', !!hostSecureToken);

    let nextAuthToken = isProduction
      ? cookieStore.get('__Secure-next-auth.session-token')?.value
      : cookieStore.get('next-auth.session-token')?.value;

    if (!nextAuthToken) {
      nextAuthToken = isProduction
        ? cookieStore.get('next-auth.session-token')?.value
        : cookieStore.get('__Secure-next-auth.session-token')?.value;
      console.log('[session-custom] Using fallback cookie, nextAuthToken exists:', !!nextAuthToken);
    }

    // Try __Host- prefix (some NextAuth configurations use this)
    if (!nextAuthToken) {
      nextAuthToken = cookieStore.get('__Host-next-auth.session-token')?.value;
      console.log('[session-custom] Using __Host- cookie, nextAuthToken exists:', !!nextAuthToken);
    }

    // Try to get chunked cookies
    const baseName = isProduction ? '__Secure-next-auth.session-token' : 'next-auth.session-token';
    let chunkIndex = 0;
    let chunkedToken = '';
    while (chunkIndex <= 5) {
      const chunkName = chunkIndex === 0 ? baseName : `${baseName}.${chunkIndex}`;
      const chunk = cookieStore.get(chunkName)?.value;
      if (chunk) {
        chunkedToken += chunk;
        chunkIndex++;
      } else {
        break;
      }
    }
    if (chunkedToken) {
      console.log('[session-custom] Got chunked token, length:', chunkedToken.length);
      nextAuthToken = chunkedToken;
    }

    console.log('[session-custom] Final nextAuthToken exists:', !!nextAuthToken, 'length:', nextAuthToken?.length);

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
    if (nextAuthToken) {
      const result = await getUserFromNextAuthSession(nextAuthToken);

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
    }

    return NextResponse.json({ user: null, authenticated: false });
  } catch (error) {
    console.error('[session-custom] Unexpected error:', error);
    return NextResponse.json({ user: null, authenticated: false, error: 'server_error' });
  }
}
