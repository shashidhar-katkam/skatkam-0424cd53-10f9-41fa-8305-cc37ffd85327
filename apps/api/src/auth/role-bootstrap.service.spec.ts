import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RoleBootstrapService } from './role-bootstrap.service';
import { Role } from '../entities/role.entity';
import { PermissionFeature } from '../entities/permission-feature.entity';
import { PermissionSyncService } from '../permissions/permission-sync.service';
import { AppLoggerService } from '../shared/logger/logger.service';

describe('RoleBootstrapService', () => {
  let service: RoleBootstrapService;

  const mockRoleRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockFeatureRepo = {
    find: jest.fn().mockResolvedValue([
      { moduleId: 'tasks', featureId: 'view' },
      { moduleId: 'tasks', featureId: 'create' },
    ]),
  };
  const mockPermissionSyncService = {
    syncPermissions: jest.fn().mockResolvedValue({ success: true }),
  };
  const mockLogger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleBootstrapService,
        { provide: getRepositoryToken(Role), useValue: mockRoleRepo },
        { provide: getRepositoryToken(PermissionFeature), useValue: mockFeatureRepo },
        { provide: PermissionSyncService, useValue: mockPermissionSyncService },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    }).compile();
    service = module.get<RoleBootstrapService>(RoleBootstrapService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ensureDefaultRoles', () => {
    it('should return existing owner role', async () => {
      const owner = { id: 'r1', slug: 'owner', name: 'Owner' };
      mockRoleRepo.findOne.mockResolvedValue(owner);

      const result = await service.ensureDefaultRoles();

      expect(result).toBe(owner);
      expect(mockRoleRepo.create).not.toHaveBeenCalled();
    });

    it('should create Owner, Admin, Viewer when none exist', async () => {
      mockRoleRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'owner-id', slug: 'owner' });

      mockRoleRepo.create.mockImplementation((entity) => entity);
      mockRoleRepo.save.mockResolvedValue({ id: 'saved', slug: 'owner' });

      const result = await service.ensureDefaultRoles();

      expect(mockPermissionSyncService.syncPermissions).toHaveBeenCalled();
      expect(mockRoleRepo.create).toHaveBeenCalledTimes(3);
      expect(result.slug).toBe('owner');
    });
  });
});
