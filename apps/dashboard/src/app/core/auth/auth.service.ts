import { Injectable, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { LoginResponse, MeResponse, SessionUser } from '@assessment-task/data';
import { AuthApiService } from '../api/auth-api.service';

const TOKEN_KEY = 'task_jwt';
const USER_KEY = 'task_user';

/** RBAC: only explicit permissions (backend never sends *; it expands to full list). */
function checkPermission(permissions: Record<string, boolean> | undefined | null, requiredPermission: string): boolean {
  if (!permissions || !requiredPermission || typeof permissions !== 'object') return false;
  const [module] = requiredPermission.split('.');
  if (permissions[`${module}.*`] === true) return true;
  if (permissions[requiredPermission] === true) return true;
  const parts = requiredPermission.split('.');
  if (parts.length >= 3) {
    const parentKey = parts.slice(0, -1).join('.');
    if (permissions[parentKey] === true) return true;
  }
  return false;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenSignal = signal<string | null>(this.getStoredToken());
  /** When token exists, never use stored user so we don't show stale permissions; only use user after loadSession() from API. */
  private userSignal = signal<SessionUser | null>(this.getInitialUser());
  private sessionLoadedSignal = signal(false);

  token = this.tokenSignal.asReadonly();
  user = this.userSignal.asReadonly();
  sessionLoaded = this.sessionLoadedSignal.asReadonly();
  isLoggedIn = computed(() => !!this.tokenSignal());

  constructor(private authApi: AuthApiService) {}

  setSession(res: LoginResponse) {
    this.tokenSignal.set(res.accessToken);
    this.userSignal.set(res.user);
    this.sessionLoadedSignal.set(true);
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  }

  setSessionFromMe(me: MeResponse) {
    this.userSignal.set(me.user);
    localStorage.setItem(USER_KEY, JSON.stringify(me.user));
  }

  logout() {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  /** Load session from GET /auth/me when token exists (e.g. on app init or refresh). */
  loadSession(): Promise<void> {
    if (!this.getToken()) {
      this.sessionLoadedSignal.set(true);
      return Promise.resolve();
    }
    return firstValueFrom(this.authApi.getMe())
      .then((me) => {
        this.setSessionFromMe(me);
        this.sessionLoadedSignal.set(true);
      })
      .catch(() => {
        this.logout();
        this.sessionLoadedSignal.set(true);
      });
  }

  hasPermission(permission: string): boolean {
    const u = this.userSignal();
    if (!u) return false;
    return checkPermission(u.permissions ?? null, permission);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private getInitialUser(): SessionUser | null {
    if (this.getStoredToken()) return null;
    return this.getStoredUser();
  }

  private getStoredUser(): SessionUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
