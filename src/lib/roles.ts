// Canonical role and permission definitions for MaatWork CRM
// All role and permission utilities should be imported from this file

import { hasPermission as _hasPermission, normalizeRole as _normalizeRole, canBeManager as _canBeManager } from './auth/permissions';

// Re-export everything from permissions for backwards compatibility
export { hasPermission, normalizeRole, canBeManager, type Permission } from './auth/permissions';

// ─── Role Aliases ───────────────────────────────────────────────────────────────

export const ROLE_ALIASES: Record<string, string> = {
  dueno: 'owner',
  asesor: 'advisor',
};

// ─── Permission Helpers ─────────────────────────────────────────────────────────

/**
 * Check if user can create teams (owner, admin, developer, manager)
 */
export function canCreateTeam(role: string): boolean {
  return _hasPermission(role, 'team:create');
}

/**
 * Check if user can update teams (owner, admin, developer, manager)
 */
export function canUpdateTeam(role: string): boolean {
  return _hasPermission(role, 'team:update');
}

/**
 * Check if user can delete teams (owner, admin, developer only)
 */
export function canDeleteTeam(role: string): boolean {
  return _hasPermission(role, 'team:delete');
}

/**
 * Check if user can manage a team (owner, admin, developer, manager)
 */
export function canManageTeam(role: string): boolean {
  return ['admin', 'developer', 'owner', 'manager'].includes(_normalizeRole(role));
}

/**
 * Check if user can view all contacts (admin, owner, developer - NOT manager)
 */
export function canViewAllContacts(role: string): boolean {
  return ['admin', 'owner', 'developer'].includes(_normalizeRole(role));
}

/**
 * Check if user can delete contacts (admin, owner, developer)
 */
export function canDeleteContacts(role: string): boolean {
  return ['admin', 'owner', 'developer'].includes(_normalizeRole(role));
}

/**
 * Check if user can manage users (admin, owner, developer - NOT manager)
 */
export function canManageUsers(role: string): boolean {
  return ['admin', 'owner', 'developer'].includes(_normalizeRole(role));
}

/**
 * Check if user has manager or admin role
 */
export function isManagerOrAdmin(role: string): boolean {
  return ['admin', 'manager', 'owner', 'developer'].includes(_normalizeRole(role));
}

/**
 * Check if user is admin (admin or developer)
 */
export function isAdmin(role: string): boolean {
  return ['admin', 'developer'].includes(_normalizeRole(role));
}

/**
 * Get human-readable role name
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
