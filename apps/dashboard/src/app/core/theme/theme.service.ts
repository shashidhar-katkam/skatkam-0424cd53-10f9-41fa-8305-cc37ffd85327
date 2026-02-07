import { Injectable, signal, computed } from '@angular/core';

const STORAGE_KEY = 'task-manager-theme';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly theme = signal<Theme>(this.readInitialTheme());

  isDark = computed(() => this.theme() === 'dark');

  constructor() {
    this.applyTheme(this.theme());
  }

  private readInitialTheme(): Theme {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'dark' || stored === 'light') return stored;
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  }

  private applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    this.applyTheme(theme);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, theme);
    }
  }

  toggle(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }
}
