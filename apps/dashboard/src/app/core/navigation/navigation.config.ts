import type { AuthService } from '../auth/auth.service';

export interface NavItem {
  path: string;
  label: string;
  icon?: string;
  permission?: string;
  /** When true, link is only shown for super organization (e.g. Swagger). */
  requireSuperOrg?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/roles', label: 'Roles', permission: 'roles.view_roles' },
  { path: '/users', label: 'Users', permission: 'users.view_users' },
  { path: '/tasks', label: 'Todos', permission: 'tasks.view' },
  { path: '/audit-log', label: 'Logs', permission: 'audit.view' },
  { path: '/documentation', label: 'Documentation', requireSuperOrg: true },
];

/** First route the user is allowed to access; use after login and when redirecting from permission guard. */
export function getFirstAllowedPath(auth: AuthService): string {
  if (!auth.sessionLoaded()) return '/dashboard';
  for (const item of NAV_ITEMS) {
    if (item.requireSuperOrg && !auth.user()?.canAccessSwagger) continue;
    if (!item.permission) return item.path;
    if (auth.hasPermission(item.permission)) return item.path;
  }
  return '/dashboard';
}
