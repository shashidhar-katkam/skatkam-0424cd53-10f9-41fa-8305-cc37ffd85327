export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskUserRef {
  id: string;
  name: string | null;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  category?: TaskCategory;
  organizationId: string;
  createdById: string;
  order?: number;
  priority?: TaskPriority | null;
  dueDate?: string | null;
  assigneeId?: string | null;
  issueKey?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDetail extends Task {
  createdBy?: TaskUserRef | null;
  assignee?: TaskUserRef | null;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskCategory = 'Work' | 'Personal' | 'Other';

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
  issueKey?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  category?: TaskCategory;
  order?: number;
  priority?: TaskPriority | null;
  dueDate?: string | null;
  assigneeId?: string | null;
  issueKey?: string | null;
}

export interface TaskListParams {
  sortBy?: 'title' | 'status' | 'category' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  status?: TaskStatus;
  category?: TaskCategory;
}
