import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { toDateString } from '../common/utils';

export interface TaskResponse {
  id: string;
  title: string;
  description: string | null;
  status: string;
  category: string | null;
  organizationId: string;
  createdById: string;
  order: number;
  priority: string | null;
  dueDate: string | null;
  assigneeId: string | null;
  issueKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskResponseDetail extends TaskResponse {
  createdBy: { id: string; name: string; email: string } | null;
  assignee: { id: string; name: string; email: string } | null;
}

export function toTaskResponse(task: Task): TaskResponse {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    category: task.category,
    organizationId: task.organizationId,
    createdById: task.createdById,
    order: task.order,
    priority: task.priority,
    dueDate: toDateString(task.dueDate),
    assigneeId: task.assigneeId,
    issueKey: task.issueKey,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export function toTaskResponseDetail(
  task: Task & { createdBy?: User; assignee?: User | null }
): TaskResponseDetail {
  const base = toTaskResponse(task);
  return {
    ...base,
    createdBy: task.createdBy
      ? { id: task.createdBy.id, name: task.createdBy.name ?? '', email: task.createdBy.email }
      : null,
    assignee: task.assignee
      ? { id: task.assignee.id, name: task.assignee.name ?? '', email: task.assignee.email }
      : null,
  };
}
