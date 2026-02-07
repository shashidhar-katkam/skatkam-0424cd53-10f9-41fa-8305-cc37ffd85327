import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthApiService } from '../api/auth-api.service';

describe('AuthService', () => {
  let service: AuthService;
  let authApi: jasmine.SpyObj<AuthApiService>;

  beforeEach(() => {
    const authApiSpy = { getMe: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthApiService, useValue: authApiSpy },
      ],
    });
    service = TestBed.inject(AuthService);
    authApi = TestBed.inject(AuthApiService) as any;
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('isLoggedIn should be false initially', () => {
    expect(service.isLoggedIn()).toBe(false);
  });

  it('setSession should set token and user', () => {
    const res = {
      accessToken: 'token',
      user: { id: '1', email: 'a@b.com', permissions: {} },
    };
    service.setSession(res);
    expect(service.getToken()).toBe('token');
    expect(service.isLoggedIn()).toBe(true);
    expect(localStorage.getItem('task_jwt')).toBe('token');
  });

  it('logout should clear session', () => {
    service.setSession({
      accessToken: 'token',
      user: {} as any,
    });
    service.logout();
    expect(service.getToken()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('task_jwt')).toBeNull();
  });

  it('hasPermission should return false when no user', () => {
    expect(service.hasPermission('tasks.view')).toBe(false);
  });

  it('hasPermission should return true when user has permission', () => {
    service.setSession({
      accessToken: 'token',
      user: {
        id: '1',
        email: 'a@b.com',
        permissions: { 'tasks.view': true },
      } as any,
    });
    expect(service.hasPermission('tasks.view')).toBe(true);
  });

  it('hasPermission should return true when user has module.* wildcard', () => {
    service.setSession({
      accessToken: 'token',
      user: {
        id: '1',
        email: 'a@b.com',
        permissions: { 'tasks.*': true },
      } as any,
    });
    expect(service.hasPermission('tasks.view')).toBe(true);
  });

  it('hasPermission should return true when user has parent key (3-part permission)', () => {
    service.setSession({
      accessToken: 'token',
      user: {
        id: '1',
        email: 'a@b.com',
        permissions: { 'tasks.create': true },
      } as any,
    });
    expect(service.hasPermission('tasks.create.sub')).toBe(true);
  });

  it('hasPermission should return false for empty permission string', () => {
    service.setSession({
      accessToken: 'token',
      user: { id: '1', email: 'a@b.com', permissions: {} } as any,
    });
    expect(service.hasPermission('')).toBe(false);
  });

  it('hasPermission should return false when user has no matching permission', () => {
    service.setSession({
      accessToken: 'token',
      user: {
        id: '1',
        email: 'a@b.com',
        permissions: { 'roles.view': true },
      } as any,
    });
    expect(service.hasPermission('tasks.view')).toBe(false);
  });

  it('loadSession should logout on getMe error', async () => {
    localStorage.setItem('task_jwt', 'token');
    (authApi.getMe as jest.Mock).mockReturnValue(throwError(() => new Error('Unauthorized')));
    const svc = new AuthService(authApi as any);
    await svc.loadSession();
    expect(svc.getToken()).toBeNull();
  });

  it('setSessionFromMe should update user', () => {
    service.setSession({ accessToken: 't', user: { id: '1', email: 'a@b.com' } as any });
    service.setSessionFromMe({ user: { id: '2', email: 'b@c.com' } as any });
    expect(service.user().email).toBe('b@c.com');
  });

  it('loadSession should call getMe when token exists', async () => {
    localStorage.setItem('task_jwt', 'token');
    (authApi.getMe as jest.Mock).mockReturnValue(
      of({ user: { id: '1', email: 'a@b.com', permissions: {} } })
    );
    const svc = new AuthService(authApi as any);
    await svc.loadSession();
    expect(authApi.getMe).toHaveBeenCalled();
  });

  it('loadSession should resolve when no token', async () => {
    const svc = new AuthService(authApi as any);
    await svc.loadSession();
    expect(authApi.getMe).not.toHaveBeenCalled();
  });
});
