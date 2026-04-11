import {
  isAdmin,
  isManagerOrAdmin,
  canImportFiles,
  canManageTeam,
  canViewAllContacts,
  canCreateContacts,
  canEditContacts,
  canDeleteContacts,
  canManageUsers,
  canViewReports,
  canManageTasks,
  getRoleDisplayName,
  getAvailableRoles,
  requiresManagerSelection,
  canBeManager,
} from '../auth/auth-helpers-client';

describe('auth-helpers-client', () => {
  describe('isAdmin', () => {
    it('returns true for admin and developer', () => {
      expect(isAdmin('admin')).toBe(true);
      expect(isAdmin('developer')).toBe(true);
    });
    it('returns false for manager, owner, advisor, staff, member', () => {
      for (const r of ['manager', 'owner', 'advisor', 'staff', 'member']) {
        expect(isAdmin(r)).toBe(false);
      }
    });
  });

  describe('isManagerOrAdmin', () => {
    it('returns true for admin, manager, owner, developer', () => {
      for (const r of ['admin', 'manager', 'owner', 'developer']) {
        expect(isManagerOrAdmin(r)).toBe(true);
      }
    });
    it('returns false for advisor, staff, member', () => {
      for (const r of ['advisor', 'staff', 'member']) {
        expect(isManagerOrAdmin(r)).toBe(false);
      }
    });
  });

  describe('canImportFiles', () => {
    it('returns true for admin, manager, owner, developer', () => {
      for (const r of ['admin', 'manager', 'owner', 'developer']) {
        expect(canImportFiles(r)).toBe(true);
      }
    });
    it('returns false for advisor, staff, member', () => {
      for (const r of ['advisor', 'staff', 'member']) {
        expect(canImportFiles(r)).toBe(false);
      }
    });
  });

  describe('canManageTeam', () => {
    const admin = { id: '1', email: 'a@b.com', name: 'A', role: 'admin', isActive: true };
    const manager = { id: '2', email: 'b@b.com', name: 'B', role: 'manager', isActive: true };
    const owner = { id: '3', email: 'c@b.com', name: 'C', role: 'owner', isActive: true };
    const developer = { id: '4', email: 'd@b.com', name: 'D', role: 'developer', isActive: true };
    const advisor = { id: '5', email: 'e@b.com', name: 'E', role: 'advisor', isActive: true };
    const staff = { id: '6', email: 'f@b.com', name: 'F', role: 'staff', isActive: true };
    const member = { id: '7', email: 'g@b.com', name: 'G', role: 'member', isActive: true };

    it('returns true for admin, manager, owner, developer', () => {
      for (const u of [admin, manager, owner, developer]) {
        expect(canManageTeam(u)).toBe(true);
      }
    });
    it('returns false for advisor, staff, member', () => {
      for (const u of [advisor, staff, member]) {
        expect(canManageTeam(u)).toBe(false);
      }
    });
    it('returns false for null user', () => expect(canManageTeam(null)).toBe(false));
  });

  describe('canViewAllContacts', () => {
    // Client version: admin, owner, developer only (NOT manager)
    it('returns true for admin, owner, developer', () => {
      for (const r of ['admin', 'owner', 'developer']) {
        expect(canViewAllContacts(r)).toBe(true);
      }
    });
    it('returns false for manager, advisor, staff, member', () => {
      for (const r of ['manager', 'advisor', 'staff', 'member']) {
        expect(canViewAllContacts(r)).toBe(false);
      }
    });
  });

  describe('canCreateContacts', () => {
    it('returns true for all roles', () => {
      for (const r of ['admin', 'manager', 'owner', 'developer', 'advisor', 'staff', 'member']) {
        expect(canCreateContacts(r)).toBe(true);
      }
    });
  });

  describe('canEditContacts', () => {
    it('returns true for all roles', () => {
      for (const r of ['admin', 'manager', 'owner', 'developer', 'advisor', 'staff', 'member']) {
        expect(canEditContacts(r)).toBe(true);
      }
    });
  });

  describe('canDeleteContacts', () => {
    // Client version: admin, owner, developer only (NOT manager)
    it('returns true for admin, owner, developer', () => {
      for (const r of ['admin', 'owner', 'developer']) {
        expect(canDeleteContacts(r)).toBe(true);
      }
    });
    it('returns false for manager, advisor, staff, member', () => {
      for (const r of ['manager', 'advisor', 'staff', 'member']) {
        expect(canDeleteContacts(r)).toBe(false);
      }
    });
  });

  describe('canManageUsers', () => {
    it('returns true for admin, owner, developer', () => {
      for (const r of ['admin', 'owner', 'developer']) {
        expect(canManageUsers(r)).toBe(true);
      }
    });
    it('returns false for manager, advisor, staff, member', () => {
      for (const r of ['manager', 'advisor', 'staff', 'member']) {
        expect(canManageUsers(r)).toBe(false);
      }
    });
  });

  describe('canViewReports', () => {
    it('returns true for admin, manager, owner, developer', () => {
      for (const r of ['admin', 'manager', 'owner', 'developer']) {
        expect(canViewReports(r)).toBe(true);
      }
    });
    it('returns false for advisor, staff, member', () => {
      for (const r of ['advisor', 'staff', 'member']) {
        expect(canViewReports(r)).toBe(false);
      }
    });
  });

  describe('canManageTasks', () => {
    it('returns true for all roles', () => {
      for (const r of ['admin', 'manager', 'owner', 'developer', 'advisor', 'staff', 'member']) {
        expect(canManageTasks(r)).toBe(true);
      }
    });
  });

  describe('getRoleDisplayName', () => {
    it('returns Spanish labels for standard roles', () => {
      expect(getRoleDisplayName('admin')).toBe('Administrador');
      expect(getRoleDisplayName('manager')).toBe('Gerente');
      expect(getRoleDisplayName('advisor')).toBe('Asesor');
      expect(getRoleDisplayName('owner')).toBe('Dueño');
      expect(getRoleDisplayName('staff')).toBe('Personal');
      expect(getRoleDisplayName('member')).toBe('Miembro');
      expect(getRoleDisplayName('developer')).toBe('Desarrollador');
    });
    it('returns Spanish labels for aliases', () => {
      expect(getRoleDisplayName('dueno')).toBe('Dueño');
      expect(getRoleDisplayName('asesor')).toBe('Asesor');
    });
    it('returns the role itself for unknown roles', () => {
      expect(getRoleDisplayName('superadmin')).toBe('superadmin');
    });
  });

  describe('getAvailableRoles', () => {
    it('returns exactly 4 roles', () => expect(getAvailableRoles()).toHaveLength(4));
    it('contains advisor, manager, staff, owner', () => {
      const roles = getAvailableRoles().map(r => r.value);
      expect(roles).toContain('advisor');
      expect(roles).toContain('manager');
      expect(roles).toContain('staff');
      expect(roles).toContain('owner');
    });
  });

  describe('requiresManagerSelection', () => {
    it('returns true only for advisor', () => {
      expect(requiresManagerSelection('advisor')).toBe(true);
    });
    it('returns false for all other roles', () => {
      for (const r of ['admin', 'manager', 'owner', 'staff', 'member', 'developer']) {
        expect(requiresManagerSelection(r)).toBe(false);
      }
    });
  });

  describe('canBeManager', () => {
    it('returns true for manager, owner, admin, developer', () => {
      for (const r of ['manager', 'owner', 'admin', 'developer']) {
        expect(canBeManager(r)).toBe(true);
      }
    });
    it('returns false for advisor, staff, member', () => {
      for (const r of ['advisor', 'staff', 'member']) {
        expect(canBeManager(r)).toBe(false);
      }
    });
  });
});
