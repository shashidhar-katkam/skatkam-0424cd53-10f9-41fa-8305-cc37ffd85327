import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RolesApiService } from '../../../core/api/roles-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { CardComponent, DataTableComponent, EmptyStateComponent, LoadingBlockComponent } from '../../../shared/ui';
import type { Role } from '@assessment-task/data';

const PAGE_SIZE = 10;

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, DataTableComponent, EmptyStateComponent, LoadingBlockComponent],
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.scss',
})
export class RoleListComponent implements OnInit {
  roles = signal<Role[]>([]);
  total = signal(0);
  loading = signal(true);
  pageIndex = signal(0);
  readonly pageSize = PAGE_SIZE;

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));

  private destroyRef = inject(DestroyRef);

  setPage(i: number) {
    const max = Math.max(0, Math.ceil(this.total() / this.pageSize) - 1);
    const next = Math.max(0, Math.min(i, max));
    this.pageIndex.set(next);
    this.loadPage(next + 1);
  }

  private loadPage(page: number) {
    this.loading.set(true);
    this.rolesApi
      .getRoles(page, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.roles.set(res.items);
          this.total.set(res.total);
        },
        error: () => {
          this.roles.set([]);
          this.total.set(0);
        },
        complete: () => this.loading.set(false),
      });
  }

  constructor(
    private rolesApi: RolesApiService,
    private auth: AuthService
  ) {}

  canEdit(): boolean {
    return this.auth.hasPermission('roles.create_roles') || this.auth.hasPermission('roles.update_roles');
  }

  permissionCount(r: Role): number {
    const p = r.permissions;
    if (!p || typeof p !== 'object') return 0;
    return Object.keys(p).filter((k) => p[k] === true).length;
  }

  ngOnInit() {
    this.loadPage(1);
  }

  deleteRole(role: Role) {
    if (!confirm(`Delete role "${role.name}"?`)) return;
    this.rolesApi
      .delete(role.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadPage(this.pageIndex() + 1),
      });
  }
}
