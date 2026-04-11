// Auth helper functions for MaatWork CRM
import { NextRequest } from 'next/server';
import { db } from '@/lib/db/db';
import { cookies } from 'next/headers';
import { logger } from '@/lib/db/logger';

// ─── Auth Config Validation (run at module load, non-fatal) ─────────────────
function validateAuthConfig(): void {
  const required = ['NEXTAUTH_SECRET'];
  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    logger.warn(
      { missing },
      'Missing environment variables (will cause auth failures at runtime)'
    );
  }
}

validateAuthConfig();

export type UserRole = 'admin' | 'manager' | 'advisor' | 'owner' | 'staff' | 'member' | 'developer' | 'dueno' | 'asesor';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  image?: string | null;
  managerId?: string | null;
  organizationId?: string | null;
  organizationRole?: string | null;
  googleAccessToken?: string | null;
  linkedProviders?: string[];
}

/**
 * Get user from session token in API routes.
 * Calls NextAuth's built-in session endpoint internally, which correctly
 * validates the JWT and returns user with organizationId.
 */
export async function getUserFromSession(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Try database session token first (UUID from custom credentials login)
    const cookieStore = await cookies();
    const dbSessionToken = cookieStore.get('session_token')?.value;

    if (dbSessionToken) {
      const session = await db.session.findUnique({
        where: { token: dbSessionToken },
      });

      if (session && session.expiresAt > new Date()) {
        const user = await db.user.findUnique({
          where: { id: session.userId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            image: true,
            managerId: true,
          },
        });

        if (user && user.isActive) {
          const [membership, accounts] = await Promise.all([
            db.member.findFirst({
              where: { userId: user.id },
              select: { organizationId: true, role: true },
            }),
            db.account.findMany({
              where: { userId: user.id },
              select: { provider: true },
            }),
          ]);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            image: user.image,
            managerId: user.managerId,
            organizationId: membership?.organizationId || null,
            organizationRole: membership?.role || null,
            linkedProviders: accounts.map((a) => a.provider),
          };
        }
      }
    }

    // For Google OAuth users, use fetch with cookies from the request
    // Build the URL correctly for serverless environment
    const url = new URL('/api/auth/session', `https://${request.headers.get('host') || 'crm.maat.work'}`);

    let sessionResponse;
    try {
      sessionResponse = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'cookie': request.headers.get('cookie') || '',
          'host': request.headers.get('host') || '',
        },
        credentials: 'include',
      });
    } catch (err) {
      logger.error({ err }, 'Failed to call NextAuth session');
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
              id: true,
              email: true,
              name: true,
              role: true,
              isActive: true,
              image: true,
              managerId: true,
            },
          });

          if (user && user.isActive) {
            const [membership, accounts] = await Promise.all([
              db.member.findFirst({
                where: { userId: user.id },
                select: { organizationId: true, role: true },
              }),
              db.account.findMany({
                where: { userId: user.id },
                select: { provider: true },
              }),
            ]);

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              isActive: user.isActive,
              image: user.image,
              managerId: user.managerId,
              organizationId: nextAuthUser.organizationId || membership?.organizationId || null,
              organizationRole: membership?.role || null,
              linkedProviders: accounts.map((a) => a.provider),
            };
          }
        }
      } catch (err) {
        logger.error({ err }, 'Failed to parse session response');
      }
    }

    return null;
  } catch (error) {
    logger.error({ err: error }, 'getUserFromSession error');
    return null;
  }
}

