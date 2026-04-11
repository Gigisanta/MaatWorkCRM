/**
 * @deprecated This file is kept for backwards compatibility only.
 * All role and permission utilities have been migrated to @/lib/roles.
 * New code MUST import from @/lib/roles instead of this file.
 *
 * The canonical source of truth is now @/lib/roles.ts, which re-exports
 * the helpers from this file for backward compatibility with existing
 * consumers, but adds higher-level domain functions on top.
 */

export type Permission =
  | 'contacts:read:own'
  | 'contacts:read:team'
  | 'contacts:read:all'
  | 'contacts:create'
  | 'contacts:update:own'
  | 'contacts:update:team'
  | 'contacts:update:all'
  | 'contacts:delete:own'
  | 'contacts:delete:team'
  | 'contacts:delete:all'
  | 'team:view'
  | 'team:create'
  | 'team:update'
  | 'team:delete'
  | 'users:manage'
  | 'settings:view'
  | 'settings:manage'
  | 'role:request'
  | 'role:manage';

export type Role = 'admin' | 'developer' | 'owner' | 'manager' | 'advisor' | 'staff' | 'member';

export const ROLE_ALIASES: Record<string, Role> = {
  dueno: 'owner',
  asesor: 'advisor',
};

export function normalizeRole(role: string): Role {
  return ROLE_ALIASES[role] ?? (role as Role);
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ['contacts:read:all', 'contacts:create', 'contacts:update:all', 'contacts:delete:all', 'team:view', 'team:create', 'team:update', 'team:delete', 'users:manage', 'settings:view', 'settings:manage', 'role:request', 'role:manage'],
  developer: ['contacts:read:all', 'contacts:create', 'contacts:update:all', 'contacts:delete:all', 'team:view', 'team:create', 'team:update', 'team:delete', 'users:manage', 'settings:view', 'settings:manage', 'role:request', 'role:manage'],
  owner: ['contacts:read:all', 'contacts:create', 'contacts:update:all', 'contacts:delete:all', 'team:view', 'team:create', 'team:update', 'team:delete', 'users:manage', 'settings:view', 'settings:manage', 'role:request', 'role:manage'],
  // manager has team:create and team:update to manage teams
  manager: ['contacts:read:own', 'contacts:read:team', 'contacts:create', 'contacts:update:own', 'contacts:update:team', 'contacts:delete:own', 'contacts:delete:team', 'team:view', 'team:create', 'team:update', 'role:request'],
  staff: ['contacts:read:own', 'contacts:create', 'contacts:update:own', 'team:view', 'role:request'],
  advisor: ['contacts:read:own', 'contacts:create', 'contacts:update:own', 'team:view', 'role:request'],
  member: ['contacts:read:own', 'contacts:create', 'contacts:update:own', 'team:view', 'role:request'],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const normalizedRole = normalizeRole(role);
  return ROLE_PERMISSIONS[normalizedRole]?.includes(permission) ?? false;
}

export function canBeManager(role: string): boolean {
  const normalizedRole = normalizeRole(role);
  return ['manager', 'owner', 'admin', 'developer'].includes(normalizedRole);
}
