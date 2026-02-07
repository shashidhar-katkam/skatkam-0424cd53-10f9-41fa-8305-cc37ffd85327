import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsController } from './permissions.controller';
import { PermissionSyncService } from './permission-sync.service';
import { PermissionGuard } from '../auth/guards/permission.guard';

describe('PermissionsController', () => {
  let controller: PermissionsController;
  const mockPermissionSyncService = {
    getStructure: jest.fn(),
    syncPermissions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionsController],
      providers: [
        {
          provide: PermissionSyncService,
          useValue: mockPermissionSyncService,
        },
      ],
    })
      .overrideGuard(PermissionGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = module.get<PermissionsController>(PermissionsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getStructure should call permissionSyncService.getStructure', async () => {
    mockPermissionSyncService.getStructure.mockResolvedValue([]);
    await controller.getStructure();
    expect(mockPermissionSyncService.getStructure).toHaveBeenCalled();
  });

  it('sync should call permissionSyncService.syncPermissions', async () => {
    mockPermissionSyncService.syncPermissions.mockResolvedValue({
      success: true,
      message: 'Synced',
    });
    await controller.sync();
    expect(mockPermissionSyncService.syncPermissions).toHaveBeenCalled();
  });
});
