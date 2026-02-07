import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { getFirstAllowedPath } from '../navigation/navigation.config';

function getPermission(route: ActivatedRouteSnapshot): string | undefined {
  let r: ActivatedRouteSnapshot | null = route;
  while (r) {
    const p = r.data['permission'] as string | undefined;
    if (p) return p;
    r = r.parent;
  }
  return undefined;
}

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const permission = getPermission(route);
  if (!permission) return true;
  if (!auth.sessionLoaded()) return false;
  if (auth.hasPermission(permission)) return true;
  router.navigate([getFirstAllowedPath(auth)]);
  return false;
};
