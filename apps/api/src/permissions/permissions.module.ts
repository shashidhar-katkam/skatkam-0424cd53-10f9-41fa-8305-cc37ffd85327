import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionModule as PermissionModuleEntity } from '../entities/permission-module.entity';
import { PermissionFeature } from '../entities/permission-feature.entity';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { PermissionSyncService } from './permission-sync.service';
import { PermissionsController } from './permissions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PermissionModuleEntity,
      PermissionFeature,
      Role,
      User,
    ]),
  ],
  controllers: [PermissionsController],
  providers: [PermissionSyncService],
  exports: [PermissionSyncService],
})
export class PermissionsModule {}
