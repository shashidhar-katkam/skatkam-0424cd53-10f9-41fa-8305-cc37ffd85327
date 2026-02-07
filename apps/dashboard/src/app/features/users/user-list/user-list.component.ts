import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UsersApiService, UserResponse } from '../../../core/api/users-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { CardComponent, DataTableComponent, EmptyStateComponent, LoadingBlockComponent } from '../../../shared/ui';

const PAGE_SIZE = 10;

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, DataTableComponent, EmptyStateComponent, LoadingBlockComponent],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  users = signal<UserResponse[]>([]);
  total = signal(0);
  loading = signal(true);
  pageIndex = signal(0);
  readonly pageSize = PAGE_SIZE;

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));
  paginatedRange = (): string => {
    const tot = this.total();
    if (tot === 0) return '0-0';
    const start = this.pageIndex() * this.pageSize + 1;
    const end = Math.min((this.pageIndex() + 1) * this.pageSize, tot);
    return `${start}-${end}`;
  };

  private destroyRef = inject(DestroyRef);

  setPage(i: number) {
    const max = Math.max(0, Math.ceil(this.total() / this.pageSize) - 1);
    const next = Math.max(0, Math.min(i, max));
    this.pageIndex.set(next);
    this.loadPage(next + 1);
  }

  private loadPage(page: number) {
    this.loading.set(true);
    this.usersApi
      .getUsers(page, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.users.set(res.items);
          this.total.set(res.total);
        },
        error: () => {
          this.users.set([]);
          this.total.set(0);
        },
        complete: () => this.loading.set(false),
      });
  }

  constructor(
    private usersApi: UsersApiService,
    private auth: AuthService
  ) {}

  currentUserId(): string | undefined {
    return this.auth.user()?.id;
  }

  canEdit(): boolean {
    return this.auth.hasPermission('users.create_users') || this.auth.hasPermission('users.update_users');
  }

  ngOnInit() {
    this.loadPage(1);
  }

  deleteUser(user: UserResponse) {
    if (!confirm(`Delete user "${user.email}"?`)) return;
    this.usersApi
      .delete(user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadPage(this.pageIndex() + 1),
      });
  }
}
