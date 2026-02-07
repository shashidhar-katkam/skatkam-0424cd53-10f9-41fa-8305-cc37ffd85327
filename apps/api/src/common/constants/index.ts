/** Pagination limits */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/** Task status values */
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
} as const;

/** Task category values */
export const TASK_CATEGORY = {
  WORK: 'Work',
  PERSONAL: 'Personal',
  OTHER: 'Other',
} as const;

/** Task priority values */
export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

/** System role slugs */
export const ROLE_SLUG = {
  OWNER: 'owner',
  ADMIN: 'admin',
  VIEWER: 'viewer',
} as const;

/** Audit log actions */
export const AUDIT_ACTION = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
} as const;

/** Audit log resource types */
export const AUDIT_RESOURCE = {
  TASK: 'task',
  USER: 'user',
  ROLE: 'role',
  ORGANIZATION: 'organization',
} as const;

/** Permission wildcards */
export const PERMISSION_WILDCARD = {
  ALL: '*',
  ALL_ALT: 'all',
} as const;

/** Seed / default values */
export const SEED = {
  DEFAULT_ORG_NAME: 'Default Organization',
  ADMIN_EMAIL: 'admin@example.com',
  ADMIN_PASSWORD: 'admin123',
  ADMIN_NAME: 'Admin User',
} as const;
