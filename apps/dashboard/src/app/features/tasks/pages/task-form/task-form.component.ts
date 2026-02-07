import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { TasksApiService } from '../../../../core/api/tasks-api.service';
import { UsersApiService, UserResponse } from '../../../../core/api/users-api.service';
import type { CreateTaskDto, TaskStatus, TaskCategory, TaskPriority } from '@assessment-task/data';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 class="page-title mb-8">{{ isEdit() ? 'Edit task' : 'New task' }}</h1>
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card space-y-5 p-6">
        <div>
          <label class="block text-sm font-medium text-slate-700">Title <span class="text-red-500">*</span></label>
          <input formControlName="title" class="input-field mt-1" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">Description</label>
          <textarea formControlName="description" rows="3" class="input-field mt-1"></textarea>
        </div>
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-slate-700">Status</label>
            <select formControlName="status" class="input-field mt-1">
              <option value="todo">Todo</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700">Category</label>
            <select formControlName="category" class="input-field mt-1">
              <option value="">None</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-slate-700">Priority</label>
            <select formControlName="priority" class="input-field mt-1">
              <option value="">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700">Due date</label>
            <input formControlName="dueDate" type="date" class="input-field mt-1" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">Assignee</label>
          <select formControlName="assigneeId" class="input-field mt-1">
            <option value="">Unassigned</option>
            @for (u of users(); track u.id) {
              <option [value]="u.id">{{ u.name || u.email }}</option>
            }
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">Issue key (e.g. TASK-123)</label>
          <input formControlName="issueKey" type="text" placeholder="TASK-123" class="input-field mt-1" />
        </div>
        <div class="flex gap-3 pt-2">
          <button type="submit" [disabled]="form.invalid || saving()" class="btn-primary">
            {{ saving() ? 'Saving...' : 'Save' }}
          </button>
          <a routerLink="/tasks" class="btn-secondary">Cancel</a>
        </div>
      </form>
    </div>
  `,
})
export class TaskFormComponent implements OnInit {
  form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    status: ['todo' as TaskStatus],
    category: ['' as TaskCategory | ''],
    priority: ['' as TaskPriority | ''],
    dueDate: [''],
    assigneeId: [''],
    issueKey: [''],
  });
  users = signal<UserResponse[]>([]);
  saving = signal(false);
  isEdit = signal(false);
  taskId = signal<string | null>(null);

  private destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private tasksApi: TasksApiService,
    private usersApi: UsersApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.usersApi
      .getUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (res) => this.users.set(res.items) });
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.taskId.set(id);
      this.tasksApi
        .getTask(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (t) =>
            this.form.patchValue({
              title: t.title,
              description: t.description ?? '',
              status: t.status as TaskStatus,
              category: (t.category as TaskCategory) ?? '',
              priority: (t.priority as TaskPriority) ?? '',
              dueDate: t.dueDate ?? '',
              assigneeId: t.assigneeId ?? '',
              issueKey: t.issueKey ?? '',
            }),
        });
    }
  }

  onSubmit() {
    if (this.form.invalid || this.saving()) return;
    const raw = this.form.getRawValue();
    const dto: CreateTaskDto = {
      title: raw.title,
      description: raw.description || undefined,
      status: raw.status,
      category: raw.category || undefined,
      priority: raw.priority || undefined,
      dueDate: raw.dueDate || undefined,
      assigneeId: raw.assigneeId || undefined,
      issueKey: raw.issueKey || undefined,
    };
    this.saving.set(true);
    const id = this.taskId();
    if (id) {
      this.tasksApi
        .update(id, {
          title: dto.title,
          description: dto.description,
          status: dto.status,
          category: dto.category,
          priority: dto.priority as import('@assessment-task/data').TaskPriority | null,
          dueDate: dto.dueDate || null,
          assigneeId: dto.assigneeId || null,
          issueKey: dto.issueKey || null,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.router.navigate(['/tasks']),
          complete: () => this.saving.set(false),
        });
    } else {
      this.tasksApi
        .create(dto)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.router.navigate(['/tasks']),
          complete: () => this.saving.set(false),
        });
    }
  }
}
