import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { permissionGuard } from './permission.guard';
import { AuthService } from '../auth/auth.service';
import { AuthApiService } from '../api/auth-api.service';
import { provideRouter } from '@angular/router';

describe('permissionGuard', () => {
  let auth: AuthService;
  let router: Router;

  const createRoute = (data: Record<string, unknown> = {}): ActivatedRouteSnapshot => {
    return { data, parent: null } as ActivatedRouteSnapshot;
  };

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
    auth.setSession({
      accessToken: 'token',
      user: {
        id: '1',
        email: 'a@b.com',
        permissions: { 'tasks.view': true },
        canAccessSwagger: false,
      } as any,
    });
  });

  it('should allow access when route has no permission', () => {
    const route = createRoute({});
    const result = TestBed.runInInjectionContext(() => permissionGuard(route, null as any));
    expect(result).toBe(true);
  });

  it('should allow access when user has required permission', () => {
    const route = createRoute({ permission: 'tasks.view' });
    const result = TestBed.runInInjectionContext(() => permissionGuard(route, null as any));
    expect(result).toBe(true);
  });

  it('should redirect when user lacks permission', () => {
    const route = createRoute({ permission: 'roles.admin' });
    const result = TestBed.runInInjectionContext(() => permissionGuard(route, null as any));
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalled();
  });
});
