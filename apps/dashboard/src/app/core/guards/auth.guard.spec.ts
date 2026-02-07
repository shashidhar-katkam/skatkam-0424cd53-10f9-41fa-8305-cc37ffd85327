import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../auth/auth.service';
import { AuthApiService } from '../api/auth-api.service';
import { provideRouter } from '@angular/router';

describe('authGuard', () => {
  let auth: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthApiService, useValue: { getMe: () => ({ pipe: () => ({ subscribe: () => {} }) }) } },
        provideRouter([{ path: '**', redirectTo: '' }]),
      ],
    });
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate');
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  it('should allow access when user is logged in', () => {
    auth.setSession({ accessToken: 'token', user: {} as any });
    const result = TestBed.runInInjectionContext(() => authGuard(null as any, null as any));
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to / when user is not logged in', () => {
    auth.logout();
    const result = TestBed.runInInjectionContext(() => authGuard(null as any, null as any));
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
