import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermission, CurrentUser } from '../shared';
import { AuditLog } from '../entities/audit-log.entity';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { AppLoggerService } from '../shared/logger/logger.service';
import { AuditService } from './audit.service';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit-log')
@UseGuards(PermissionGuard)
export class AuditController {
  constructor(
    private auditService: AuditService,
    private logger: AppLoggerService
  ) {
    this.logger.setContext('AuditController');
  }

  @Get()
  @RequirePermission('audit.view')
  @ApiOperation({ summary: 'Get audit logs (paginated, Owner/Admin only)' })
  async getAuditLog(
    @CurrentUser('organizationId') orgId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    this.logger.debug('GET /audit-log', { organizationId: orgId });
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const { items, total } = await this.auditService.findForOrg(orgId, pageNum, limitNum);
    return {
      items: items.map((e: AuditLog) => ({
        id: e.id,
        accountId: e.accountId,
        organizationId: e.organizationId,
        action: e.action,
        resource: e.resource,
        resourceId: e.resourceId,
        details: e.details,
        ipAddress: e.ipAddress,
        userAgent: e.userAgent,
        timestamp: e.timestamp,
      })),
      total,
    };
  }
}
