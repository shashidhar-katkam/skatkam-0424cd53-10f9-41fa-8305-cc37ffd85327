import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from './shared';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { SeedModule } from './seed/seed.module';
import { LoggerModule } from './shared/logger/logger.module';
import {
  Organization,
  Role,
  User,
  OrganizationMember,
  Task,
  AuditLog,
  PermissionModule as PermissionModuleEntity,
  PermissionFeature,
} from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const url = process.env['DATABASE_URL'] ?? '';
        const base = {
          entities: [
            Organization,
            Role,
            User,
            OrganizationMember,
            Task,
            AuditLog,
            PermissionModuleEntity,
            PermissionFeature,
          ],
          synchronize: true,
        };
        const match = url.match(
          /^postgres(?:ql)?:\/\/([^@]+)@([^:\/]+):?(\d+)?\/([^?]*)/
        );
        if (match) {
          const [, userInfo, host, portStr, database] = match;
          const colonIdx = userInfo.indexOf(':');
          const username =
            colonIdx >= 0 ? userInfo.slice(0, colonIdx) : userInfo;
          const password =
            colonIdx >= 0 ? userInfo.slice(colonIdx + 1) : '';
          return {
            type: 'postgres',
            host: host || 'localhost',
            port: portStr ? parseInt(portStr, 10) : 5432,
            username: decodeURIComponent(username),
            password: String(decodeURIComponent(password)),
            database: (database || 'taskdb').replace(/\/$/, ''),
            ssl: url.includes('rds.amazonaws.com')
              ? { rejectUnauthorized: false }
              : false,
            ...base,
          };
        }
        return {
          type: 'postgres',
          url,
          ssl: url.includes('rds.amazonaws.com')
            ? { rejectUnauthorized: false }
            : false,
          ...base,
        };
      },
    }),
    SeedModule,
    HealthModule,
    PermissionsModule,
    RolesModule,
    UsersModule,
    AuthModule,
    TasksModule,
    AuditModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
