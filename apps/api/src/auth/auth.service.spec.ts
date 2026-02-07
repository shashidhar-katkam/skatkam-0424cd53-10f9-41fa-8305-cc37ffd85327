import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { OrganizationMember } from '../entities/organization-member.entity';
import { PermissionFeature } from '../entities/permission-feature.entity';
import { RoleBootstrapService } from './role-bootstrap.service';
import { AppLoggerService } from '../shared/logger/logger.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('hashed'),
}));

describe('AuthService', () => {
  let service: AuthService;
  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockOrgRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const mockMemberRepo = { create: jest.fn(), save: jest.fn() };
  const mockFeatureRepo = {
    find: jest.fn().mockResolvedValue([
      { moduleId: 'tasks', featureId: 'view' },
      { moduleId: 'tasks', featureId: 'create' },
    ]),
  };
  const mockJwtService = { sign: jest.fn().mockReturnValue('fake-token') };
  const mockRoleBootstrapService = {
    ensureDefaultRoles: jest.fn().mockResolvedValue({
      id: 'role-1',
      slug: 'owner',
      name: 'Owner',
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
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Organization), useValue: mockOrgRepo },
        { provide: getRepositoryToken(OrganizationMember), useValue: mockMemberRepo },
        { provide: getRepositoryToken(PermissionFeature), useValue: mockFeatureRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RoleBootstrapService, useValue: mockRoleBootstrapService },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException when user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(
        service.login({ email: 'x@y.com', password: 'pass' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password invalid', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'u1',
        email: 'x@y.com',
        passwordHash: 'hash',
        organizationId: 'org1',
        organization: { name: 'Org', isSuper: false },
        role: { slug: 'viewer', permissions: { 'tasks.view': true } },
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'x@y.com', password: 'wrong' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return accessToken and user on successful login', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'u1',
        email: 'x@y.com',
        name: 'User',
        passwordHash: 'hash',
        organizationId: 'org1',
        organization: { name: 'Org', isSuper: false },
        role: { slug: 'viewer', permissions: { 'tasks.view': true } },
      });

      const result = await service.login({ email: 'x@y.com', password: 'pass' });

      expect(result).toHaveProperty('accessToken', 'fake-token');
      expect(result).toHaveProperty('user');
      expect(result.user).toMatchObject({
        id: 'u1',
        email: 'x@y.com',
        name: 'User',
        organizationId: 'org1',
        organizationName: 'Org',
        role: 'viewer',
      });
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'x@y.com' },
        relations: ['role', 'organization'],
      });
    });
  });

  describe('me', () => {
    it('should throw UnauthorizedException when user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(service.me('missing-id')).rejects.toThrow(UnauthorizedException);
    });

    it('should return user with permissions', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'u1',
        email: 'x@y.com',
        name: 'User',
        organizationId: 'org1',
        roleId: 'r1',
        organization: { name: 'Org', isSuper: true },
        role: { slug: 'admin', name: 'Admin', permissions: { 'tasks.view': true } },
      });

      const result = await service.me('u1');

      expect(result.user).toMatchObject({
        id: 'u1',
        email: 'x@y.com',
        role: 'admin',
        canAccessSwagger: true,
      });
    });
  });

  describe('register', () => {
    it('should throw ConflictException when email already exists', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({
          email: 'existing@test.com',
          password: 'pass',
          organizationName: 'New Org',
        })
      ).rejects.toThrow(ConflictException);
    });

    it('should create org and user on successful registration', async () => {
      mockUserRepo.findOne
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce({
          id: 'u1',
          email: 'new@test.com',
          organizationId: 'org1',
          role: { slug: 'owner', permissions: { 'tasks.view': true } },
        }); // findOne after save for withRole
      mockUserRepo.create.mockReturnValue({
        email: 'new@test.com',
        organizationId: 'org1',
        roleId: 'role-1',
      });
      mockUserRepo.save
        .mockResolvedValueOnce({ id: 'u1', email: 'new@test.com', organizationId: 'org1' }); // user save
      mockOrgRepo.findOne.mockResolvedValue(null);
      mockOrgRepo.create.mockReturnValue({ name: 'New Org', parentId: null });
      mockOrgRepo.save.mockResolvedValue({ id: 'org1', name: 'New Org' });
      mockMemberRepo.create.mockReturnValue({});
      mockMemberRepo.save.mockResolvedValue({});

      const result = await service.register({
        email: 'new@test.com',
        password: 'pass123',
        organizationName: 'New Org',
        name: 'New User',
      });

      expect(result.accessToken).toBe('fake-token');
      expect(result.user.role).toBe('owner');
      expect(mockRoleBootstrapService.ensureDefaultRoles).toHaveBeenCalled();
      expect(mockOrgRepo.save).toHaveBeenCalled();
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'new@test.com' },
      });
    });
  });
});
