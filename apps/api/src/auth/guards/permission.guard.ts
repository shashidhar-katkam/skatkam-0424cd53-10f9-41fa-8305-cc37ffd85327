import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { checkPermission, PERMISSION_KEY } from '../../shared';
import { User } from '../../entities/user.entity';
import { AppLoggerService } from '../../shared/logger/logger.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private logger: AppLoggerService
  ) {
    this.logger.setContext('PermissionGuard');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const authUser = request.user;
    const userId = authUser?.userId;
    if (!userId) {
      this.logger.warn('Permission check failed: user not authenticated');
      throw new ForbiddenException('User not authenticated');
    }

    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    if (!user?.role) {
      this.logger.warn('Permission check failed: no role assigned', { userId });
      throw new ForbiddenException('No role assigned');
    }
    if (!user.role.isActive) {
      this.logger.warn('Permission check failed: role inactive', { userId, roleId: user.role.id });
      throw new ForbiddenException('Role is inactive');
    }

    const roleSlug = (user.role.slug || '').toLowerCase();
    const isAdminOrOwner =
      roleSlug === 'admin' || roleSlug === 'owner';
    let permissions = user.role.permissions ?? {};
    if (typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions) as Record<string, boolean>;
      } catch {
        permissions = {};
      }
    }
    if (isAdminOrOwner) {
      permissions = { '*': true };
    }

    const hasPermission = checkPermission(
      permissions as Record<string, boolean>,
      requiredPermission
    );
    if (!hasPermission) {
      this.logger.warn('Permission denied', { userId, requiredPermission, roleSlug });
      throw new ForbiddenException('Insufficient permissions');
    }
    this.logger.debug('Permission granted', { userId, requiredPermission });
    return true;
  }
}
