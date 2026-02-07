import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { superOrgGuard } from './super-org.guard';
import { AuthService } from '../auth/auth.service';

describe('superOrgGuard', () => {
  let router: Router;
  let auth: { user: jest.Mock };

  beforeEach(() => {
    auth = { user: jest.fn().mockReturnValue({ canAccessSwagger: false }) };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        {
          provide: Router,
          useValue: { navigate: jest.fn() },
        },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('should return true when user can access Swagger', () => {
    (auth.user as jest.Mock).mockReturnValue({ canAccessSwagger: true });
    expect(TestBed.runInInjectionContext(() => superOrgGuard(null as any, {} as any))).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should navigate to dashboard and return false when user cannot access Swagger', () => {
    (auth.user as jest.Mock).mockReturnValue({ canAccessSwagger: false });
    expect(TestBed.runInInjectionContext(() => superOrgGuard(null as any, {} as any))).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should return false when user is null', () => {
    (auth.user as jest.Mock).mockReturnValue(null);
    expect(TestBed.runInInjectionContext(() => superOrgGuard(null as any, {} as any))).toBe(false);
  });
});
