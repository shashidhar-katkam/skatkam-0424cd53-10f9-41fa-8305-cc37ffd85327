import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { AppComponent } from './app.component';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './core/auth/auth.service';
import { ThemeService } from './core/theme/theme.service';

describe('AppComponent', () => {
  let authMock: {
    isLoggedIn: jest.Mock;
    sessionLoaded: jest.Mock;
    user: jest.Mock;
    hasPermission: jest.Mock;
    logout: jest.Mock;
  };
  let router: Router;
  let eventsSubject: Subject<any>;

  beforeEach(async () => {
    eventsSubject = new Subject();
    authMock = {
      isLoggedIn: jest.fn().mockReturnValue(false),
      sessionLoaded: jest.fn().mockReturnValue(true),
      user: jest.fn().mockReturnValue(null),
      hasPermission: jest.fn().mockReturnValue(false),
      logout: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule],
      providers: [
        ThemeService,
        { provide: AuthService, useValue: authMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    Object.defineProperty(router, 'events', { get: () => eventsSubject.asObservable() });
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have showLayout and navItems', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.showLayout).toBeDefined();
    expect(app.navItems).toBeDefined();
  });

  it('showLayout should be false when not logged in', () => {
    authMock.isLoggedIn.mockReturnValue(false);
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    expect(app.showLayout()).toBe(false);
  });

  it('showLayout should be true when logged in and on dashboard', () => {
    authMock.isLoggedIn.mockReturnValue(true);
    Object.defineProperty(router, 'url', { value: '/dashboard', writable: true });
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    eventsSubject.next(new NavigationEnd(1, '/dashboard', '/dashboard'));
    expect(app.showLayout()).toBe(true);
  });

  it('navItems should filter by permission', () => {
    authMock.sessionLoaded.mockReturnValue(true);
    authMock.user.mockReturnValue({ canAccessSwagger: false });
    authMock.hasPermission.mockImplementation((p: string) => p === 'tasks.view');
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    const items = app.navItems();
    expect(items.some((i) => i.path === '/dashboard')).toBe(true);
  });

  it('logout should call auth.logout and navigate', () => {
    jest.spyOn(router, 'navigate');
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.logout();
    expect(authMock.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
