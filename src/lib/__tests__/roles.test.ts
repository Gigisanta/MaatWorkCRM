import {
  canCreateTeam,
  canUpdateTeam,
  canDeleteTeam,
  canManageTeam,
  canViewAllContacts,
  canDeleteContacts,
  canManageUsers,
  isManagerOrAdmin,
  isAdmin,
  getRoleDisplayName,
  getAvailableRoles,
  requiresManagerSelection,
  hasPermission,
  normalizeRole,
  canBeManager,
} from '../roles';

const ALL_ROLES = ['admin', 'developer', 'owner', 'manager', 'advisor', 'staff', 'member'] as const;

describe('canCreateTeam', () => {
  it('returns true for admin', () => expect(canCreateTeam('admin')).toBe(true));
  it('returns true for developer', () => expect(canCreateTeam('developer')).toBe(true));
  it('returns true for owner', () => expect(canCreateTeam('owner')).toBe(true));
  it('returns true for manager', () => expect(canCreateTeam('manager')).toBe(true));
  it('returns false for advisor', () => expect(canCreateTeam('advisor')).toBe(false));
  it('returns false for staff', () => expect(canCreateTeam('staff')).toBe(false));
  it('returns false for member', () => expect(canCreateTeam('member')).toBe(false));
  it('returns false for unknown role', () => expect(canCreateTeam('unknown')).toBe(false));
});

describe('canUpdateTeam', () => {
  it('returns true for admin', () => expect(canUpdateTeam('admin')).toBe(true));
  it('returns true for developer', () => expect(canUpdateTeam('developer')).toBe(true));
  it('returns true for owner', () => expect(canUpdateTeam('owner')).toBe(true));
  it('returns true for manager', () => expect(canUpdateTeam('manager')).toBe(true));
  it('returns false for advisor', () => expect(canUpdateTeam('advisor')).toBe(false));
  it('returns false for staff', () => expect(canUpdateTeam('staff')).toBe(false));
  it('returns false for member', () => expect(canUpdateTeam('member')).toBe(false));
  it('returns false for unknown role', () => expect(canUpdateTeam('unknown')).toBe(false));
});

describe('canDeleteTeam', () => {
  it('returns true for admin', () => expect(canDeleteTeam('admin')).toBe(true));
  it('returns true for developer', () => expect(canDeleteTeam('developer')).toBe(true));
  it('returns true for owner', () => expect(canDeleteTeam('owner')).toBe(true));
  it('returns false for manager', () => expect(canDeleteTeam('manager')).toBe(false));
  it('returns false for advisor', () => expect(canDeleteTeam('advisor')).toBe(false));
  it('returns false for staff', () => expect(canDeleteTeam('staff')).toBe(false));
  it('returns false for member', () => expect(canDeleteTeam('member')).toBe(false));
  it('returns false for unknown role', () => expect(canDeleteTeam('unknown')).toBe(false));
});

describe('canManageTeam', () => {
  it('returns true for admin', () => expect(canManageTeam('admin')).toBe(true));
  it('returns true for developer', () => expect(canManageTeam('developer')).toBe(true));
  it('returns true for owner', () => expect(canManageTeam('owner')).toBe(true));
  it('returns true for manager', () => expect(canManageTeam('manager')).toBe(true));
  it('returns false for advisor', () => expect(canManageTeam('advisor')).toBe(false));
  it('returns false for staff', () => expect(canManageTeam('staff')).toBe(false));
  it('returns false for member', () => expect(canManageTeam('member')).toBe(false));
  it('returns false for unknown role', () => expect(canManageTeam('unknown')).toBe(false));
});

describe('canViewAllContacts', () => {
  it('returns true for admin', () => expect(canViewAllContacts('admin')).toBe(true));
  it('returns true for developer', () => expect(canViewAllContacts('developer')).toBe(true));
  it('returns true for owner', () => expect(canViewAllContacts('owner')).toBe(true));
  it('returns false for manager', () => expect(canViewAllContacts('manager')).toBe(false));
  it('returns false for advisor', () => expect(canViewAllContacts('advisor')).toBe(false));
  it('returns false for staff', () => expect(canViewAllContacts('staff')).toBe(false));
  it('returns false for member', () => expect(canViewAllContacts('member')).toBe(false));
  it('returns false for unknown role', () => expect(canViewAllContacts('unknown')).toBe(false));
});

describe('canDeleteContacts', () => {
  it('returns true for admin', () => expect(canDeleteContacts('admin')).toBe(true));
  it('returns true for developer', () => expect(canDeleteContacts('developer')).toBe(true));
  it('returns true for owner', () => expect(canDeleteContacts('owner')).toBe(true));
  it('returns false for manager', () => expect(canDeleteContacts('manager')).toBe(false));
  it('returns false for advisor', () => expect(canDeleteContacts('advisor')).toBe(false));
  it('returns false for staff', () => expect(canDeleteContacts('staff')).toBe(false));
  it('returns false for member', () => expect(canDeleteContacts('member')).toBe(false));
  it('returns false for unknown role', () => expect(canDeleteContacts('unknown')).toBe(false));
});

describe('canManageUsers', () => {
  it('returns true for admin', () => expect(canManageUsers('admin')).toBe(true));
  it('returns true for developer', () => expect(canManageUsers('developer')).toBe(true));
  it('returns true for owner', () => expect(canManageUsers('owner')).toBe(true));
  it('returns false for manager', () => expect(canManageUsers('manager')).toBe(false));
  it('returns false for advisor', () => expect(canManageUsers('advisor')).toBe(false));
  it('returns false for staff', () => expect(canManageUsers('staff')).toBe(false));
  it('returns false for member', () => expect(canManageUsers('member')).toBe(false));
  it('returns false for unknown role', () => expect(canManageUsers('unknown')).toBe(false));
});

describe('isManagerOrAdmin', () => {
  it('returns true for admin', () => expect(isManagerOrAdmin('admin')).toBe(true));
  it('returns true for developer', () => expect(isManagerOrAdmin('developer')).toBe(true));
  it('returns true for owner', () => expect(isManagerOrAdmin('owner')).toBe(true));
  it('returns true for manager', () => expect(isManagerOrAdmin('manager')).toBe(true));
  it('returns false for advisor', () => expect(isManagerOrAdmin('advisor')).toBe(false));
  it('returns false for staff', () => expect(isManagerOrAdmin('staff')).toBe(false));
  it('returns false for member', () => expect(isManagerOrAdmin('member')).toBe(false));
  it('returns false for unknown role', () => expect(isManagerOrAdmin('unknown')).toBe(false));
});

describe('isAdmin', () => {
  it('returns true for admin', () => expect(isAdmin('admin')).toBe(true));
  it('returns true for developer', () => expect(isAdmin('developer')).toBe(true));
  it('returns false for owner', () => expect(isAdmin('owner')).toBe(false));
  it('returns false for manager', () => expect(isAdmin('manager')).toBe(false));
  it('returns false for advisor', () => expect(isAdmin('advisor')).toBe(false));
  it('returns false for staff', () => expect(isAdmin('staff')).toBe(false));
  it('returns false for member', () => expect(isAdmin('member')).toBe(false));
  it('returns false for unknown role', () => expect(isAdmin('unknown')).toBe(false));
});

describe('getRoleDisplayName', () => {
  it('returns Spanish name for admin', () => expect(getRoleDisplayName('admin')).toBe('Administrador'));
  it('returns Spanish name for manager', () => expect(getRoleDisplayName('manager')).toBe('Gerente'));
  it('returns Spanish name for advisor', () => expect(getRoleDisplayName('advisor')).toBe('Asesor'));
  it('returns Spanish name for owner', () => expect(getRoleDisplayName('owner')).toBe('Dueño'));
  it('returns Spanish name for staff', () => expect(getRoleDisplayName('staff')).toBe('Personal'));
  it('returns Spanish name for member', () => expect(getRoleDisplayName('member')).toBe('Miembro'));
  it('returns Spanish name for developer', () => expect(getRoleDisplayName('developer')).toBe('Desarrollador'));
  it('normalizes dueno alias to Dueño', () => expect(getRoleDisplayName('dueno')).toBe('Dueño'));
  it('normalizes asesor alias to Asesor', () => expect(getRoleDisplayName('asesor')).toBe('Asesor'));
  it('returns the input string for unknown role', () => expect(getRoleDisplayName('unknown')).toBe('unknown'));
});

describe('getAvailableRoles', () => {
  it('returns exactly 4 roles', () => expect(getAvailableRoles()).toHaveLength(4));

  it('contains advisor', () => {
    const roles = getAvailableRoles();
    expect(roles.some((r) => r.value === 'advisor' && r.label === 'Asesor')).toBe(true);
  });
  it('contains manager', () => {
    const roles = getAvailableRoles();
    expect(roles.some((r) => r.value === 'manager' && r.label === 'Gerente')).toBe(true);
  });
  it('contains staff', () => {
    const roles = getAvailableRoles();
    expect(roles.some((r) => r.value === 'staff' && r.label === 'Personal')).toBe(true);
  });
  it('contains owner', () => {
    const roles = getAvailableRoles();
    expect(roles.some((r) => r.value === 'owner' && r.label === 'Dueño')).toBe(true);
  });
  it('does not contain admin', () => {
    const roles = getAvailableRoles();
    expect(roles.some((r) => r.value === 'admin')).toBe(false);
  });
  it('does not contain developer', () => {
    const roles = getAvailableRoles();
    expect(roles.some((r) => r.value === 'developer')).toBe(false);
  });
  it('does not contain member', () => {
    const roles = getAvailableRoles();
    expect(roles.some((r) => r.value === 'member')).toBe(false);
  });
  it('returns value/label pairs', () => {
    const roles = getAvailableRoles();
    roles.forEach((r) => {
      expect(typeof r.value).toBe('string');
      expect(typeof r.label).toBe('string');
      expect(r.value.length).toBeGreaterThan(0);
      expect(r.label.length).toBeGreaterThan(0);
    });
  });
});

describe('requiresManagerSelection', () => {
  it('returns true for advisor', () => expect(requiresManagerSelection('advisor')).toBe(true));
  it('returns false for admin', () => expect(requiresManagerSelection('admin')).toBe(false));
  it('returns false for manager', () => expect(requiresManagerSelection('manager')).toBe(false));
  it('returns false for owner', () => expect(requiresManagerSelection('owner')).toBe(false));
  it('returns false for developer', () => expect(requiresManagerSelection('developer')).toBe(false));
  it('returns false for staff', () => expect(requiresManagerSelection('staff')).toBe(false));
  it('returns false for member', () => expect(requiresManagerSelection('member')).toBe(false));
  it('returns false for unknown role', () => expect(requiresManagerSelection('unknown')).toBe(false));
});

// Re-exported from permissions.ts — quick sanity checks
describe('re-exported helpers (permissions.ts)', () => {
  describe('normalizeRole', () => {
    it('normalizes dueno to owner', () => expect(normalizeRole('dueno')).toBe('owner'));
    it('normalizes asesor to advisor', () => expect(normalizeRole('asesor')).toBe('advisor'));
    it('keeps known roles unchanged', () => {
      ALL_ROLES.forEach((role) => expect(normalizeRole(role)).toBe(role));
    });
  });

  describe('canBeManager', () => {
    it('returns true for manager, owner, admin, developer', () => {
      expect(canBeManager('manager')).toBe(true);
      expect(canBeManager('owner')).toBe(true);
      expect(canBeManager('admin')).toBe(true);
      expect(canBeManager('developer')).toBe(true);
    });
    it('returns false for advisor, staff, member', () => {
      expect(canBeManager('advisor')).toBe(false);
      expect(canBeManager('staff')).toBe(false);
      expect(canBeManager('member')).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('admin has team:create, team:update, team:delete, users:manage', () => {
      expect(hasPermission('admin', 'team:create')).toBe(true);
      expect(hasPermission('admin', 'team:update')).toBe(true);
      expect(hasPermission('admin', 'team:delete')).toBe(true);
      expect(hasPermission('admin', 'users:manage')).toBe(true);
    });
    it('manager has team:create and team:update but NOT team:delete', () => {
      expect(hasPermission('manager', 'team:create')).toBe(true);
      expect(hasPermission('manager', 'team:update')).toBe(true);
      expect(hasPermission('manager', 'team:delete')).toBe(false);
    });
    it('advisor does not have team:create', () => {
      expect(hasPermission('advisor', 'team:create')).toBe(false);
    });
  });
});
