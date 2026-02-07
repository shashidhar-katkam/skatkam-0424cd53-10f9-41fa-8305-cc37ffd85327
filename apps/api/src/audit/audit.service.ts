import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { AppLoggerService } from '../shared/logger/logger.service';
import { getPaginationParams } from '../common/utils';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
    private logger: AppLoggerService
  ) {
    this.logger.setContext('AuditService');
  }

  async log(params: {
    accountId?: string;
    organizationId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const entry = this.auditRepo.create({
      accountId: params.accountId,
      organizationId: params.organizationId,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      details: params.details ?? null,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    });
    await this.auditRepo.save(entry);
    this.logger.debug('Audit log written', {
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      accountId: params.accountId,
    });
  }

  async findForOrg(organizationId: string, page = 1, limit = 10): Promise<{ items: AuditLog[]; total: number }> {
    this.logger.debug('Fetching audit log', { organizationId, page, limit });
    const { skip, take } = getPaginationParams(page, limit);
    const [items, total] = await this.auditRepo.findAndCount({
      where: { organizationId },
      order: { timestamp: 'DESC' },
      skip,
      take,
    });
    return { items, total };
  }
}
