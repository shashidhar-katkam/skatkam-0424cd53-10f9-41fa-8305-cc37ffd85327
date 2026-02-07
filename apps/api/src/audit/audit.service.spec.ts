import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from '../entities/audit-log.entity';
import { AppLoggerService } from '../shared/logger/logger.service';

describe('AuditService', () => {
  let service: AuditService;

  const mockAuditRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
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
        AuditService,
        { provide: getRepositoryToken(AuditLog), useValue: mockAuditRepo },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    }).compile();
    service = module.get<AuditService>(AuditService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create and save audit entry', async () => {
      mockAuditRepo.create.mockReturnValue({
        accountId: 'u1',
        action: 'CREATE',
        resource: 'task',
      });
      mockAuditRepo.save.mockResolvedValue(undefined);

      await service.log({
        accountId: 'u1',
        organizationId: 'org1',
        action: 'CREATE',
        resource: 'task',
        resourceId: 't1',
      });

      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'u1',
          action: 'CREATE',
          resource: 'task',
          resourceId: 't1',
        })
      );
      expect(mockAuditRepo.save).toHaveBeenCalled();
    });
  });

  describe('findForOrg', () => {
    it('should return paginated audit logs', async () => {
      const logs = [
        {
          id: 'a1',
          organizationId: 'org1',
          action: 'CREATE',
          resource: 'task',
          timestamp: new Date(),
        },
      ];
      mockAuditRepo.findAndCount.mockResolvedValue([logs, 1]);

      const result = await service.findForOrg('org1', 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockAuditRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org1' },
          order: { timestamp: 'DESC' },
        })
      );
    });
  });
});
