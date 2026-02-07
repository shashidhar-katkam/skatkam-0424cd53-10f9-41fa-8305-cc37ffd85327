import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { PermissionsApiService } from '../../../core/api/permissions-api.service';
import { RolesApiService } from '../../../core/api/roles-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import type { PermissionModuleStructure, Role } from '@assessment-task/data';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 class="page-title mb-8">{{ isEdit() ? 'Edit role' : 'New role' }}</h1>
      @if (loadingStructure()) {
        <div class="card flex items-center justify-center px-6 py-12">
          <p class="text-slate-500 dark:text-slate-400">Loading permissions...</p>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
          <div class="card p-6 space-y-5">
            <div>
              <label class="block text-sm font-medium text-slate-700">Name <span class="text-red-500">*</span></label>
              <input formControlName="name" class="input-field mt-1" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700">Slug <span class="text-red-500">*</span></label>
              <input formControlName="slug" class="input-field mt-1" placeholder="e.g. custom_role" />
            </div>
            <div class="flex items-center gap-3">
              <input type="checkbox" formControlName="isActive" id="isActive" class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <label for="isActive" class="text-sm font-medium text-slate-700">Active</label>
            </div>
          </div>

          <div class="card overflow-hidden">
            <div class="card-header">
              <h2 class="section-title">Permissions</h2>
            </div>
            <div class="space-y-4 p-6">
              @for (mod of structure(); track mod.moduleId) {
                <div class="rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-600 dark:bg-slate-700/30">
                  <h3 class="font-medium text-slate-900 dark:text-slate-100 mb-3">{{ mod.moduleName }}</h3>
                  <div class="flex flex-wrap gap-x-6 gap-y-2">
                    @for (f of mod.features; track f.permissionKey) {
                      <label class="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" [checked]="isChecked(f.permissionKey)" (change)="togglePermission(f.permissionKey, $any($event.target).checked)" class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                        <span class="text-sm text-slate-700 dark:text-slate-300">{{ f.featureName }}</span>
                      </label>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="flex gap-3">
            <button type="submit" [disabled]="form.invalid || saving()" class="btn-primary">
              {{ saving() ? 'Saving...' : 'Save' }}
            </button>
            <a routerLink="/roles" class="btn-secondary">Cancel</a>
          </div>
        </form>
      }
    </div>
  `,
})
export class RoleFormComponent implements OnInit {
  form = this.fb.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
    isActive: [true],
  });
  structure = signal<PermissionModuleStructure[]>([]);
  loadingStructure = signal(true);
  saving = signal(false);
  permissions: Record<string, boolean> = {};
  roleId: string | null = null;

  isEdit = computed(() => !!this.roleId);

  private destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private permissionsApi: PermissionsApiService,
    private rolesApi: RolesApiService,
    private auth: AuthService
  ) {}

  isChecked(permissionKey: string): boolean {
    return !!this.permissions[permissionKey];
  }

  togglePermission(permissionKey: string, checked: boolean) {
    this.permissions = { ...this.permissions, [permissionKey]: checked };
  }

  ngOnInit() {
    this.roleId = this.route.snapshot.paramMap.get('id');
    this.permissionsApi
      .getStructure()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (s: PermissionModuleStructure[]) => {
          this.structure.set(s);
          this.loadingStructure.set(false);
        },
        error: () => this.loadingStructure.set(false),
      });
    if (this.roleId) {
      this.rolesApi
        .getRole(this.roleId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (role: Role) => {
            this.form.patchValue({
              name: role.name,
              slug: role.slug,
              isActive: role.isActive !== false,
            });
            this.permissions = { ...(role.permissions || {}) };
          },
        });
    }
  }

  onSubmit() {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const name = this.form.value.name ?? '';
    const slug = this.form.value.slug ?? '';
    const isActive = this.form.value.isActive ?? true;
    if (this.roleId) {
      this.rolesApi
        .update(this.roleId, { name, slug, isActive, permissions: this.permissions })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.router.navigate(['/roles']);
          },
          error: () => this.saving.set(false),
        });
    } else {
      this.rolesApi
        .create({ name, slug, isActive, permissions: this.permissions })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.router.navigate(['/roles']);
          },
          error: () => this.saving.set(false),
        });
    }
  }
}
