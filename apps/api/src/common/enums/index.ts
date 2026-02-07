/** Task status enum */
export enum TaskStatus {
  Todo = 'todo',
  InProgress = 'in_progress',
  Done = 'done',
}

/** Task category enum */
export enum TaskCategory {
  Work = 'Work',
  Personal = 'Personal',
  Other = 'Other',
}

/** Task priority enum */
export enum TaskPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

/** System role slug enum */
export enum RoleSlug {
  Owner = 'owner',
  Admin = 'admin',
  Viewer = 'viewer',
}

/** Audit action enum */
export enum AuditAction {
  Create = 'CREATE',
  Update = 'UPDATE',
  Delete = 'DELETE',
}

/** Audit resource enum */
export enum AuditResource {
  Task = 'task',
  User = 'user',
  Role = 'role',
  Organization = 'organization',
}
