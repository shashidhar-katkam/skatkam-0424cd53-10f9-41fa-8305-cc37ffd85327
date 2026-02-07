import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { AppLoggerService } from '../shared/logger/logger.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
}));

describe('UsersService', () => {
  let service: UsersService;
  const mockUser: { userId: string; email: string; organizationId: string; role: string } = {
    userId: 'u1',
    email: 'admin@test.com',
    organizationId: 'org1',
    role: 'admin',
  };

  const mockUserRepo = {
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
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      mockUserRepo.findAndCount.mockResolvedValue([
        [
          {
            id: 'u1',
            email: 'u@test.com',
            name: 'User',
            organizationId: 'org1',
            roleId: 'r1',
            role: { id: 'r1', name: 'Admin', slug: 'admin' },
          },
        ],
        1,
      ]);

      const result = await service.findAll(mockUser, 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0]).toHaveProperty('email', 'u@test.com');
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing', mockUser)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should return user when found', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'u1',
        email: 'u@test.com',
        name: 'User',
        organizationId: 'org1',
        roleId: 'r1',
        role: { id: 'r1', name: 'Admin', slug: 'admin' },
      });

      const result = await service.findOne('u1', mockUser);

      expect(result.email).toBe('u@test.com');
      expect(result.role.slug).toBe('admin');
    });
  });

  describe('create', () => {
    it('should throw ForbiddenException when creating in another org', async () => {
      await expect(
        service.create(
          {
            email: 'new@test.com',
            password: 'pass',
            organizationId: 'other-org',
          },
          mockUser
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when email exists', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create(
          { email: 'existing@test.com', password: 'pass' },
          mockUser
        )
      ).rejects.toThrow(ConflictException);
    });

    it('should create user', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockReturnValue({
        email: 'new@test.com',
        organizationId: 'org1',
        roleId: 'r1',
      });
      mockUserRepo.save.mockResolvedValue({ id: 'u2', email: 'new@test.com' });
      mockUserRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
        id: 'u2',
        email: 'new@test.com',
        name: 'New',
        organizationId: 'org1',
        roleId: 'r1',
        role: { id: 'r1', name: 'Viewer', slug: 'viewer' },
      });

      const result = await service.create(
        { email: 'new@test.com', password: 'pass', name: 'New' },
        mockUser
      );

      expect(result.email).toBe('new@test.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('pass', 10);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException when user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('missing', { name: 'New' }, mockUser)
      ).rejects.toThrow(NotFoundException);
    });

    it('should update user', async () => {
      const user = {
        id: 'u1',
        email: 'u@test.com',
        name: 'Old',
        organizationId: 'org1',
        roleId: 'r1',
        role: { id: 'r1', name: 'Admin', slug: 'admin' },
      };
      mockUserRepo.findOne.mockResolvedValue(user);
      mockUserRepo.save.mockResolvedValue({ ...user, name: 'New' });

      const result = await service.update('u1', { name: 'New' }, mockUser);

      expect(result.name).toBe('New');
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException when user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('missing', mockUser)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException when deleting self', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'u1',
        organizationId: 'org1',
      });

      await expect(service.remove('u1', mockUser)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should remove user', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'u2',
        organizationId: 'org1',
      });

      const result = await service.remove('u2', mockUser);

      expect(result).toEqual({ deleted: true });
      expect(mockUserRepo.remove).toHaveBeenCalled();
    });
  });
});
