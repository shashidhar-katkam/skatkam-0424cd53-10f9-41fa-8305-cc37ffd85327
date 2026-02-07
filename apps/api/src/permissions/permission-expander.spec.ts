import { buildAllPermissionKeys, expandPermissions } from './permission-expander';

describe('permission-expander', () => {
  describe('buildAllPermissionKeys', () => {
    it('should build keys from modules', () => {
      const modules = [
        {
          moduleId: 'tasks',
          features: [
            { featureId: 'view' },
            { featureId: 'create' },
          ],
        },
        {
          moduleId: 'users',
          features: [{ featureId: 'view' }],
        },
      ] as any[];
      expect(buildAllPermissionKeys(modules)).toEqual([
        'tasks.view',
        'tasks.create',
        'users.view',
      ]);
    });

    it('should skip features without featureId', () => {
      const modules = [
        {
          moduleId: 'tasks',
          features: [
            { featureId: 'view' },
            { featureId: '' },
          ],
        },
      ] as any[];
      expect(buildAllPermissionKeys(modules)).toEqual(['tasks.view']);
    });

    it('should handle empty features', () => {
      expect(buildAllPermissionKeys([{ moduleId: 'tasks', features: [] }] as any[])).toEqual([]);
    });
  });

  describe('expandPermissions', () => {
    const allKeys = ['tasks.view', 'tasks.create', 'users.view'];

    it('should expand * to all keys', () => {
      const result = expandPermissions(['*'], allKeys);
      expect(result).toEqual({
        'tasks.view': true,
        'tasks.create': true,
        'users.view': true,
      });
    });

    it('should expand module.*', () => {
      const result = expandPermissions(['tasks.*'], allKeys);
      expect(result).toEqual({
        'tasks.view': true,
        'tasks.create': true,
      });
    });

    it('should add exact permission', () => {
      const result = expandPermissions(['tasks.view'], allKeys);
      expect(result).toEqual({ 'tasks.view': true });
    });

    it('should expand * to all keys even with other items', () => {
      const result = expandPermissions(['tasks.view', '*'], allKeys);
      expect(result).toEqual({
        'tasks.view': true,
        'tasks.create': true,
        'users.view': true,
      });
    });
  });
});
