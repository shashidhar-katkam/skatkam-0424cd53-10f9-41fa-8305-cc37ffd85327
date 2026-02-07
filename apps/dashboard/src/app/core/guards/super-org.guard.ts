import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/** Allows access only for users in the super organization (e.g. Swagger documentation). */
export const superOrgGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.user()?.canAccessSwagger) return true;
  router.navigate(['/dashboard']);
  return false;
};
