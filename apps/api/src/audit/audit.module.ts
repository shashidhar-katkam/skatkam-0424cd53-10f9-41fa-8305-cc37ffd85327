import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog, User, Role]),
  ],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
