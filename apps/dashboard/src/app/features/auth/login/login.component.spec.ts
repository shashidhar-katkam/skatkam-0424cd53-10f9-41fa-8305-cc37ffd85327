import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, RouterModule } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthApiService } from '../../../core/api/auth-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { provideRouter } from '@angular/router';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authApi: any;
  let auth: any;
  let router: Router;

  beforeEach(async () => {
    const authApiSpy = { login: jest.fn() };
    const authSpy = {
      setSession: jest.fn(),
      sessionLoaded: () => true,
      user: () => ({ canAccessSwagger: false }),
      hasPermission: () => true,
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, RouterModule.forRoot([])],
      providers: [
        ThemeService,
        provideRouter([]),
        { provide: AuthApiService, useValue: authApiSpy },
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    authApi = TestBed.inject(AuthApiService) as any;
    auth = TestBed.inject(AuthService) as any;
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate');

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('form should be invalid when empty', () => {
    component.form.patchValue({ email: '', password: '' });
    component.form.markAllAsTouched();
    expect(component.form.valid).toBe(false);
  });

  it('form should be valid with email and password', () => {
    component.form.patchValue({ email: 'test@example.com', password: 'password123' });
    expect(component.form.valid).toBe(true);
  });

  it('onSubmit should call authApi.login and navigate on success', (done) => {
    (authApi.login as jest.Mock).mockReturnValue(
      of({ accessToken: 'token', user: {} as any })
    );
    component.form.patchValue({ email: 'test@example.com', password: 'pass123' });

    component.onSubmit();

    setTimeout(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'pass123',
      });
      expect(auth.setSession).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalled();
      done();
    }, 100);
  });

  it('onSubmit should set errorMessage on login failure', (done) => {
    (authApi.login as jest.Mock).mockReturnValue(
      throwError(() => ({ error: { message: 'Invalid credentials' } }))
    );
    component.form.patchValue({ email: 'test@example.com', password: 'pass123' });

    component.onSubmit();

    setTimeout(() => {
      expect(component.errorMessage).toBe('Invalid credentials');
      expect(component.loading).toBe(false);
      done();
    }, 100);
  });

  it('onSubmit should use fallback message when error has no message', (done) => {
    (authApi.login as jest.Mock).mockReturnValue(
      throwError(() => ({ error: {} }))
    );
    component.form.patchValue({ email: 'test@example.com', password: 'pass123' });
    component.onSubmit();
    setTimeout(() => {
      expect(component.errorMessage).toBe('Login failed');
      done();
    }, 100);
  });

  it('onSubmit should not call login when form invalid', () => {
    component.form.patchValue({ email: '', password: '' });
    component.onSubmit();
    expect(authApi.login).not.toHaveBeenCalled();
  });
});
