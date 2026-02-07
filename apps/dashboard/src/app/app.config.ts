import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { appRoutes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { AuthService } from './core/auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideAnimations(),
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService) => () => auth.loadSession(),
      deps: [AuthService],
      multi: true,
    },
  ],
};
