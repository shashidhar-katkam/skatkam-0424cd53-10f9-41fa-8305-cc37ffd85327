import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthApiService } from '../../../core/api/auth-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { provideRouter } from '@angular/router';
import { RouterModule } from '@angular/router';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authApi: any;
  let auth: any;
  let router: Router;

  beforeEach(async () => {
    const authApiSpy = { register: jest.fn() };
    const authSpy = {
      setSession: jest.fn(),
      sessionLoaded: () => true,
      user: () => ({ canAccessSwagger: false }),
      hasPermission: () => true,
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, RouterModule.forRoot([])],
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

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('form should be invalid when required fields empty', () => {
    component.form.patchValue({
      organizationName: '',
      email: '',
      password: '',
    });
    expect(component.form.valid).toBe(false);
  });

  it('form should be valid with required fields', () => {
    component.form.patchValue({
      organizationName: 'My Org',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(component.form.valid).toBe(true);
  });

  it('onSubmit should call authApi.register and navigate on success', (done) => {
    (authApi.register as jest.Mock).mockReturnValue(
      of({ accessToken: 'token', user: {} as any })
    );
    component.form.patchValue({
      organizationName: 'My Org',
      email: 'test@example.com',
      password: 'pass123',
    });

    component.onSubmit();

    setTimeout(() => {
      expect(authApi.register).toHaveBeenCalled();
      expect(auth.setSession).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalled();
      done();
    }, 100);
  });

  it('onSubmit should set errorMessage on registration failure', (done) => {
    (authApi.register as jest.Mock).mockReturnValue(
      throwError(() => ({ error: { message: 'Email exists' } }))
    );
    component.form.patchValue({
      organizationName: 'My Org',
      email: 'test@example.com',
      password: 'pass123',
    });

    component.onSubmit();

    setTimeout(() => {
      expect(component.errorMessage).toBe('Email exists');
      expect(component.loading).toBe(false);
      done();
    }, 100);
  });

  it('onSubmit should use fallback when error has no message', (done) => {
    (authApi.register as jest.Mock).mockReturnValue(
      throwError(() => ({}))
    );
    component.form.patchValue({
      organizationName: 'My Org',
      email: 'test@example.com',
      password: 'pass123',
    });
    component.onSubmit();
    setTimeout(() => {
      expect(component.errorMessage).toBe('Registration failed');
      done();
    }, 100);
  });
});
