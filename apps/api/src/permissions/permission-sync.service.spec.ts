import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PermissionSyncService } from './permission-sync.service';
import { PermissionModule as PermissionModuleEntity } from '../entities/permission-module.entity';
import { PermissionFeature } from '../entities/permission-feature.entity';
import { Role } from '../entities/role.entity';
import { AppLoggerService } from '../shared/logger/logger.service';

describe('PermissionSyncService', () => {
  let service: PermissionSyncService;

  const mockModuleRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };
  const mockFeatureRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };
  const mockRoleRepo = {
    find: jest.fn(),
    update: jest.fn(),
  };
  const mockLogger = {
    setContext: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionSyncService,
        {
          provide: getRepositoryToken(PermissionModuleEntity),
          useValue: mockModuleRepo,
        },
        {
          provide: getRepositoryToken(PermissionFeature),
          useValue: mockFeatureRepo,
        },
        { provide: getRepositoryToken(Role), useValue: mockRoleRepo },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    }).compile();
    service = module.get<PermissionSyncService>(PermissionSyncService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStructure', () => {
    it('should return permission structure from DB', async () => {
      mockModuleRepo.find.mockResolvedValue([
        {
          moduleId: 'tasks',
          moduleName: 'Tasks',
          description: null,
          sortOrder: 0,
          features: [
            {
              moduleId: 'tasks',
              featureId: 'view',
              featureName: 'View',
              description: null,
              defaultEnabled: true,
            },
          ],
        },
      ]);

      const result = await service.getStructure();

      expect(result).toHaveLength(1);
      expect(result[0].moduleId).toBe('tasks');
      expect(result[0].features).toHaveLength(1);
      expect(result[0].features[0].permissionKey).toBe('tasks.view');
    });

    it('should handle modules with no features', async () => {
      mockModuleRepo.find.mockResolvedValue([
        {
          moduleId: 'tasks',
          moduleName: 'Tasks',
          description: null,
          sortOrder: 0,
          features: [],
        },
      ]);

      const result = await service.getStructure();

      expect(result[0].features).toEqual([]);
    });
  });

  describe('syncPermissions', () => {
    beforeEach(() => {
      mockModuleRepo.findOne.mockResolvedValue(null);
      mockModuleRepo.create.mockImplementation((o: object) => o);
      mockModuleRepo.save.mockResolvedValue({});
      mockModuleRepo.count.mockResolvedValue(5);
      mockFeatureRepo.findOne.mockResolvedValue(null);
      mockFeatureRepo.create.mockImplementation((o: object) => o);
      mockFeatureRepo.save.mockResolvedValue({});
      mockRoleRepo.find.mockResolvedValue([{ id: 'r1', slug: 'admin' }]);
      mockRoleRepo.update.mockResolvedValue({});
    });

    it('should sync modules and features from permission files', async () => {
      mockModuleRepo.count.mockResolvedValue(3);
      mockFeatureRepo.count.mockResolvedValue(12);

      const result = await service.syncPermissions();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Permissions synced successfully');
      expect(result.version).toBeDefined();
      expect(result.stats).toMatchObject({
        totalModules: 3,
        totalFeatures: 12,
      });
      expect(mockModuleRepo.save).toHaveBeenCalled();
      expect(mockFeatureRepo.save).toHaveBeenCalled();
    });

    it('should update existing modules and features', async () => {
      let findOneCalls = 0;
      mockModuleRepo.findOne.mockImplementation(async (opts: { where: object }) => {
        findOneCalls++;
        const where = opts?.where as Record<string, string>;
        if (where?.moduleId) {
          if (where.moduleId === 'tasks' && !where.featureId) {
            return { moduleId: 'tasks', moduleName: 'Old', description: null, sortOrder: 0 };
          }
          if (where.moduleId === 'tasks' && where.featureId === 'view') {
            return { moduleId: 'tasks', featureId: 'view', featureName: 'Old', description: null, defaultEnabled: false };
          }
        }
        return null;
      });

      const result = await service.syncPermissions();

      expect(result.stats.modulesUpdated).toBeGreaterThanOrEqual(1);
      expect(mockModuleRepo.save).toHaveBeenCalled();
    });

    it('should sync system role permissions', async () => {
      await service.syncPermissions();

      expect(mockRoleRepo.find).toHaveBeenCalled();
      expect(mockRoleRepo.update).toHaveBeenCalled();
    });
  });
});
