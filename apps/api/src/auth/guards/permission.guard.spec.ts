import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionGuard } from './permission.guard';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { AppLoggerService } from '../../shared/logger/logger.service';
import { PERMISSION_KEY } from '../../shared/decorators/require-permission.decorator';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: Reflector;
  let userRepo: Repository<User>;
  let logger: AppLoggerService;

  const mockExecutionContext = (user?: { userId: string }): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(async () => {
    const mockUserRepo = {
      findOne: jest.fn(),
    };
    const mockLogger = {
      setContext: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        Reflector,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    }).compile();

    guard = module.get<PermissionGuard>(PermissionGuard);
    reflector = module.get<Reflector>(Reflector);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    logger = module.get<AppLoggerService>(AppLoggerService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true when no permission required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const result = await guard.canActivate(mockExecutionContext());

    expect(result).toBe(true);
    expect(userRepo.findOne).not.toHaveBeenCalled();
  });

  it('should throw when user not authenticated', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('tasks.view');

    await expect(
      guard.canActivate(mockExecutionContext())
    ).rejects.toThrow(ForbiddenException);
    await expect(
      guard.canActivate(mockExecutionContext())
    ).rejects.toThrow('User not authenticated');

    await expect(
      guard.canActivate(mockExecutionContext({ userId: '' }))
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw when user not found', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('tasks.view');
    (userRepo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      guard.canActivate(mockExecutionContext({ userId: 'u1' }))
    ).rejects.toThrow(ForbiddenException);
    await expect(
      guard.canActivate(mockExecutionContext({ userId: 'u1' }))
    ).rejects.toThrow('No role assigned');
  });

  it('should throw when no role assigned', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('tasks.view');
    (userRepo.findOne as jest.Mock).mockResolvedValue({
      id: 'u1',
      role: null,
    });

    await expect(
      guard.canActivate(mockExecutionContext({ userId: 'u1' }))
    ).rejects.toThrow(ForbiddenException);
    await expect(
      guard.canActivate(mockExecutionContext({ userId: 'u1' }))
    ).rejects.toThrow('No role assigned');
  });

  it('should throw when role is inactive', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('tasks.view');
    (userRepo.findOne as jest.Mock).mockResolvedValue({
      id: 'u1',
      role: {
        id: 'r1',
        slug: 'viewer',
        isActive: false,
        permissions: { 'tasks.view': true },
      } as Role,
    });

    await expect(
      guard.canActivate(mockExecutionContext({ userId: 'u1' }))
    ).rejects.toThrow(ForbiddenException);
    await expect(
      guard.canActivate(mockExecutionContext({ userId: 'u1' }))
    ).rejects.toThrow('Role is inactive');
  });

  it('should grant access when user has required permission', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('tasks.view');
    (userRepo.findOne as jest.Mock).mockResolvedValue({
      id: 'u1',
      role: {
        id: 'r1',
        slug: 'viewer',
        isActive: true,
        permissions: { 'tasks.view': true },
      } as Role,
    });

    const result = await guard.canActivate(mockExecutionContext({ userId: 'u1' }));

    expect(result).toBe(true);
    expect(userRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'u1' },
      relations: ['role'],
    });
  });

  it('should grant access when user is admin', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('roles.create_roles');
    (userRepo.findOne as jest.Mock).mockResolvedValue({
      id: 'u1',
      role: {
        id: 'r1',
        slug: 'admin',
        isActive: true,
        permissions: {},
      } as Role,
    });

    const result = await guard.canActivate(mockExecutionContext({ userId: 'u1' }));

    expect(result).toBe(true);
  });

  it('should grant access when user is owner', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('users.delete_users');
    (userRepo.findOne as jest.Mock).mockResolvedValue({
      id: 'u1',
      role: {
        id: 'r1',
        slug: 'owner',
        isActive: true,
        permissions: {},
      } as Role,
    });

    const result = await guard.canActivate(mockExecutionContext({ userId: 'u1' }));

    expect(result).toBe(true);
  });

  it('should throw when user lacks permission', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('roles.create_roles');
    (userRepo.findOne as jest.Mock).mockResolvedValue({
      id: 'u1',
      role: {
        id: 'r1',
        slug: 'viewer',
        isActive: true,
        permissions: { 'tasks.view': true },
      } as Role,
    });

    await expect(
      guard.canActivate(mockExecutionContext({ userId: 'u1' }))
    ).rejects.toThrow(ForbiddenException);
    await expect(
      guard.canActivate(mockExecutionContext({ userId: 'u1' }))
    ).rejects.toThrow('Insufficient permissions');
  });

  it('should parse permissions when string (JSON)', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('tasks.view');
    (userRepo.findOne as jest.Mock).mockResolvedValue({
      id: 'u1',
      role: {
        id: 'r1',
        slug: 'viewer',
        isActive: true,
        permissions: '{"tasks.view":true}' as unknown as Record<string, boolean>,
      } as Role,
    });

    const result = await guard.canActivate(mockExecutionContext({ userId: 'u1' }));

    expect(result).toBe(true);
  });

  it('should use empty permissions when string parse fails', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('tasks.view');
    (userRepo.findOne as jest.Mock).mockResolvedValue({
      id: 'u1',
      role: {
        id: 'r1',
        slug: 'viewer',
        isActive: true,
        permissions: 'invalid json' as unknown as Record<string, boolean>,
      } as Role,
    });

    await expect(
      guard.canActivate(mockExecutionContext({ userId: 'u1' }))
    ).rejects.toThrow(ForbiddenException);
  });
});
