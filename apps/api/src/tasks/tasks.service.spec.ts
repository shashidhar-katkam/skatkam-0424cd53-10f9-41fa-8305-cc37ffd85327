import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TasksService } from './tasks.service';
import { Task } from '../entities/task.entity';
import { AuditService } from '../audit/audit.service';
import { AppLoggerService } from '../shared/logger/logger.service';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepo: Repository<Task>;
  const mockUser: { userId: string; email: string; organizationId: string; role: string } = {
    userId: 'u1',
    email: 'u@test.com',
    organizationId: 'org1',
    role: 'admin',
  };

  const mockTaskRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ next: 0 }),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };
  const mockAuditService = { log: jest.fn().mockResolvedValue(undefined) };
  const mockLogger = {
    setContext: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: mockTaskRepo },
        { provide: AuditService, useValue: mockAuditService },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    }).compile();
    service = module.get<TasksService>(TasksService);
    taskRepo = module.get(getRepositoryToken(Task));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a task', async () => {
      const created = {
        id: 't1',
        title: 'Test',
        status: 'todo',
        organizationId: 'org1',
        createdById: 'u1',
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Task;
      mockTaskRepo.create.mockReturnValue(created);
      mockTaskRepo.save.mockResolvedValue(created);

      const result = await service.create(
        { title: 'Test', status: 'todo' as any },
        mockUser
      );

      expect(result).toHaveProperty('id', 't1');
      expect(result).toHaveProperty('title', 'Test');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREATE',
          resource: 'task',
          resourceId: 't1',
        })
      );
    });
  });

  describe('findAll', () => {
    it('should return tasks for org', async () => {
      const tasks = [
        {
          id: 't1',
          title: 'Task 1',
          status: 'todo',
          organizationId: 'org1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as Task[];
      mockTaskRepo.createQueryBuilder = jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(tasks),
      }));

      const result = await service.findAll(mockUser);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('title', 'Task 1');
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when task not found', async () => {
      mockTaskRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing', mockUser)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should return task when found', async () => {
      const task = {
        id: 't1',
        title: 'Task',
        organizationId: 'org1',
        createdBy: { id: 'u1', name: 'User', email: 'u@t.com' },
        assignee: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
      mockTaskRepo.findOne.mockResolvedValue(task);

      const result = await service.findOne('t1', mockUser);

      expect(result).toHaveProperty('title', 'Task');
      expect(result).toHaveProperty('createdBy');
    });
  });

  describe('update', () => {
    it('should throw NotFoundException when task not found', async () => {
      mockTaskRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('missing', { title: 'New' }, mockUser)
      ).rejects.toThrow(NotFoundException);
    });

    it('should update and return task', async () => {
      const task = {
        id: 't1',
        title: 'Old',
        organizationId: 'org1',
        status: 'todo',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Task;
      mockTaskRepo.findOne
        .mockResolvedValueOnce(task)
        .mockResolvedValueOnce({ ...task, title: 'New' });
      mockTaskRepo.save.mockResolvedValue({ ...task, title: 'New' });
      mockTaskRepo.find.mockResolvedValue([{ ...task, order: 0 }]);

      const result = await service.update('t1', { title: 'New' }, mockUser);

      expect(result.title).toBe('New');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE' })
      );
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException when task not found', async () => {
      mockTaskRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('missing', mockUser)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should remove task and log audit', async () => {
      const task = { id: 't1', organizationId: 'org1' } as Task;
      mockTaskRepo.findOne.mockResolvedValue(task);
      mockTaskRepo.remove.mockResolvedValue(undefined);

      const result = await service.remove('t1', mockUser);

      expect(result).toEqual({ deleted: true });
      expect(mockTaskRepo.remove).toHaveBeenCalledWith(task);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DELETE', resourceId: 't1' })
      );
    });
  });
});
