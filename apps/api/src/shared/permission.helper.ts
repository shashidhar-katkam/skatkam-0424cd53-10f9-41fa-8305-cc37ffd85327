export function checkPermission(
  permissions: Record<string, boolean> | unknown,
  requiredPermission: string
): boolean {
  if (!permissions || !requiredPermission) return false;
  if (typeof permissions !== 'object') return false;
  const perms = permissions as Record<string, boolean>;
  if (perms['*'] === true || perms['all'] === true) return true;
  const [module] = requiredPermission.split('.');
  if (perms[`${module}.*`] === true) return true;
  if (perms[requiredPermission] === true) return true;
  const parts = requiredPermission.split('.');
  if (parts.length >= 3) {
    const parentKey = parts.slice(0, -1).join('.');
    if (perms[parentKey] === true) return true;
  }
  return false;
}

export function checkAnyPermission(
  permissions: Record<string, boolean> | unknown,
  requiredPermissions: string[]
): boolean {
  if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) return false;
  return requiredPermissions.some((p) => checkPermission(permissions, p));
}

export function checkAllPermissions(
  permissions: Record<string, boolean> | unknown,
  requiredPermissions: string[]
): boolean {
  if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) return false;
  return requiredPermissions.every((p) => checkPermission(permissions, p));
}

export function getActivePermissions(permissions: Record<string, boolean> | unknown): string[] {
  if (!permissions || typeof permissions !== 'object') return [];
  const perms = permissions as Record<string, boolean>;
  return Object.keys(perms).filter((key) => perms[key] === true);
}
