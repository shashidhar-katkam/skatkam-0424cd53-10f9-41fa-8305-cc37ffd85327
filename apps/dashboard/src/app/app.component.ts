import { Component, computed, inject, signal, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/auth/auth.service';
import { ThemeService } from './core/theme/theme.service';
import { NAV_ITEMS } from './core/navigation/navigation.config';

@Component({
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnDestroy {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  private router = inject(Router);

  /** Track URL in a signal so computed re-runs when route changes (router.url is not reactive). */
  private currentUrl = signal(this.router.url);
  mobileMenuOpen = signal(false);
  private sub = this.router.events
    .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
    .subscribe(() => {
      this.currentUrl.set(this.router.url);
      this.mobileMenuOpen.set(false);
    });

  showLayout = computed(() => {
    const url = this.currentUrl();
    const isPublic = url === '/' || url.startsWith('/login') || url.startsWith('/register');
    return this.auth.isLoggedIn() && !isPublic;
  });

  navItems = computed(() => {
    const loaded = this.auth.sessionLoaded();
    if (!loaded) return [];
    const canAccessSwagger = this.auth.user()?.canAccessSwagger;
    return NAV_ITEMS.filter((item) => {
      if (item.requireSuperOrg && !canAccessSwagger) return false;
      if (!item.permission) return true;
      return this.auth.hasPermission(item.permission);
    });
  });

  toggleMobileMenu() {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
