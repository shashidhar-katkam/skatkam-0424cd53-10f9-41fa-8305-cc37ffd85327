import { Component, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../../core/api/auth-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { getFirstAllowedPath } from '../../../core/navigation/navigation.config';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  form = this.fb.nonNullable.group({
    organizationName: ['', [Validators.required, Validators.maxLength(200)]],
    email: ['', [Validators.required, Validators.email]],
    name: ['', [Validators.maxLength(200)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });
  loading = false;
  errorMessage = '';

  theme = inject(ThemeService);
  private destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private authApi: AuthApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.errorMessage = '';
    const raw = this.form.getRawValue();
    this.authApi
      .register({
        organizationName: raw.organizationName,
        email: raw.email,
        password: raw.password,
        name: raw.name || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.auth.setSession(res);
          this.router.navigate([getFirstAllowedPath(this.auth)]);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.message || 'Registration failed';
        },
      });
  }
}
