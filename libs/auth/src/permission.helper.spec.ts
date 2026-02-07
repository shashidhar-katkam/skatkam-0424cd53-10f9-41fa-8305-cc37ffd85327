import { checkPermission, checkAnyPermission, checkAllPermissions } from './permission.helper';

describe('checkPermission', () => {
  it('grants access for *', () => {
    expect(checkPermission({ '*': true }, 'tasks.create')).toBe(true);
  });

  it('grants access for module.*', () => {
    expect(checkPermission({ 'tasks.*': true }, 'tasks.create')).toBe(true);
  });

  it('grants access for exact permission', () => {
    expect(checkPermission({ 'tasks.create': true }, 'tasks.create')).toBe(true);
  });

  it('denies when permission missing', () => {
    expect(checkPermission({ 'tasks.view': true }, 'tasks.create')).toBe(false);
  });

  it('grants for parent permission (3+ parts)', () => {
    expect(checkPermission({ 'audit.view': true }, 'audit.view.logs')).toBe(true);
  });
});

describe('checkAnyPermission', () => {
  it('returns true if any permission matches', () => {
    expect(checkAnyPermission({ 'tasks.view': true }, ['tasks.view', 'tasks.create'])).toBe(true);
  });
  it('returns false if none match', () => {
    expect(checkAnyPermission({ 'tasks.view': true }, ['tasks.create'])).toBe(false);
  });
});

describe('checkAllPermissions', () => {
  it('returns true if all match', () => {
    expect(checkAllPermissions({ 'tasks.view': true, 'tasks.create': true }, ['tasks.view', 'tasks.create'])).toBe(true);
  });
  it('returns false if one missing', () => {
    expect(checkAllPermissions({ 'tasks.view': true }, ['tasks.view', 'tasks.create'])).toBe(false);
  });
});
