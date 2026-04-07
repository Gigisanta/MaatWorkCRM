// Auth helper functions for MaatWork CRM
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

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
    console.warn(
      `[Auth] Missing environment variables (will cause auth failures at runtime):\n` +
        missing.map((v) => `  - ${v}`).join('\n')
    );
  }
}

validateAuthConfig();

// ─── Verify NextAuth JWT token (v4 uses JWS, not JWE) ─────────────────────
// NextAuth v4 stores sessions as JWTs signed with NEXTAUTH_SECRET (JWS, not JWE)
// We use jwtVerify to verify the signature, not jwtDecrypt (which is for JWE encryption)
async function decryptNextAuthToken(token: string): Promise<{ id?: string; sub?: string } | null> {
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('[decryptNextAuthToken] NEXTAUTH_SECRET not set');
      return null;
    }

    console.log('[decryptNextAuthToken] Secret length:', secret?.length);
    console.log('[decryptNextAuthToken] Token length:', token?.length, 'First 50 chars:', token?.substring(0, 50));

    // NextAuth v4 uses JWS (signed JWT), so we need jwtVerify not jwtDecrypt
    // The secret is used directly as the HMAC key (HS256)
    const secretBytes = new TextEncoder().encode(secret);
    console.log('[decryptNextAuthToken] Using jwtVerify for NextAuth v4 JWS token');

    const { payload } = await jwtVerify(token, secretBytes, {
      algorithms: ['HS256'],
      clockTolerance: 15,
    });
    console.log('[decryptNextAuthToken] Verification success, payload:', JSON.stringify(payload).substring(0, 200));
    return payload as { id?: string; sub?: string };
  } catch (error) {
    console.error('[decryptNextAuthToken] Failed to verify NextAuth token:', error);
    return null;
  }
}

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
 * Uses cookies() from next/headers (async) + jwtDecrypt from jose.
 * This is the same pattern that works in /api/auth/session-custom.
 */
export async function getUserFromSession(request: NextRequest): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();

    // Debug: log all cookies
    console.log('[getUserFromSession] All cookies:', JSON.stringify(Object.keys(cookieStore).filter(k => k.includes('session') || k.includes('token'))));
    console.log('[getUserFromSession] NODE_ENV:', process.env.NODE_ENV);

    // Try database session token first (UUID from custom credentials login)
    const dbSessionToken = cookieStore.get('session_token')?.value;
    console.log('[getUserFromSession] dbSessionToken exists:', !!dbSessionToken, 'length:', dbSessionToken?.length);

    // Try NextAuth JWE token (from Google OAuth via NextAuth)
    const isProduction = process.env.NODE_ENV === 'production';
    const baseName = isProduction ? '__Secure-next-auth.session-token' : 'next-auth.session-token';
    console.log('[getUserFromSession] isProduction:', isProduction, 'baseName:', baseName);

    // Get base cookie first
    let nextAuthToken = cookieStore.get(baseName)?.value;
    console.log('[getUserFromSession] nextAuthToken (base) exists:', !!nextAuthToken, 'length:', nextAuthToken?.length);

    // Then try to get chunked cookies (NextAuth chunks large tokens)
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

    // Fallback: try opposite prefix if no token found
    if (!nextAuthToken) {
      const fallbackName = isProduction ? 'next-auth.session-token' : '__Secure-next-auth.session-token';
      nextAuthToken = cookieStore.get(fallbackName)?.value;
      console.log('[getUserFromSession] nextAuthToken (fallback) exists:', !!nextAuthToken, 'length:', nextAuthToken?.length);
    }

    // Try database session token first (UUID from custom auth)
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
          const membership = await db.member.findFirst({
            where: { userId: user.id },
            select: { organizationId: true, role: true },
          });

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
            organizationId: membership?.organizationId || null,
            organizationRole: membership?.role || null,
            linkedProviders: accounts.map((a) => a.provider),
          };
        }
      }
    }

    // Try NextAuth JWE token via jwtDecrypt (same approach as session-custom)
    if (nextAuthToken) {
      const payload = await decryptNextAuthToken(nextAuthToken);
      if (payload) {
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
    }

    return null;
  } catch (error) {
    console.error('[getUserFromSession] Error:', error);
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
