import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { UsersApiService, UserResponse } from '../../../core/api/users-api.service';
import { RolesApiService } from '../../../core/api/roles-api.service';
import type { Role } from '@assessment-task/data';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 class="page-title mb-8">{{ isEdit() ? 'Edit user' : 'New user' }}</h1>
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card space-y-5 p-6">
        <div>
          <label class="block text-sm font-medium text-slate-700">Email <span class="text-red-500">*</span></label>
          <input formControlName="email" type="email" class="input-field mt-1" [readonly]="isEdit()" />
          @if (isEdit()) {
            <p class="mt-1.5 text-xs text-slate-500">Email cannot be changed.</p>
          }
        </div>
        @if (!isEdit()) {
          <div>
            <label class="block text-sm font-medium text-slate-700">Password <span class="text-red-500">*</span></label>
            <input formControlName="password" type="password" class="input-field mt-1" />
          </div>
        }
        @if (isEdit()) {
          <div>
            <label class="block text-sm font-medium text-slate-700">New password (leave empty to keep)</label>
            <input formControlName="newPassword" type="password" class="input-field mt-1" />
          </div>
        }
        <div>
          <label class="block text-sm font-medium text-slate-700">Name</label>
          <input formControlName="name" class="input-field mt-1" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">Role <span class="text-red-500">*</span></label>
          <select formControlName="roleId" class="input-field mt-1">
            @for (r of roles(); track r.id) {
              <option [value]="r.id">{{ r.name }} ({{ r.slug }})</option>
            }
          </select>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="submit" [disabled]="form.invalid || saving()" class="btn-primary">
            {{ saving() ? 'Saving...' : 'Save' }}
          </button>
          <a routerLink="/users" class="btn-secondary">Cancel</a>
        </div>
      </form>
    </div>
  `,
})
export class UserFormComponent implements OnInit {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.minLength(6)],
    newPassword: ['', Validators.minLength(6)],
    name: [''],
    roleId: ['', Validators.required],
  });
  roles = signal<Role[]>([]);
  saving = signal(false);
  userId: string | null = null;
  isEdit = () => !!this.userId;

  private destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private usersApi: UsersApiService,
    private rolesApi: RolesApiService
  ) {}

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id');
    this.rolesApi
      .getRoles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (res) => this.roles.set(res.items) });
    if (this.userId) {
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
      this.usersApi
        .getUser(this.userId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (user: UserResponse) => {
            this.form.patchValue({
              email: user.email,
              name: user.name ?? '',
              roleId: user.roleId,
            });
          },
        });
    } else {
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  onSubmit() {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    if (this.userId) {
      const dto: { name?: string; roleId?: string; password?: string } = {
        name: this.form.value.name ?? undefined,
        roleId: this.form.value.roleId ?? undefined,
      };
      const np = this.form.value.newPassword;
      if (np && np.length >= 6) dto.password = np;
      this.usersApi
        .update(this.userId, dto)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.router.navigate(['/users']);
          },
          error: () => this.saving.set(false),
        });
    } else {
      this.usersApi
        .create({
          email: this.form.value.email!,
          password: this.form.value.password!,
          name: this.form.value.name || undefined,
          roleId: this.form.value.roleId!,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.router.navigate(['/users']);
          },
          error: () => this.saving.set(false),
        });
    }
  }
}
