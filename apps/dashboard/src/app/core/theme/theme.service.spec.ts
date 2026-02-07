import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ThemeService] });
    service = TestBed.inject(ThemeService);
    localStorage.removeItem('task-manager-theme');
    document.documentElement.classList.remove('dark', 'light');
  });

  afterEach(() => {
    localStorage.removeItem('task-manager-theme');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('toggle should switch theme', () => {
    const initial = service.isDark();
    service.toggle();
    expect(service.isDark()).toBe(!initial);
  });

  it('setTheme light should remove dark class', () => {
    service.setTheme('light');
    expect(service.isDark()).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('setTheme dark should add dark class', () => {
    service.setTheme('dark');
    expect(service.isDark()).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should persist theme to localStorage', () => {
    service.setTheme('dark');
    expect(localStorage.getItem('task-manager-theme')).toBe('dark');
  });
});
