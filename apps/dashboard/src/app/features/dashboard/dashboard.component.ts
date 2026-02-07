import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';
import { Chart, registerables } from 'chart.js';
import type { ChartConfiguration } from 'chart.js';
import { AuthService } from '../../core/auth/auth.service';
import { TasksApiService } from '../../core/api/tasks-api.service';
import type { Task, TaskStatus } from '@assessment-task/data';

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Todo',
  in_progress: 'In progress',
  done: 'Done',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NgChartsModule],
  template: `
    <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 class="page-title mb-8">Dashboard</h1>

      <section class="card mb-8 overflow-hidden">
        <div class="card-header">
          <h2 class="section-title">Your account</h2>
        </div>
        <div class="px-6 py-5">
          @if (user(); as u) {
            <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div class="rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-700/50">
                <dt class="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Name</dt>
                <dd class="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{{ u.name || '—' }}</dd>
              </div>
              <div class="rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-700/50">
                <dt class="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Email</dt>
                <dd class="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{{ u.email }}</dd>
              </div>
              <div class="rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-700/50">
                <dt class="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Role</dt>
                <dd class="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{{ u.roleName || u.role || '—' }}</dd>
              </div>
              <div class="rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-700/50">
                <dt class="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">User ID</dt>
                <dd class="mt-1 truncate font-mono text-xs text-slate-700 dark:text-slate-300" [title]="u.id">{{ u.id }}</dd>
              </div>
            </dl>
          } @else {
            <p class="text-slate-500 dark:text-slate-400">Loading...</p>
          }
        </div>
      </section>

      <section class="card overflow-hidden">
        <div class="card-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 class="section-title">Task summary</h2>
          @if (canViewTasks()) {
            <a routerLink="/tasks" class="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">View all tasks →</a>
          }
        </div>
        <div class="px-6 py-5">
          @if (!canViewTasks()) {
            <p class="text-slate-500 dark:text-slate-400">You don't have permission to view tasks.</p>
          } @else if (tasksLoading()) {
            <p class="text-slate-500 dark:text-slate-400">Loading...</p>
          } @else {
            <div class="space-y-8">
              <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-600 dark:bg-slate-700/50">
                  <p class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total</p>
                  <p class="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{{ summary().total }}</p>
                </div>
                <div class="rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm dark:border-amber-700/50 dark:bg-amber-900/20">
                  <p class="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Todo</p>
                  <p class="mt-2 text-2xl font-bold text-amber-800 dark:text-amber-300">{{ summary().todo }}</p>
                </div>
                <div class="rounded-xl border border-indigo-200 bg-indigo-50/50 p-5 shadow-sm dark:border-indigo-700/50 dark:bg-indigo-900/20">
                  <p class="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">In progress</p>
                  <p class="mt-2 text-2xl font-bold text-indigo-800 dark:text-indigo-300">{{ summary().inProgress }}</p>
                </div>
                <div class="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm dark:border-emerald-700/50 dark:bg-emerald-900/20">
                  <p class="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Done</p>
                  <p class="mt-2 text-2xl font-bold text-emerald-800 dark:text-emerald-300">{{ summary().done }}</p>
                </div>
              </div>

              @if (summary().total > 0) {
                <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div class="rounded-xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-600 dark:bg-slate-700/30">
                    <h3 class="section-title mb-4 text-base">Tasks by status (pie)</h3>
                    <div class="h-64 flex items-center justify-center">
                      <canvas baseChart [data]="pieChartData()" [options]="pieChartOptions" type="pie"></canvas>
                    </div>
                  </div>
                  <div class="rounded-xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-600 dark:bg-slate-700/30">
                    <h3 class="section-title mb-4 text-base">Tasks by status (bar)</h3>
                    <div class="h-64 flex items-center justify-center">
                      <canvas baseChart [data]="barChartData()" [options]="barChartOptions" type="bar"></canvas>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 class="section-title mb-3 text-base">Completion rate</h3>
                  <div class="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600">
                    <div class="h-full rounded-full bg-emerald-500 transition-all duration-500" [style.width.%]="completionPercent()"></div>
                  </div>
                  <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">{{ summary().done }} of {{ summary().total }} tasks completed ({{ completionPercent() }}%)</p>
                </div>
              } @else {
                <div class="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 py-12 text-center dark:border-slate-600 dark:bg-slate-700/30">
                  <p class="text-slate-600 dark:text-slate-400">No tasks yet.</p>
                  <a routerLink="/tasks/new" class="btn-primary mt-4 inline-flex">Create a task</a>
                </div>
              }
            </div>
          }
        </div>
      </section>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private tasksApi = inject(TasksApiService);
  private destroyRef = inject(DestroyRef);

  readonly STATUS_LABELS = STATUS_LABELS;

  user = this.auth.user;
  tasks = signal<Task[]>([]);
  tasksLoading = signal(true);

  summary = computed(() => {
    const list = this.tasks();
    let todo = 0;
    let inProgress = 0;
    let done = 0;
    for (const t of list) {
      const s = (t.status || 'todo') as TaskStatus;
      if (s === 'todo') todo++;
      else if (s === 'in_progress') inProgress++;
      else done++;
    }
    return {
      total: list.length,
      todo,
      inProgress,
      done,
    };
  });

  completionPercent = computed(() => {
    const s = this.summary();
    if (s.total === 0) return 0;
    return Math.round((s.done / s.total) * 100);
  });

  pieChartData = computed<ChartConfiguration<'pie'>['data']>(() => {
    const s = this.summary();
    const labels = [STATUS_LABELS['todo'], STATUS_LABELS['in_progress'], STATUS_LABELS['done']];
    const data = [s.todo, s.inProgress, s.done];
    const backgroundColor = ['rgba(251, 191, 36, 0.85)', 'rgba(96, 165, 250, 0.85)', 'rgba(34, 197, 94, 0.85)'];
    return {
      labels,
      datasets: [{ data, backgroundColor }],
    };
  });

  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    },
  };

  barChartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const s = this.summary();
    const labels = [STATUS_LABELS['todo'], STATUS_LABELS['in_progress'], STATUS_LABELS['done']];
    const data = [s.todo, s.inProgress, s.done];
    const backgroundColor = ['rgba(251, 191, 36, 0.85)', 'rgba(96, 165, 250, 0.85)', 'rgba(34, 197, 94, 0.85)'];
    return {
      labels,
      datasets: [{ data, label: 'Tasks', backgroundColor }],
    };
  });

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  barWidth(status: TaskStatus): number {
    const s = this.summary();
    if (s.total === 0) return 0;
    const count = status === 'todo' ? s.todo : status === 'in_progress' ? s.inProgress : s.done;
    return (count / s.total) * 100;
  }

  canViewTasks(): boolean {
    return this.auth.hasPermission('tasks.view');
  }

  ngOnInit() {
    Chart.register(...registerables);
    if (this.canViewTasks()) {
      this.tasksApi
        .getTasks({ sortBy: 'createdAt', sortOrder: 'desc' })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (list) => this.tasks.set(list),
          error: () => this.tasks.set([]),
          complete: () => this.tasksLoading.set(false),
        });
    } else {
      this.tasksLoading.set(false);
    }
  }
}
