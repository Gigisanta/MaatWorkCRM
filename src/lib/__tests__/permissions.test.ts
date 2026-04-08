import { hasPermission, normalizeRole, canBeManager } from '../permissions';

describe('normalizeRole', () => {
  it('normalizes dueno to owner', () => {
    expect(normalizeRole('dueno')).toBe('owner');
  });
  it('normalizes asesor to advisor', () => {
    expect(normalizeRole('asesor')).toBe('advisor');
  });
  it('keeps known roles unchanged', () => {
    expect(normalizeRole('admin')).toBe('admin');
    expect(normalizeRole('manager')).toBe('manager');
  });
});

describe('hasPermission', () => {
  describe('admin', () => {
    it('has all contact permissions', () => {
      expect(hasPermission('admin', 'contacts:read:all')).toBe(true);
      expect(hasPermission('admin', 'contacts:delete:all')).toBe(true);
    });
    it('has team:view and users:manage', () => {
      expect(hasPermission('admin', 'team:view')).toBe(true);
      expect(hasPermission('admin', 'users:manage')).toBe(true);
    });
  });

  describe('advisor', () => {
    it('only has own contact permissions', () => {
      expect(hasPermission('advisor', 'contacts:read:own')).toBe(true);
      expect(hasPermission('advisor', 'contacts:create')).toBe(true);
      expect(hasPermission('advisor', 'contacts:update:own')).toBe(true);
    });
    it('has team:view', () => {
      expect(hasPermission('advisor', 'team:view')).toBe(true);
    });
    it('does NOT have all contacts permission', () => {
      expect(hasPermission('advisor', 'contacts:read:all')).toBe(false);
    });
  });

  describe('manager', () => {
    it('has team:view', () => {
      expect(hasPermission('manager', 'team:view')).toBe(true);
    });
    it('has team contact permissions but NOT all', () => {
      expect(hasPermission('manager', 'contacts:read:team')).toBe(true);
      expect(hasPermission('manager', 'contacts:read:all')).toBe(false);
    });
    it('does NOT have settings:manage', () => {
      expect(hasPermission('manager', 'settings:manage')).toBe(false);
    });
  });

  describe('staff', () => {
    it('has own contact permissions only', () => {
      expect(hasPermission('staff', 'contacts:read:own')).toBe(true);
      expect(hasPermission('staff', 'contacts:create')).toBe(true);
      expect(hasPermission('staff', 'contacts:update:own')).toBe(true);
    });
    it('does NOT have all contacts permission', () => {
      expect(hasPermission('staff', 'contacts:read:all')).toBe(false);
      expect(hasPermission('staff', 'contacts:delete:all')).toBe(false);
    });
    it('has team:view', () => {
      expect(hasPermission('staff', 'team:view')).toBe(true);
    });
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
