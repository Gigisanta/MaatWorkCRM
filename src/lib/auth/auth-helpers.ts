// Auth helper functions for MaatWork CRM
import { NextRequest } from 'next/server';
import { db } from '@/lib/db/db';
import { cookies } from 'next/headers';

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
      console.error('[getUserFromSession] Failed to call NextAuth session:', err);
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
              organizationId: nextAuthUser.organizationId || membership?.organizationId || null,
              organizationRole: membership?.role || null,
              linkedProviders: accounts.map((a) => a.provider),
            };
          }
        }
      } catch (err) {
        console.error('[getUserFromSession] Failed to parse session response:', err);
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
function isAdmin(role: string): boolean {
  return role === 'admin' || role === 'developer';
}

/**
 * Check if user has manager or admin role
 */
function isManagerOrAdmin(role: string): boolean {
  return ['admin', 'manager', 'owner', 'developer'].includes(role);
}

/**
 * Check if user can import files (admin, manager, or owner)
 */
function canImportFiles(role: string): boolean {
  return ['admin', 'manager', 'owner', 'developer'].includes(role);
}

/**
 * Check if user can manage a team
 */
function canManageTeam(user: AuthUser | null): boolean {
  if (!user) return false;
  return ['admin', 'manager', 'owner', 'developer'].includes(user.role);
}

/**
 * Check if user can view all contacts
 */
function canViewAllContacts(role: string): boolean {
  return ['admin', 'manager', 'owner', 'developer'].includes(role);
}

/**
 * Check if user can create contacts
 */
function canCreateContacts(role: string): boolean {
  return true; // All authenticated users can create contacts
}

/**
 * Check if user can edit contacts
 */
function canEditContacts(role: string): boolean {
  return true; // All authenticated users can edit contacts
}

/**
 * Check if user can delete contacts
 */
function canDeleteContacts(role: string): boolean {
  return ['admin', 'manager', 'owner', 'developer'].includes(role);
}

/**
 * Check if user can manage users
 */
function canManageUsers(role: string): boolean {
  return ['admin', 'owner', 'developer'].includes(role);
}

/**
 * Check if user can view reports
 */
function canViewReports(role: string): boolean {
  return ['admin', 'manager', 'owner', 'developer'].includes(role);
}

/**
 * Check if user can manage tasks
 */
function canManageTasks(role: string): boolean {
  return true; // All authenticated users can manage tasks
}

/**
 * Get role display name
 */
function getRoleDisplayName(role: string): string {
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
function getAvailableRoles(): { value: string; label: string }[] {
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
function requiresManagerSelection(role: string): boolean {
  return role === 'advisor';
}

/**
 * Check if role can be a manager
 */
function canBeManager(role: string): boolean {
  return ['manager', 'owner', 'admin', 'developer'].includes(role);
}
