import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public, RequirePermission } from '../shared';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { PermissionSyncService } from './permission-sync.service';
import type { SyncPermissionsResponseDto } from './types';

@ApiTags('Permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionSyncService: PermissionSyncService) {}

  @Get('structure')
  @Public()
  @ApiOperation({
    summary: 'Get permission structure from DB',
    description:
      'Returns all modules and features for role-edit UI. Served from database.',
  })
  getStructure() {
    return this.permissionSyncService.getStructure();
  }

  @Post('sync')
  @ApiBearerAuth()
  @UseGuards(PermissionGuard)
  @RequirePermission('permissions.sync')
  @ApiOperation({
    summary: 'Sync permissions from JSON to database',
    description:
      'Loads modules and features from permissions directory and upserts to DB. Updates system role defaults. Idempotent.',
  })
  async sync(): Promise<SyncPermissionsResponseDto> {
    return this.permissionSyncService.syncPermissions();
  }
}
