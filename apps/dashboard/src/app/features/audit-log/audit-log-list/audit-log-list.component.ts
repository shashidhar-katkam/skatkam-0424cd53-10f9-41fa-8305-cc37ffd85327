import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { AuditApiService } from '../../../core/api/audit-api.service';
import { CardComponent, DataTableComponent, EmptyStateComponent, LoadingBlockComponent } from '../../../shared/ui';
import type { AuditLogEntry } from '@assessment-task/data';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-audit-log-list',
  standalone: true,
  imports: [CommonModule, CardComponent, DataTableComponent, EmptyStateComponent, LoadingBlockComponent],
  templateUrl: './audit-log-list.component.html',
  styleUrl: './audit-log-list.component.scss',
})
export class AuditLogListComponent implements OnInit {
  entries = signal<AuditLogEntry[]>([]);
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
    this.auditApi
      .getAuditLog(page, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.entries.set(res.items);
          this.total.set(res.total);
        },
        error: () => {
          this.entries.set([]);
          this.total.set(0);
        },
        complete: () => this.loading.set(false),
      });
  }

  constructor(private auditApi: AuditApiService) {}

  ngOnInit() {
    this.loadPage(1);
  }
}
