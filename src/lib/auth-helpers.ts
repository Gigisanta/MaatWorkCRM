// Auth helper functions for MaatWork CRM
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { jwtDecrypt } from 'jose';
import { hkdf } from '@panva/hkdf';

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

// Decrypt NextAuth JWE token
async function decryptNextAuthToken(token: string): Promise<{ id?: string; sub?: string } | null> {
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('[decryptNextAuthToken] NEXTAUTH_SECRET not set');
      return null;
    }

    console.log('[decryptNextAuthToken] Token length:', token.length);
    console.log('[decryptNextAuthToken] Token prefix:', token.substring(0, 20));

    const encryptionKey = await getDerivedEncryptionKey(secret, '');
    console.log('[decryptNextAuthToken] Encryption key derived, length:', encryptionKey.length);

    const result = await jwtDecrypt(token, encryptionKey, {
      clockTolerance: 15,
    });
    console.log('[decryptNextAuthToken] Decryption successful, payload:', JSON.stringify(result.payload).substring(0, 100));
    return result.payload as { id?: string; sub?: string };
  } catch (error) {
    console.error('[decryptNextAuthToken] Failed to decrypt NextAuth token:', error);
    return null;
  }
}

/**
 * Get user from session token in API routes
 * Supports both database session token (UUID) and NextAuth JWE session token
 * Returns null if not authenticated
 */
export async function getUserFromSession(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Try database session token first (UUID from custom auth)
    const dbSessionToken = request.cookies.get('session_token')?.value;

    // Try NextAuth JWE token (from Google OAuth)
    // NextAuth v5 uses __Secure- prefix in production and may chunk large tokens
    const isProduction = process.env.NODE_ENV === 'production';
    const baseCookieName = isProduction ? '__Secure-next-auth.session-token' : 'next-auth.session-token';

    // Helper to get chunked cookie - same pattern as session-custom route
    // NextAuth chunks as: base cookie (chunk 0), then .1, .2, .3 (chunks 1, 2, 3...)
    function getChunkedCookie(baseName: string): string | null {
      let token: string | null = null;
      let chunkIndex = 0;
      while (chunkIndex <= 5) {
        // chunkIndex 0 = base cookie, chunkIndex 1 = baseName.1, chunkIndex 2 = baseName.2, etc.
        const chunkName = chunkIndex === 0 ? baseName : `${baseName}.${chunkIndex}`;
        const chunk = request.cookies.get(chunkName)?.value;
        if (chunk) {
          console.log(`[getChunkedCookie] Found chunk ${chunkIndex}: ${chunkName}, length: ${chunk.length}`);
          token = (token || '') + chunk;
          chunkIndex++;
        } else {
          if (chunkIndex === 0) {
            console.log(`[getChunkedCookie] Base cookie not found: ${chunkName}`);
          } else {
            console.log(`[getChunkedCookie] Chunk ${chunkIndex} not found: ${chunkName}`);
          }
          break;
        }
      }
      return token;
    }

    // Try production cookie name first (with __Secure- prefix)
    let nextAuthToken = getChunkedCookie(baseCookieName);

    // Fallback: try development cookie name if production didn't yield results
    if (!nextAuthToken) {
      const fallbackName = isProduction ? 'next-auth.session-token' : '__Secure-next-auth.session-token';
      nextAuthToken = getChunkedCookie(fallbackName);
    }

    console.log('[getUserFromSession] Cookies received:', request.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value })));
    console.log('[getUserFromSession] dbSessionToken:', !!dbSessionToken, 'nextAuthToken:', !!nextAuthToken, 'tokenLength:', nextAuthToken?.length);
    console.log('[getUserFromSession] NODE_ENV:', process.env.NODE_ENV, 'isProduction:', isProduction);

    let userId: string | null = null;

    if (dbSessionToken) {
      const session = await db.session.findUnique({
        where: { token: dbSessionToken },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              isActive: true,
              image: true,
              managerId: true,
              members: {
                take: 1,
                select: {
                  organizationId: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      if (session && session.expiresAt > new Date() && session.user.isActive) {
        userId = session.user.id;
        const primaryMembership = session.user.members[0];
        const accounts = await db.account.findMany({
          where: { userId: session.user.id },
          select: { provider: true },
        });

        return {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          isActive: session.user.isActive,
          image: session.user.image,
          managerId: session.user.managerId,
          organizationId: primaryMembership?.organizationId || null,
          organizationRole: primaryMembership?.role || null,
          linkedProviders: accounts.map((a) => a.provider),
        };
      }
    }

    // Try NextAuth JWE token (from Google OAuth)
    if (nextAuthToken) {
      console.log('[getUserFromSession] Found nextAuthToken, attempting decryption');
      const payload = await decryptNextAuthToken(nextAuthToken);
      if (payload) {
        // NextAuth v5 stores user ID in 'id' or 'sub' claim
        const nextAuthUserId = payload.id || payload.sub;

        if (nextAuthUserId) {
          const user = await db.user.findUnique({
            where: { id: nextAuthUserId },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              isActive: true,
              image: true,
              managerId: true,
              members: {
                take: 1,
                select: {
                  organizationId: true,
                  role: true,
                },
              },
            },
          });

          if (user && user.isActive) {
            const primaryMembership = user.members[0];
            const accounts = await db.account.findMany({
              where: { userId: user.id },
              select: { provider: true },
            });

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              isActive: user.isActive,
              image: user.image,
              managerId: user.managerId,
              organizationId: primaryMembership?.organizationId || null,
              organizationRole: primaryMembership?.role || null,
              linkedProviders: accounts.map((a) => a.provider),
            };
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting user from session:', error);
    return null;
  }
}

/**
 * Check if user has admin role
 */
export function isAdmin(role: string): boolean {
  return role === 'admin' || role === 'developer';
}

/**
 * Check if user has manager or admin role
 */
export function isManagerOrAdmin(role: string): boolean {
  return ['admin', 'manager', 'owner', 'developer'].includes(role);
}

/**
 * Check if user can import files (admin, manager, or owner)
 */
export function canImportFiles(role: string): boolean {
  return ['admin', 'manager', 'owner', 'developer'].includes(role);
}

/**
 * Check if user can manage a team
 */
export function canManageTeam(user: AuthUser | null): boolean {
  if (!user) return false;
  return ['admin', 'manager', 'owner', 'developer'].includes(user.role);
}

/**
 * Check if user can view all contacts
 */
export function canViewAllContacts(role: string): boolean {
  return ['admin', 'manager', 'owner', 'developer'].includes(role);
}

/**
 * Check if user can create contacts
 */
export function canCreateContacts(role: string): boolean {
  return true; // All authenticated users can create contacts
}

/**
 * Check if user can edit contacts
 */
export function canEditContacts(role: string): boolean {
  return true; // All authenticated users can edit contacts
}

/**
 * Check if user can delete contacts
 */
export function canDeleteContacts(role: string): boolean {
  return ['admin', 'manager', 'owner', 'developer'].includes(role);
}

/**
 * Check if user can manage users
 */
export function canManageUsers(role: string): boolean {
  return ['admin', 'owner', 'developer'].includes(role);
}

/**
 * Check if user can view reports
 */
export function canViewReports(role: string): boolean {
  return ['admin', 'manager', 'owner', 'developer'].includes(role);
}

/**
 * Check if user can manage tasks
 */
export function canManageTasks(role: string): boolean {
  return true; // All authenticated users can manage tasks
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    admin: 'Administrador',
    manager: 'Gerente',
    advisor: 'Asesor',
    owner: 'Dueño',
    staff: 'Personal',
    member: 'Miembro',
    developer: 'Desarrollador',
    dueno: 'Dueño',
    asesor: 'Asesor',
  };
  return roleNames[role] || role;
}

/**
 * Get available roles for registration
 */
export function getAvailableRoles(): { value: string; label: string }[] {
  return [
    { value: 'advisor', label: 'Asesor' },
    { value: 'manager', label: 'Gerente' },
    { value: 'staff', label: 'Personal' },
    { value: 'owner', label: 'Dueño' },
  ];
}

/**
 * Check if role requires manager selection
 */
export function requiresManagerSelection(role: string): boolean {
  return role === 'advisor';
}

/**
 * Check if role can be a manager
 */
export function canBeManager(role: string): boolean {
  return ['manager', 'owner', 'admin', 'developer'].includes(role);
}
