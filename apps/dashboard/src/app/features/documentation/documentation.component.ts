import { Component, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { CardComponent } from '../../shared/ui';

const TOKEN_KEY = 'task_jwt';

@Component({
  standalone: true,
  imports: [CardComponent],
  templateUrl: './documentation.component.html',
  styleUrl: './documentation.component.scss',
})
export class DocumentationComponent {
  private auth: AuthService = inject(AuthService);

  openSwagger(): void {
    const base = `${environment.apiUrl}/api-docs`;
    const fromAuth = this.auth.getToken();
    const fromStorage = localStorage.getItem(TOKEN_KEY);
    const token = fromAuth ?? fromStorage;
    const url: string = token ? `${base}?token=${encodeURIComponent(token)}` : base;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
