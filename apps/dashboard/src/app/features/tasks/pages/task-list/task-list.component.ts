import { Component, OnInit, signal, computed, inject, DestroyRef, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { TasksApiService } from '../../../../core/api/tasks-api.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { TaskViewDialogComponent } from '../task-view-dialog/task-view-dialog.component';
import { ShortcutsHelpDialogComponent } from '../../components/shortcuts-help-dialog/shortcuts-help-dialog.component';
import type { Task, TaskStatus, TaskCategory } from '@assessment-task/data';

const STATUS_LIST: TaskStatus[] = ['todo', 'in_progress', 'done'];
const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Todo',
  in_progress: 'In progress',
  done: 'Done',
};

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DragDropModule, TaskViewDialogComponent, ShortcutsHelpDialogComponent],
  template: `
    <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-2">
          <h1 class="page-title">Todos</h1>
          <button
            type="button"
            (click)="openShortcutsHelp()"
            class="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            title="Keyboard shortcuts"
            aria-label="Show keyboard shortcuts"
          >
            <span class="text-lg">ℹ️</span>
          </button>
        </div>
        @if (canCreate()) {
          <a routerLink="/tasks/new" class="btn-primary shrink-0">New task</a>
        }
      </div>

      <div class="mt-8 flex flex-wrap gap-3">
        <select [(ngModel)]="filterStatus" (ngModelChange)="load()" class="input-field w-auto min-w-[140px]">
          <option value="">All statuses</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </select>
        <select [(ngModel)]="filterCategory" (ngModelChange)="load()" class="input-field w-auto min-w-[140px]">
          <option value="">All categories</option>
          <option value="Work">Work</option>
          <option value="Personal">Personal</option>
          <option value="Other">Other</option>
        </select>
        <select [(ngModel)]="sortBy" (ngModelChange)="load()" class="input-field w-auto min-w-[140px]">
          <option value="">Board order</option>
          <option value="createdAt">Created</option>
          <option value="title">Title</option>
          <option value="status">Status</option>
          <option value="category">Category</option>
        </select>
      </div>

      @if (loading()) {
        <div class="card mt-8 flex items-center justify-center px-6 py-12">
          <p class="text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      } @else if (tasks().length === 0) {
        <div class="card mt-8 rounded-lg border-dashed border-slate-300 py-12 text-center dark:border-slate-600">
          <p class="text-slate-600 dark:text-slate-400">No tasks yet.</p>
          @if (canCreate()) {
            <a routerLink="/tasks/new" class="btn-primary mt-4 inline-flex">New task</a>
          }
        </div>
      } @else {
        <div class="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div
            cdkDropList id="todo"
            [cdkDropListData]="todoList()"
            [cdkDropListConnectedTo]="connectedLists()"
            (cdkDropListDropped)="onDrop($event)"
            class="flex min-h-[280px] flex-col rounded-xl border border-amber-200/60 bg-amber-50/30 p-4 shadow-sm max-h-[75vh] dark:border-amber-800/50 dark:bg-amber-900/20"
          >
            <h2 class="mb-3 shrink-0 text-sm font-semibold uppercase tracking-wider text-amber-800">{{ STATUS_LABELS['todo'] }} ({{ todoList().length }})</h2>
            <div class="min-h-0 flex-1 space-y-3 overflow-y-auto">
              @for (t of todoList(); track t.id) {
                <div
                  cdkDrag [cdkDragDisabled]="!canUpdate()"
                  (cdkDragStarted)="onDragStarted($event, t)" (cdkDragEnded)="onDragEnded()"
                  class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow dark:border-slate-600 dark:bg-slate-800 dark:hover:shadow-lg"
                  [ngClass]="canUpdate() ? 'cursor-grab touch-none' : ''"
                >
                  <div class="flex items-start gap-2">
                    @if (canUpdate()) { <div cdkDragHandle class="shrink-0 cursor-grab touch-none p-1 -ml-1 text-slate-400 hover:text-slate-600">⋮⋮</div> }
                    <div class="min-w-0 flex-1 cursor-pointer" (click)="openView(t.id)">
                      <span class="block truncate font-medium text-slate-900 dark:text-slate-100">{{ t.title }}</span>
                      @if (t.description) { <p class="mt-1 truncate text-sm text-slate-600 dark:text-slate-400">{{ t.description }}</p> }
                      @if (t.category) { <span class="badge badge-neutral mt-1.5">{{ t.category }}</span> }
                    </div>
                    @if (canUpdate() || canDelete()) {
                      <div class="flex shrink-0 gap-2">
                        @if (canUpdate()) { <a [routerLink]="['/tasks', t.id, 'edit']" class="text-sm font-medium text-indigo-600 hover:text-indigo-500" (click)="$event.stopPropagation()">Edit</a> }
                        @if (canDelete()) { <button type="button" (click)="deleteTask(t.id); $event.stopPropagation()" class="text-sm font-medium text-red-600 hover:text-red-500">Delete</button> }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
          <div
            cdkDropList id="in_progress"
            [cdkDropListData]="inProgressList()"
            [cdkDropListConnectedTo]="connectedLists()"
            (cdkDropListDropped)="onDrop($event)"
            class="flex min-h-[280px] flex-col rounded-xl border border-indigo-200/60 bg-indigo-50/30 p-4 shadow-sm max-h-[75vh] dark:border-indigo-800/50 dark:bg-indigo-900/20"
          >
            <h2 class="mb-3 shrink-0 text-sm font-semibold uppercase tracking-wider text-indigo-800">{{ STATUS_LABELS['in_progress'] }} ({{ inProgressList().length }})</h2>
            <div class="min-h-0 flex-1 space-y-3 overflow-y-auto">
              @for (t of inProgressList(); track t.id) {
                <div
                  cdkDrag [cdkDragDisabled]="!canUpdate()"
                  (cdkDragStarted)="onDragStarted($event, t)" (cdkDragEnded)="onDragEnded()"
                  class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow dark:border-slate-600 dark:bg-slate-800 dark:hover:shadow-lg"
                  [ngClass]="canUpdate() ? 'cursor-grab touch-none' : ''"
                >
                  <div class="flex items-start gap-2">
                    @if (canUpdate()) { <div cdkDragHandle class="shrink-0 cursor-grab touch-none p-1 -ml-1 text-slate-400 hover:text-slate-600">⋮⋮</div> }
                    <div class="min-w-0 flex-1 cursor-pointer" (click)="openView(t.id)">
                      <span class="block truncate font-medium text-slate-900 dark:text-slate-100">{{ t.title }}</span>
                      @if (t.description) { <p class="mt-1 truncate text-sm text-slate-600 dark:text-slate-400">{{ t.description }}</p> }
                      @if (t.category) { <span class="badge badge-neutral mt-1.5">{{ t.category }}</span> }
                    </div>
                    @if (canUpdate() || canDelete()) {
                      <div class="flex shrink-0 gap-2">
                        @if (canUpdate()) { <a [routerLink]="['/tasks', t.id, 'edit']" class="text-sm font-medium text-indigo-600 hover:text-indigo-500" (click)="$event.stopPropagation()">Edit</a> }
                        @if (canDelete()) { <button type="button" (click)="deleteTask(t.id); $event.stopPropagation()" class="text-sm font-medium text-red-600 hover:text-red-500">Delete</button> }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
          <div
            cdkDropList id="done"
            [cdkDropListData]="doneList()"
            [cdkDropListConnectedTo]="connectedLists()"
            (cdkDropListDropped)="onDrop($event)"
            class="flex min-h-[280px] flex-col rounded-xl border border-emerald-200/60 bg-emerald-50/30 p-4 shadow-sm max-h-[75vh] dark:border-emerald-800/50 dark:bg-emerald-900/20"
          >
            <h2 class="mb-3 shrink-0 text-sm font-semibold uppercase tracking-wider text-emerald-800">{{ STATUS_LABELS['done'] }} ({{ doneList().length }})</h2>
            <div class="min-h-0 flex-1 space-y-3 overflow-y-auto">
              @for (t of doneList(); track t.id) {
                <div
                  cdkDrag [cdkDragDisabled]="!canUpdate()"
                  (cdkDragStarted)="onDragStarted($event, t)" (cdkDragEnded)="onDragEnded()"
                  class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow dark:border-slate-600 dark:bg-slate-800 dark:hover:shadow-lg"
                  [ngClass]="canUpdate() ? 'cursor-grab touch-none' : ''"
                >
                  <div class="flex items-start gap-2">
                    @if (canUpdate()) { <div cdkDragHandle class="shrink-0 cursor-grab touch-none p-1 -ml-1 text-slate-400 hover:text-slate-600">⋮⋮</div> }
                    <div class="min-w-0 flex-1 cursor-pointer" (click)="openView(t.id)">
                      <span class="block truncate font-medium text-slate-900 dark:text-slate-100">{{ t.title }}</span>
                      @if (t.description) { <p class="mt-1 truncate text-sm text-slate-600 dark:text-slate-400">{{ t.description }}</p> }
                      @if (t.category) { <span class="badge badge-neutral mt-1.5">{{ t.category }}</span> }
                    </div>
                    @if (canUpdate() || canDelete()) {
                      <div class="flex shrink-0 gap-2">
                        @if (canUpdate()) { <a [routerLink]="['/tasks', t.id, 'edit']" class="text-sm font-medium text-indigo-600 hover:text-indigo-500" (click)="$event.stopPropagation()">Edit</a> }
                        @if (canDelete()) { <button type="button" (click)="deleteTask(t.id); $event.stopPropagation()" class="text-sm font-medium text-red-600 hover:text-red-500">Delete</button> }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }
      @if (viewTaskId()) {
        <app-task-view-dialog [taskId]="viewTaskId()!" (closed)="closeView()" />
      }
      @if (shortcutsDialogOpen()) {
        <app-shortcuts-help-dialog (closed)="shortcutsDialogOpen.set(false)" />
      }
    </div>
  `,
})
export class TaskListComponent implements OnInit {
  tasks = signal<Task[]>([]);
  loading = signal(true);
  filterStatus = '';
  filterCategory = '';
  sortBy: '' | 'createdAt' | 'title' | 'status' | 'category' = '';
  statuses = STATUS_LIST;
  STATUS_LABELS = STATUS_LABELS;

  todoList = signal<Task[]>([]);
  inProgressList = signal<Task[]>([]);
  doneList = signal<Task[]>([]);
  viewTaskId = signal<string | null>(null);
  shortcutsDialogOpen = signal(false);

  connectedLists = computed(() => ['todo', 'in_progress', 'done']);

  private router = inject(Router);

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.isInputFocused()) return;
    const key = event.key;
    if (key === '?') {
      event.preventDefault();
      this.shortcutsDialogOpen.set(true);
      return;
    }
    if (key === 'Escape') {
      if (this.shortcutsDialogOpen()) this.shortcutsDialogOpen.set(false);
      else if (this.viewTaskId()) this.closeView();
      return;
    }
    if (key === 'n' || key === 'N') {
      if (!this.shortcutsDialogOpen() && !this.viewTaskId() && this.canCreate()) {
        event.preventDefault();
        this.router.navigate(['/tasks/new']);
      }
      return;
    }
    const viewId = this.viewTaskId();
    if (key === 'e' || key === 'E') {
      if (viewId) {
        event.preventDefault();
        this.closeView();
        this.router.navigate(['/tasks', viewId, 'edit']);
      }
      return;
    }
    if (key === 'Delete' || key === 'Backspace') {
      if (viewId && this.canDelete()) {
        event.preventDefault();
        if (confirm('Delete this task?')) {
          this.tasksApi.delete(viewId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
              this.closeView();
              this.load();
            },
          });
        }
      }
    }
  }

  private isInputFocused(): boolean {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.getAttribute('contenteditable') === 'true';
  }

  openShortcutsHelp(): void {
    this.shortcutsDialogOpen.set(true);
  }

  private syncListsFromTasks() {
    const list = this.tasks();
    const todo: Task[] = [];
    const inProgress: Task[] = [];
    const done: Task[] = [];
    for (const t of list) {
      const s = (t.status || 'todo') as TaskStatus;
      if (s === 'todo') todo.push(t);
      else if (s === 'in_progress') inProgress.push(t);
      else done.push(t);
    }
    this.todoList.set(todo);
    this.inProgressList.set(inProgress);
    this.doneList.set(done);
  }

  private destroyRef = inject(DestroyRef);

  constructor(
    private tasksApi: TasksApiService,
    private auth: AuthService
  ) {}

  canCreate(): boolean {
    return this.auth.hasPermission('tasks.create');
  }

  canUpdate(): boolean {
    return this.auth.hasPermission('tasks.update');
  }

  canDelete(): boolean {
    return this.auth.hasPermission('tasks.delete');
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    const params: import('@assessment-task/data').TaskListParams = {
      status: (this.filterStatus || undefined) as TaskStatus | undefined,
      category: (this.filterCategory || undefined) as TaskCategory | undefined,
    };
    if (this.sortBy) {
      params.sortBy = this.sortBy as 'createdAt' | 'title' | 'status' | 'category';
      params.sortOrder = this.sortBy === 'createdAt' ? 'desc' : 'asc';
    }
    this.tasksApi
      .getTasks(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.tasks.set(list);
          this.syncListsFromTasks();
        },
        error: () => this.tasks.set([]),
        complete: () => this.loading.set(false),
      });
  }

  onDrop(event: CdkDragDrop<Task[]>) {
    let task = event.item?.data as Task | undefined;
    if (!task?.id && event.previousContainer?.data) {
      const prevList = event.previousContainer.data as Task[];
      task = prevList[event.previousIndex];
    }
    if (!task?.id) return;
    const newStatus = event.container.id as TaskStatus;
    const targetList = event.container.data;
    const newOrder = event.currentIndex;

    if (!this.canUpdate()) return;
    const sameContainer = event.previousContainer === event.container;
    const samePosition = sameContainer && task.status === newStatus && targetList[newOrder]?.id === task.id;
    if (samePosition) return;

    const payload: { status: TaskStatus; order: number } = {
      status: newStatus,
      order: newOrder,
    };
    this.tasksApi
      .update(task.id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.load(),
        error: () => {},
      });
  }

  onDragStarted(_event: unknown, _task: Task) {}

  onDragEnded() {}

  openView(taskId: string) {
    this.viewTaskId.set(taskId);
  }

  closeView() {
    this.viewTaskId.set(null);
  }

  deleteTask(id: string) {
    if (!confirm('Delete this task?')) return;
    this.tasksApi
      .delete(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.load() });
  }
}
