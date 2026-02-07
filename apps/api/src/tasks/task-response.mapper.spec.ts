import { toTaskResponse, toTaskResponseDetail } from './task-response.mapper';

describe('task-response.mapper', () => {
  const baseTask = {
    id: 't1',
    title: 'Task',
    description: 'Desc',
    status: 'todo',
    category: 'Work',
    organizationId: 'org1',
    createdById: 'u1',
    order: 0,
    priority: 'high',
    dueDate: new Date('2024-06-15'),
    assigneeId: null,
    issueKey: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  };

  describe('toTaskResponse', () => {
    it('should map task to response shape', () => {
      const result = toTaskResponse(baseTask as any);

      expect(result).toMatchObject({
        id: 't1',
        title: 'Task',
        description: 'Desc',
        status: 'todo',
        category: 'Work',
        order: 0,
        priority: 'high',
        dueDate: '2024-06-15',
      });
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should return null dueDate for null', () => {
      const task = { ...baseTask, dueDate: null } as any;
      const result = toTaskResponse(task);
      expect(result.dueDate).toBeNull();
    });
  });

  describe('toTaskResponseDetail', () => {
    it('should include createdBy and assignee', () => {
      const task = {
        ...baseTask,
        createdBy: { id: 'u1', name: 'Creator', email: 'c@t.com' },
        assignee: { id: 'u2', name: 'Assignee', email: 'a@t.com' },
      } as any;

      const result = toTaskResponseDetail(task);

      expect(result.createdBy).toEqual({
        id: 'u1',
        name: 'Creator',
        email: 'c@t.com',
      });
      expect(result.assignee).toEqual({
        id: 'u2',
        name: 'Assignee',
        email: 'a@t.com',
      });
    });

    it('should handle null createdBy and assignee', () => {
      const task = { ...baseTask, createdBy: undefined, assignee: null } as any;

      const result = toTaskResponseDetail(task);

      expect(result.createdBy).toBeNull();
      expect(result.assignee).toBeNull();
    });
  });
});
