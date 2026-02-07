import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { PermissionFeature } from '../entities/permission-feature.entity';
import { AppLoggerService } from '../shared/logger/logger.service';
import { PermissionSyncService } from '../permissions/permission-sync.service';
import { ROLE_SLUG } from '../common/constants';

@Injectable()
export class RoleBootstrapService {
  constructor(
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(PermissionFeature) private featureRepo: Repository<PermissionFeature>,
    private logger: AppLoggerService,
    private permissionSyncService: PermissionSyncService
  ) {
    this.logger.setContext('RoleBootstrapService');
  }

  /** Ensure Owner, Admin, Viewer roles exist. Returns Owner role. */
  async ensureDefaultRoles(): Promise<Role> {
    let owner = await this.roleRepo.findOne({ where: { slug: ROLE_SLUG.OWNER } });
    if (owner) return owner;

    this.logger.info('Bootstrapping default roles');
    try {
      await this.permissionSyncService.syncPermissions();
    } catch (err) {
      this.logger.warn('Permission sync during bootstrap failed (non-fatal)', { err: String(err) });
    }

    const fullPermissions = await this.buildFullPermissions();
    const adminPermissions = { ...fullPermissions };
    delete adminPermissions['permissions.sync'];

    await this.createRole('Owner', ROLE_SLUG.OWNER, fullPermissions);
    await this.createRole('Admin', ROLE_SLUG.ADMIN, adminPermissions);
    await this.createRole('Viewer', ROLE_SLUG.VIEWER, { 'tasks.view': true });

    owner = await this.roleRepo.findOne({ where: { slug: ROLE_SLUG.OWNER } });
    if (!owner) throw new Error('Failed to create Owner role');
    return owner;
  }

  /** Build full permissions map from all features */
  async buildFullPermissions(): Promise<Record<string, boolean>> {
    const features = await this.featureRepo.find({ select: ['moduleId', 'featureId'] });
    const perms: Record<string, boolean> = {};
    for (const f of features) {
      perms[`${f.moduleId}.${f.featureId}`] = true;
    }
    return perms;
  }

  private async createRole(
    name: string,
    slug: string,
    permissions: Record<string, boolean>
  ): Promise<Role> {
    const role = this.roleRepo.create({
      name,
      slug,
      permissions: { ...permissions },
      isActive: true,
    });
    return this.roleRepo.save(role);
  }
}
