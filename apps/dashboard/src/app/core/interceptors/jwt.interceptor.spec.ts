import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { jwtInterceptor } from './jwt.interceptor';
import { AuthService } from '../auth/auth.service';

describe('jwtInterceptor', () => {
  let httpMock: HttpTestingController;
  let auth: { getToken: jest.Mock; logout: jest.Mock };
  let router: Router;

  beforeEach(() => {
    auth = { getToken: jest.fn().mockReturnValue(null), logout: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate');
    Object.defineProperty(router, 'url', { value: '/dashboard', writable: true });
  });

  afterEach(() => httpMock.verify());

  it('should not add Authorization header when no token', (done) => {
    const client = TestBed.inject(HttpClient);
    client.get('/api/test').subscribe({ next: () => done(), error: () => done() });
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should add Bearer token when token exists', (done) => {
    (auth.getToken as jest.Mock).mockReturnValue('my-token');
    const client = TestBed.inject(HttpClient);
    client.get('/api/test').subscribe({ next: () => done(), error: () => done() });
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-token');
    req.flush({});
  });

  it('should logout and navigate on 401 when not on public page', (done) => {
    Object.defineProperty(router, 'url', { value: '/dashboard', writable: true });
    const client = TestBed.inject(HttpClient);
    client.get('/api/test').subscribe({
      next: () => done(new Error('expected error')),
      error: () => {
        expect(auth.logout).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/']);
        done();
      },
    });
    const req = httpMock.expectOne('/api/test');
    req.flush(null, { status: 401, statusText: 'Unauthorized' });
  });

  it('should logout but not navigate on 401 when on login page', (done) => {
    Object.defineProperty(router, 'url', { value: '/login', writable: true });
    const client = TestBed.inject(HttpClient);
    client.get('/api/test').subscribe({
      next: () => done(new Error('expected error')),
      error: () => {
        expect(auth.logout).toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      },
    });
    const req = httpMock.expectOne('/api/test');
    req.flush(null, { status: 401, statusText: 'Unauthorized' });
  });
});
