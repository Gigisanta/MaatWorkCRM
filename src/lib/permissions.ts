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
  | 'settings:manage';

export type Role = 'admin' | 'developer' | 'owner' | 'manager' | 'advisor' | 'staff' | 'member';

export const ROLE_ALIASES: Record<string, Role> = {
  dueno: 'owner',
  asesor: 'advisor',
};

export function normalizeRole(role: string): Role {
  return ROLE_ALIASES[role] ?? (role as Role);
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ['contacts:read:all', 'contacts:create', 'contacts:update:all', 'contacts:delete:all', 'team:view', 'users:manage', 'settings:view', 'settings:manage'],
  developer: ['contacts:read:all', 'contacts:create', 'contacts:update:all', 'contacts:delete:all', 'team:view', 'users:manage', 'settings:view', 'settings:manage'],
  owner: ['contacts:read:all', 'contacts:create', 'contacts:update:all', 'contacts:delete:all', 'team:view', 'users:manage', 'settings:view', 'settings:manage'],
  manager: ['contacts:read:own', 'contacts:read:team', 'contacts:create', 'contacts:update:own', 'contacts:update:team', 'contacts:delete:own', 'contacts:delete:team', 'team:view'],
  staff: ['contacts:read:all', 'contacts:create', 'contacts:update:all', 'contacts:delete:all'],
  advisor: ['contacts:read:own', 'contacts:create', 'contacts:update:own'],
  member: ['contacts:read:own', 'contacts:create', 'contacts:update:own'],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const normalizedRole = normalizeRole(role);
  return ROLE_PERMISSIONS[normalizedRole]?.includes(permission) ?? false;
}

export function canBeManager(role: string): boolean {
  const normalizedRole = normalizeRole(role);
  return ['manager', 'owner', 'admin', 'developer'].includes(normalizedRole);
}
