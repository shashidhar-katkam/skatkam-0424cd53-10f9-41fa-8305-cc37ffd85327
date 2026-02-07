import { Component, inject, input, output, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TasksApiService } from '../../../../core/api/tasks-api.service';
import type { TaskDetail, TaskStatus } from '@assessment-task/data';

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Todo',
  in_progress: 'In progress',
  done: 'Done',
};
const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

@Component({
  selector: 'app-task-view-dialog',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm dark:bg-black/70" (click)="close()">
      <div
        class="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-start justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/80">
          <h2 class="truncate pr-4 text-xl font-semibold text-slate-900 dark:text-slate-100">{{ task()?.title ?? 'Task' }}</h2>
          <button type="button" class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-600 dark:hover:text-slate-200" (click)="close()" aria-label="Close">✕</button>
        </div>
        <div class="flex-1 space-y-5 overflow-y-auto p-6">
          @if (loading()) {
            <p class="text-slate-500 dark:text-slate-400">Loading...</p>
          } @else {
            @if (task(); as t) {
              @if (t.issueKey) {
                <p class="font-mono text-sm text-slate-500 dark:text-slate-400">{{ t.issueKey }}</p>
              }
              @if (t.description) {
                <div>
                  <h3 class="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Description</h3>
                  <p class="whitespace-pre-wrap text-slate-800 dark:text-slate-200">{{ t.description }}</p>
                </div>
              }
              <dl class="grid grid-cols-2 gap-4 text-sm">
                <div class="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-700/50">
                  <dt class="text-xs font-medium text-slate-500 dark:text-slate-400">Status</dt>
                  <dd class="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{{ getStatusLabel(t.status) }}</dd>
                </div>
                <div class="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-700/50">
                  <dt class="text-xs font-medium text-slate-500 dark:text-slate-400">Category</dt>
                  <dd class="mt-0.5 text-slate-900 dark:text-slate-100">{{ t.category ?? '—' }}</dd>
                </div>
                @if (t.priority) {
                  <div class="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-700/50">
                    <dt class="text-xs font-medium text-slate-500 dark:text-slate-400">Priority</dt>
                    <dd class="mt-0.5 text-slate-900 dark:text-slate-100">{{ getPriorityLabel(t.priority) }}</dd>
                  </div>
                }
                @if (t.dueDate) {
                  <div class="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-700/50">
                    <dt class="text-xs font-medium text-slate-500 dark:text-slate-400">Due date</dt>
                    <dd class="mt-0.5 text-slate-900 dark:text-slate-100">{{ t.dueDate }}</dd>
                  </div>
                }
                <div class="col-span-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-700/50">
                  <dt class="text-xs font-medium text-slate-500 dark:text-slate-400">Created by</dt>
                  <dd class="mt-0.5 text-slate-900 dark:text-slate-100">
                    @if (t.createdBy) {
                      <span>{{ t.createdBy.name ?? t.createdBy.email }}</span>
                      <span class="ml-1 text-slate-500 dark:text-slate-400">({{ t.createdBy.email }})</span>
                    } @else { — }
                  </dd>
                </div>
                @if (t.assignee) {
                  <div class="col-span-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-700/50">
                    <dt class="text-xs font-medium text-slate-500 dark:text-slate-400">Assignee</dt>
                    <dd class="mt-0.5 text-slate-900 dark:text-slate-100">{{ t.assignee.name ?? t.assignee.email }}</dd>
                  </div>
                }
                <div class="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-700/50">
                  <dt class="text-xs font-medium text-slate-500 dark:text-slate-400">Created</dt>
                  <dd class="mt-0.5 text-slate-900 dark:text-slate-100">{{ t.createdAt | date:'medium' }}</dd>
                </div>
                <div class="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-700/50">
                  <dt class="text-xs font-medium text-slate-500 dark:text-slate-400">Updated</dt>
                  <dd class="mt-0.5 text-slate-900 dark:text-slate-100">{{ t.updatedAt | date:'medium' }}</dd>
                </div>
              </dl>
            }
          }
        </div>
        <div class="flex justify-end gap-3 border-t border-slate-200 bg-slate-50/50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/80">
          <button type="button" class="btn-secondary" (click)="close()">Close</button>
          <a [routerLink]="['/tasks', task()?.id, 'edit']" class="btn-primary" (click)="close()">Edit</a>
        </div>
      </div>
    </div>
  `,
})
export class TaskViewDialogComponent implements OnInit {
  taskId = input.required<string>();
  private tasksApi = inject(TasksApiService);
  private destroyRef = inject(DestroyRef);

  task = signal<TaskDetail | null>(null);
  loading = signal(true);
  closed = output<void>();

  readonly STATUS_LABELS = STATUS_LABELS;
  readonly PRIORITY_LABELS = PRIORITY_LABELS;

  ngOnInit() {
    const id = this.taskId();
    if (!id) return;
    this.tasksApi
      .getTask(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (t: TaskDetail) => {
          this.task.set(t);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  getStatusLabel(status: string): string {
    return STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status;
  }

  getPriorityLabel(priority: string): string {
    return PRIORITY_LABELS[priority] ?? priority;
  }

  close() {
    this.closed.emit();
  }
}
