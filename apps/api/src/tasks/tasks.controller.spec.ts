import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { AppLoggerService } from '../shared/logger/logger.service';
import { PermissionGuard } from '../auth/guards/permission.guard';

describe('TasksController', () => {
  let controller: TasksController;
  const mockUser = {
    userId: 'u1',
    email: 'u@t.com',
    organizationId: 'org1',
    role: 'admin',
  };
  const mockTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const mockLogger = {
    setContext: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        { provide: TasksService, useValue: mockTasksService },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    })
      .overrideGuard(PermissionGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = module.get<TasksController>(TasksController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create should call tasksService.create', async () => {
    mockTasksService.create.mockResolvedValue({ id: 't1', title: 'Task' });
    await controller.create({ title: 'Task' } as any, mockUser);
    expect(mockTasksService.create).toHaveBeenCalled();
  });

  it('findAll should call tasksService.findAll', async () => {
    mockTasksService.findAll.mockResolvedValue([]);
    await controller.findAll(mockUser);
    expect(mockTasksService.findAll).toHaveBeenCalled();
  });

  it('findOne should call tasksService.findOne', async () => {
    mockTasksService.findOne.mockResolvedValue({ id: 't1' });
    await controller.findOne('t1', mockUser);
    expect(mockTasksService.findOne).toHaveBeenCalledWith('t1', mockUser);
  });

  it('update should call tasksService.update', async () => {
    mockTasksService.update.mockResolvedValue({ id: 't1' });
    await controller.update('t1', { title: 'Updated' } as any, mockUser);
    expect(mockTasksService.update).toHaveBeenCalled();
  });

  it('remove should call tasksService.remove', async () => {
    mockTasksService.remove.mockResolvedValue({ deleted: true });
    await controller.remove('t1', mockUser);
    expect(mockTasksService.remove).toHaveBeenCalledWith('t1', mockUser);
  });
});
