import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthApiService } from './auth-api.service';
import { environment } from '../../../environments/environment';

describe('AuthApiService', () => {
  let service: AuthApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthApiService],
    });
    service = TestBed.inject(AuthApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('login should POST to /auth/login', () => {
    const dto = { email: 'a@b.com', password: 'pass' };
    service.login(dto).subscribe((res) => {
      expect(res.accessToken).toBe('token');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({ accessToken: 'token', user: {} });
  });

  it('register should POST to /auth/register', () => {
    const dto = {
      email: 'a@b.com',
      password: 'pass',
      organizationName: 'Org',
    };
    service.register(dto).subscribe((res) => {
      expect(res.accessToken).toBe('token');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({ accessToken: 'token', user: {} });
  });

  it('getMe should GET /auth/me', () => {
    service.getMe().subscribe((res) => {
      expect(res.user).toBeDefined();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
    expect(req.request.method).toBe('GET');
    req.flush({ user: { id: '1', email: 'a@b.com' } });
  });
});
