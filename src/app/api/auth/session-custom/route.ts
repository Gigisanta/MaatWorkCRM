import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtDecrypt } from 'jose';
import { hkdf } from '@panva/hkdf';
import crypto from 'crypto';

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
  // NextAuth v4 uses JWE (JSON Web Encryption) with alg "dir" and enc "A256GCM"
  // We need to DECRYPT the token, not verify a signature
  console.info('[Session] getUserFromNextAuthSession ENTERED, token length:', token.length);
  console.info('[Session] Token preview (first 80 chars):', token.substring(0, 80));

  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('[Session] NEXTAUTH_SECRET is not set');
      return null;
    }

    // Derive the encryption key like NextAuth does
    // NextAuth uses an empty salt for session token encryption
    const encryptionKey = await getDerivedEncryptionKey(secret, '');
    console.info('[Session] Encryption key derived, length:', encryptionKey.length);

    // Decrypt the JWE
    let payload: any;
    try {
      const result = await jwtDecrypt(token, encryptionKey, {
        clockTolerance: 15,
      });
      payload = result.payload;
      console.info('[Session] JWE decrypted successfully');
      console.info('[Session] Decrypted payload keys:', Object.keys(payload));
    } catch (decryptError) {
      console.error('[Session] JWE decryption failed:', (decryptError as Error).message);
      return null;
    }

    // Extract user ID from the decrypted payload
    // NextAuth jwt callback sets token.id = user.id
    const userId = payload.id || payload.sub;
    console.info('[Session] Extracted userId:', userId);

    if (!userId) {
      console.info('[Session] No userId found in decrypted payload');
      return null;
    }

    // Look up the user in the database
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, username: true, name: true,
        image: true, role: true, isActive: true, managerId: true,
      },
    });

    if (!user) {
      console.info('[Session] User not found in database for id:', userId);
      return null;
    }

    if (!user.isActive) {
      console.info('[Session] User is not active:', user.email);
      return null;
    }

    console.info('[Session] Found user via JWT:', user.email);
    // Calculate expiresAt from JWT exp claim
    const exp = payload.exp;
    const expiresAt = exp ? new Date(exp * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return { user, expiresAt };
  } catch (err) {
    console.error('[Session] NextAuth session processing error:', err);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const dbToken = cookieStore.get('session_token')?.value;

    // NextAuth uses __Secure- prefix in production (HTTPS), without in development
    // Also handle chunked cookies: next-auth.session-token, next-auth.session-token-2, etc.
    const nextAuthCookieNames = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.session-token-2',
      '__Secure-next-auth.session-token-2',
      'next-auth.session-token-3',
      '__Secure-next-auth.session-token-3',
    ];

    // In production (HTTPS), try __Secure-next-auth.session-token FIRST
    // as it contains the actual session token
    const isProduction = process.env.NODE_ENV === 'production';
    let nextAuthToken = isProduction
      ? cookieStore.get('__Secure-next-auth.session-token')?.value
      : cookieStore.get('next-auth.session-token')?.value;

    // Fall back to the other cookie if not found
    if (!nextAuthToken) {
      nextAuthToken = isProduction
        ? cookieStore.get('next-auth.session-token')?.value
        : cookieStore.get('__Secure-next-auth.session-token')?.value;
    }

    // Try to get chunked cookies (.0, .1, .2, etc.)
    const baseName = isProduction ? '__Secure-next-auth.session-token' : 'next-auth.session-token';
    let chunkIndex = 0;
    while (chunkIndex <= 5) {
      const chunkName = chunkIndex === 0 ? baseName : `${baseName}.${chunkIndex}`;
      const chunk = cookieStore.get(chunkName)?.value;
      if (chunk) {
        nextAuthToken = (nextAuthToken || '') + chunk;
        chunkIndex++;
      } else {
        break;
      }
    }

    // Log all available cookies for debugging
    const allCookies = cookieStore.getAll();
    console.info('[Session] All cookies received:', allCookies.map(c => ({ name: c.name, valueLength: c.value?.length || 0 })));
    console.info('[Session] Request cookies:', {
      hasDbToken: !!dbToken,
      dbTokenLength: dbToken?.length || 0,
      hasNextAuthToken: !!nextAuthToken,
      nextAuthTokenLength: nextAuthToken?.length || 0,
      nextAuthTokenPreview: nextAuthToken?.substring(0, 50) || 'empty',
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

    // NextAuth session token (from Google OAuth via PrismaAdapter)
    if (nextAuthToken) {
      console.info('[Session] Processing NextAuth session token');
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
          session: { expiresAt: expiresAt.toISOString() },
        });
      }
    }

    console.info('[Session] No valid session found');
    return NextResponse.json({ user: null, authenticated: false });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json({ user: null, authenticated: false });
  }
}
