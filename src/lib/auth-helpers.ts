// Auth helper functions for MaatWork CRM
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { getToken } from 'next-auth/jwt';

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
 * Uses getToken from next-auth/jwt which is the official NextAuth v4 method.
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

    // Try NextAuth token using getToken (official NextAuth v4 method)
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
    });

    if (token) {
      const userId = token.id || token.sub;
      if (userId) {
        const user = await db.user.findUnique({
          where: { id: userId as string },
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
