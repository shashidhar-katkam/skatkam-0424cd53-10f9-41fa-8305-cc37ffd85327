import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();
  let clone = req;
  if (token) {
    clone = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(clone).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        auth.logout();
        const url = router.url;
        const onPublicPage = url === '/' || url.startsWith('/login') || url.startsWith('/register');
        if (!onPublicPage) {
          router.navigate(['/']);
        }
      }
      return throwError(() => err);
    })
  );
};
