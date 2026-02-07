import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Role } from '../entities/role.entity';
import { OrganizationMember } from '../entities/organization-member.entity';
import { PermissionFeature } from '../entities/permission-feature.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RoleBootstrapService } from './role-bootstrap.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PermissionGuard } from './guards/permission.guard';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Organization, Role, OrganizationMember, PermissionFeature]),
    PermissionsModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:
          config.get<string>('JWT_SECRET') || 'change-me-in-production',
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, RoleBootstrapService, JwtStrategy, PermissionGuard],
  exports: [AuthService, RoleBootstrapService, JwtModule],
})
export class AuthModule {}
