import { Route } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { superOrgGuard } from './core/guards/super-org.guard';

export const appRoutes: Route[] = [
  { path: '', loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent) },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'roles',
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'roles.view_roles' },
    children: [
      { path: '', loadComponent: () => import('./features/roles/role-list/role-list.component').then(m => m.RoleListComponent) },
      { path: 'new', loadComponent: () => import('./features/roles/role-form/role-form.component').then(m => m.RoleFormComponent) },
      { path: ':id/edit', loadComponent: () => import('./features/roles/role-form/role-form.component').then(m => m.RoleFormComponent) },
    ],
  },
  {
    path: 'users',
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'users.view_users' },
    children: [
      { path: '', loadComponent: () => import('./features/users/user-list/user-list.component').then(m => m.UserListComponent) },
      { path: 'new', loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent) },
      { path: ':id/edit', loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent) },
    ],
  },
  {
    path: 'tasks',
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'tasks.view' },
    children: [
      { path: '', loadComponent: () => import('./features/tasks/pages/task-list/task-list.component').then(m => m.TaskListComponent) },
      { path: 'new', loadComponent: () => import('./features/tasks/pages/task-form/task-form.component').then(m => m.TaskFormComponent) },
      { path: ':id/edit', loadComponent: () => import('./features/tasks/pages/task-form/task-form.component').then(m => m.TaskFormComponent) },
    ],
  },
  {
    path: 'audit-log',
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'audit.view' },
    loadComponent: () => import('./features/audit-log/audit-log-list/audit-log-list.component').then(m => m.AuditLogListComponent),
  },
  {
    path: 'documentation',
    canActivate: [authGuard, superOrgGuard],
    loadComponent: () => import('./features/documentation/documentation.component').then(m => m.DocumentationComponent),
  },
  { path: '**', redirectTo: '' },
];
