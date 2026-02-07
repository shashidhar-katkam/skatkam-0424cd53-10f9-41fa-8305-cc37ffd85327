import {
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
  getActivePermissions,
} from './permission.helper';

describe('permission.helper', () => {
  describe('checkPermission', () => {
    it('should return false for null/undefined permissions', () => {
      expect(checkPermission(null, 'tasks.view')).toBe(false);
      expect(checkPermission(undefined, 'tasks.view')).toBe(false);
    });

    it('should return true for wildcard *', () => {
      expect(checkPermission({ '*': true }, 'tasks.view')).toBe(true);
    });

    it('should return true for wildcard all', () => {
      expect(checkPermission({ all: true }, 'tasks.view')).toBe(true);
    });

    it('should return true for exact permission', () => {
      expect(checkPermission({ 'tasks.view': true }, 'tasks.view')).toBe(true);
    });

    it('should return true for module wildcard', () => {
      expect(checkPermission({ 'tasks.*': true }, 'tasks.view')).toBe(true);
    });

    it('should return false when permission not granted', () => {
      expect(checkPermission({ 'tasks.view': true }, 'tasks.create')).toBe(false);
    });
  });

  describe('checkAnyPermission', () => {
    it('should return true if any permission matches', () => {
      expect(
        checkAnyPermission(
          { 'tasks.view': true },
          ['tasks.create', 'tasks.view']
        )
      ).toBe(true);
    });

    it('should return false if none match', () => {
      expect(
        checkAnyPermission(
          { 'tasks.view': true },
          ['tasks.create', 'tasks.delete']
        )
      ).toBe(false);
    });
  });

  describe('checkAllPermissions', () => {
    it('should return true when all match', () => {
      expect(
        checkAllPermissions(
          { 'tasks.view': true, 'tasks.create': true },
          ['tasks.view', 'tasks.create']
        )
      ).toBe(true);
    });

    it('should return false when one is missing', () => {
      expect(
        checkAllPermissions(
          { 'tasks.view': true },
          ['tasks.view', 'tasks.create']
        )
      ).toBe(false);
    });
  });

  describe('getActivePermissions', () => {
    it('should return keys with true value', () => {
      const perms = getActivePermissions({
        'tasks.view': true,
        'tasks.create': false,
        'tasks.delete': true,
      });
      expect(perms).toContain('tasks.view');
      expect(perms).toContain('tasks.delete');
      expect(perms).not.toContain('tasks.create');
    });

    it('should return empty array for null', () => {
      expect(getActivePermissions(null)).toEqual([]);
    });
  });
});
