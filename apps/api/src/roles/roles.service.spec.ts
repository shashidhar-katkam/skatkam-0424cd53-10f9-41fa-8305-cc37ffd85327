import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { Role } from '../entities/role.entity';
import { AppLoggerService } from '../shared/logger/logger.service';

describe('RolesService', () => {
  let service: RolesService;

  const mockRoleRepo = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const mockLogger = {
    setContext: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: getRepositoryToken(Role), useValue: mockRoleRepo },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    }).compile();
    service = module.get<RolesService>(RolesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated roles', async () => {
      mockRoleRepo.findAndCount.mockResolvedValue([
        [{ id: 'r1', name: 'Admin', slug: 'admin' }],
        1,
      ]);

      const result = await service.findAll(1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when role not found', async () => {
      mockRoleRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });

    it('should return role when found', async () => {
      mockRoleRepo.findOne.mockResolvedValue({
        id: 'r1',
        name: 'Admin',
        slug: 'admin',
      });

      const result = await service.findOne('r1');

      expect(result.slug).toBe('admin');
    });
  });

  describe('create', () => {
    it('should throw ConflictException when slug exists', async () => {
      mockRoleRepo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({ name: 'Role', slug: 'admin' })
      ).rejects.toThrow(ConflictException);
    });

    it('should create role with normalized slug', async () => {
      mockRoleRepo.findOne.mockResolvedValue(null);
      mockRoleRepo.create.mockReturnValue({
        name: 'Test Role',
        slug: 'test_role',
        permissions: {},
      });
      mockRoleRepo.save.mockResolvedValue({
        id: 'r1',
        name: 'Test Role',
        slug: 'test_role',
      });

      const result = await service.create({
        name: 'Test Role',
        slug: 'Test Role',
        permissions: { 'tasks.view': true },
      });

      expect(result.slug).toBe('test_role');
      expect(mockRoleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'test_role',
          permissions: { 'tasks.view': true },
        })
      );
    });
  });

  describe('update', () => {
    it('should throw NotFoundException when role not found', async () => {
      mockRoleRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('missing', { name: 'New' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should update role', async () => {
      mockRoleRepo.findOne.mockResolvedValue({
        id: 'r1',
        name: 'Old',
        slug: 'admin',
      });
      mockRoleRepo.save.mockResolvedValue({
        id: 'r1',
        name: 'Updated',
        slug: 'admin',
      });

      const result = await service.update('r1', { name: 'Updated' });

      expect(result.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException when role not found', async () => {
      mockRoleRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });

    it('should remove role', async () => {
      mockRoleRepo.findOne.mockResolvedValue({ id: 'r1' });

      const result = await service.remove('r1');

      expect(result).toEqual({ deleted: true });
      expect(mockRoleRepo.remove).toHaveBeenCalled();
    });
  });
});
