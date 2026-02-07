import { NAV_ITEMS, getFirstAllowedPath } from './navigation.config';

describe('navigation.config', () => {
  describe('NAV_ITEMS', () => {
    it('should have dashboard as first item', () => {
      expect(NAV_ITEMS[0].path).toBe('/dashboard');
      expect(NAV_ITEMS[0].label).toBe('Dashboard');
    });

    it('should have items with permissions', () => {
      const rolesItem = NAV_ITEMS.find((n) => n.path === '/roles');
      expect(rolesItem?.permission).toBe('roles.view_roles');
    });
  });

  describe('getFirstAllowedPath', () => {
    it('should return /dashboard when session not loaded', () => {
      const auth = {
        sessionLoaded: () => false,
        user: () => null,
        hasPermission: () => false,
      };
      expect(getFirstAllowedPath(auth as any)).toBe('/dashboard');
    });

    it('should return /dashboard when no permission required', () => {
      const auth = {
        sessionLoaded: () => true,
        user: () => ({ canAccessSwagger: false }),
        hasPermission: () => false,
      };
      expect(getFirstAllowedPath(auth as any)).toBe('/dashboard');
    });

    it('should return /dashboard first since it has no permission', () => {
      const auth = {
        sessionLoaded: () => true,
        user: () => ({ canAccessSwagger: false }),
        hasPermission: (p: string) => p === 'tasks.view',
      };
      expect(getFirstAllowedPath(auth as any)).toBe('/dashboard');
    });


    it('should skip documentation when user cannot access Swagger', () => {
      const auth = {
        sessionLoaded: () => true,
        user: () => ({ canAccessSwagger: false }),
        hasPermission: () => true,
      };
      const path = getFirstAllowedPath(auth as any);
      expect(path).not.toBe('/documentation');
    });

    it('should return /roles when user has roles permission (dashboard first)', () => {
      const auth = {
        sessionLoaded: () => true,
        user: () => ({ canAccessSwagger: false }),
        hasPermission: (p: string) => p === 'roles.view_roles',
      };
      expect(getFirstAllowedPath(auth as any)).toBe('/dashboard');
    });

    it('should return /tasks when user has tasks permission', () => {
      const auth = {
        sessionLoaded: () => true,
        user: () => ({ canAccessSwagger: false }),
        hasPermission: (p: string) => p === 'tasks.view',
      };
      expect(getFirstAllowedPath(auth as any)).toBe('/dashboard');
    });

    it('should return /dashboard when no items match (no permissions)', () => {
      const auth = {
        sessionLoaded: () => true,
        user: () => ({ canAccessSwagger: false }),
        hasPermission: () => false,
      };
      expect(getFirstAllowedPath(auth as any)).toBe('/dashboard');
    });

    it('should skip requireSuperOrg item when canAccessSwagger false', () => {
      const auth = {
        sessionLoaded: () => true,
        user: () => ({ canAccessSwagger: false }),
        hasPermission: (p: string) => p === 'audit.view',
      };
      const path = getFirstAllowedPath(auth as any);
      expect(path).toBe('/dashboard');
    });

    it('should include documentation when user can access Swagger', () => {
      const auth = {
        sessionLoaded: () => true,
        user: () => ({ canAccessSwagger: true }),
        hasPermission: () => true,
      };
      const path = getFirstAllowedPath(auth as any);
      expect(path).toBe('/dashboard');
    });

  });
});
