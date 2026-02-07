import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Organization } from '../entities/organization.entity';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { RoleBootstrapService } from '../auth/role-bootstrap.service';
import { AppLoggerService } from '../shared/logger/logger.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
}));

describe('SeedService', () => {
  let service: SeedService;

  const mockOrgRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const mockRoleRepo = { findOne: jest.fn() };
  const mockUserRepo = {
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockRoleBootstrapService = {
    ensureDefaultRoles: jest.fn().mockResolvedValue({
      id: 'role-owner',
      slug: 'owner',
    }),
  };
  const mockLogger = {
    setContext: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        { provide: getRepositoryToken(Organization), useValue: mockOrgRepo },
        { provide: getRepositoryToken(Role), useValue: mockRoleRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: RoleBootstrapService, useValue: mockRoleBootstrapService },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    }).compile();
    service = module.get<SeedService>(SeedService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should skip seed when users already exist', async () => {
      mockOrgRepo.findOne.mockResolvedValue({ isSuper: true });
      mockUserRepo.count.mockResolvedValue(5);

      await service.onModuleInit();

      expect(mockUserRepo.create).not.toHaveBeenCalled();
    });

    it('should create default org and admin user when no users exist', async () => {
      mockOrgRepo.findOne.mockResolvedValue(null);
      mockOrgRepo.find.mockResolvedValue([]);
      mockUserRepo.count.mockResolvedValue(0);
      mockOrgRepo.create.mockReturnValue({ name: 'Default Organization', isSuper: true });
      mockOrgRepo.save.mockResolvedValue({ id: 'org1', name: 'Default Organization' });
      mockRoleRepo.findOne.mockResolvedValue({ id: 'admin-role', slug: 'admin' });
      mockUserRepo.create.mockReturnValue({
        email: 'admin@example.com',
        organizationId: 'org1',
        roleId: 'admin-role',
      });
      mockUserRepo.save.mockResolvedValue({ id: 'u1' });

      await service.onModuleInit();

      expect(mockRoleBootstrapService.ensureDefaultRoles).toHaveBeenCalled();
      expect(mockOrgRepo.save).toHaveBeenCalled();
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('admin123', 10);
    });
  });
});
