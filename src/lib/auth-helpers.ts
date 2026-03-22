// Auth helper functions for MaatWork CRM
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

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
}

/**
 * Get user from session token in API routes
 * Returns null if not authenticated
 */
export async function getUserFromSession(request: NextRequest): Promise<AuthUser | null> {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;
    
    if (!sessionToken) {
      return null;
    }
    
    const session = await db.session.findUnique({
      where: { token: sessionToken },
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
              select: {
                organizationId: true,
                role: true,
              },
            },
          },
        },
      },
    });
    
    if (!session || session.expiresAt < new Date() || !session.user.isActive) {
      return null;
    }
    
    const primaryMembership = session.user.members[0];
    
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
    };
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
