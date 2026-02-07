import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { PermissionModule as PermissionModuleEntity } from '../entities/permission-module.entity';
import { PermissionFeature } from '../entities/permission-feature.entity';
import { Role } from '../entities/role.entity';
import { AppLoggerService } from '../shared/logger/logger.service';
import type { PermissionModuleDef, SystemRoleDef } from './types';
import type { SyncPermissionsResponseDto } from './types';
import { resolvePermissionsDir } from './path-resolver';
import { buildAllPermissionKeys, expandPermissions } from './permission-expander';

@Injectable()
export class PermissionSyncService {
  constructor(
    @InjectRepository(PermissionModuleEntity)
    private moduleRepo: Repository<PermissionModuleEntity>,
    @InjectRepository(PermissionFeature)
    private featureRepo: Repository<PermissionFeature>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    private logger: AppLoggerService
  ) {
    this.logger.setContext('PermissionSyncService');
  }

  async syncPermissions(): Promise<SyncPermissionsResponseDto> {
    this.logger.info('Starting permission sync');
    const baseDir = resolvePermissionsDir();
    const metadataPath = join(baseDir, 'metadata.json');
    const modulesDir = join(baseDir, 'modules');
    const systemRolesDir = join(baseDir, 'system-roles');

    if (!existsSync(metadataPath)) {
      throw new InternalServerErrorException(
        `metadata.json not found. Tried: ${baseDir}`
      );
    }
    if (!existsSync(modulesDir)) {
      throw new InternalServerErrorException(
        `permissions/modules directory not found at ${modulesDir}`
      );
    }

    const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8')) as {
      version?: string;
      lastUpdated?: string;
    };
    const moduleFiles = readdirSync(modulesDir)
      .filter((f) => f.endsWith('.json'))
      .sort();
    const modules: PermissionModuleDef[] = moduleFiles.map((file) => {
      const content = readFileSync(join(modulesDir, file), 'utf-8');
      return JSON.parse(content) as PermissionModuleDef;
    });

    const stats = {
      modulesCreated: 0,
      modulesUpdated: 0,
      featuresCreated: 0,
      featuresUpdated: 0,
      totalModules: 0,
      totalFeatures: 0,
    };

    for (let sortOrder = 0; sortOrder < modules.length; sortOrder++) {
      const mod = modules[sortOrder];
      if (!mod.moduleId) continue;

      const existingModule = await this.moduleRepo.findOne({
        where: { moduleId: mod.moduleId },
      });

      if (existingModule) {
        existingModule.moduleName = mod.moduleName;
        existingModule.description = mod.description ?? null;
        existingModule.sortOrder = sortOrder;
        await this.moduleRepo.save(existingModule);
        stats.modulesUpdated++;
      } else {
        await this.moduleRepo.save(
          this.moduleRepo.create({
            moduleId: mod.moduleId,
            moduleName: mod.moduleName,
            description: mod.description ?? null,
            sortOrder,
          })
        );
        stats.modulesCreated++;
      }

      for (const feat of mod.features || []) {
        if (!feat.featureId) continue;
        const existingFeature = await this.featureRepo.findOne({
          where: { moduleId: mod.moduleId, featureId: feat.featureId },
        });
        if (existingFeature) {
          existingFeature.featureName = feat.featureName;
          existingFeature.description = feat.description ?? null;
          existingFeature.defaultEnabled = feat.defaultEnabled ?? false;
          await this.featureRepo.save(existingFeature);
          stats.featuresUpdated++;
        } else {
          await this.featureRepo.save(
            this.featureRepo.create({
              moduleId: mod.moduleId,
              featureId: feat.featureId,
              featureName: feat.featureName,
              description: feat.description ?? null,
              defaultEnabled: feat.defaultEnabled ?? false,
            })
          );
          stats.featuresCreated++;
        }
      }
    }

    stats.totalModules = await this.moduleRepo.count();
    stats.totalFeatures = await this.featureRepo.count();

    if (existsSync(systemRolesDir)) {
      await this.syncSystemRolePermissions(modules);
    }

    this.logger.info('Permission sync completed', stats);
    return {
      success: true,
      message: 'Permissions synced successfully',
      stats,
      version: metadata.version,
    };
  }

  private async syncSystemRolePermissions(modules: PermissionModuleDef[]): Promise<void> {
    const baseDir = resolvePermissionsDir();
    const systemRolesDir = join(baseDir, 'system-roles');
    const files = readdirSync(systemRolesDir).filter((f) => f.endsWith('.json'));
    const systemRoles = files.map((f) =>
      JSON.parse(
        readFileSync(join(systemRolesDir, f), 'utf-8')
      ) as SystemRoleDef
    );

    const allPermissionKeys = buildAllPermissionKeys(modules);

    for (const sr of systemRoles) {
      if (!sr.roleId || !sr.defaultPermissions) continue;

      const expanded = expandPermissions(sr.defaultPermissions, allPermissionKeys);

      const roles = await this.roleRepo.find({ where: { slug: sr.roleId } });
      for (const role of roles) {
        await this.roleRepo.update(role.id, { permissions: expanded });
        this.logger.debug('Updated system role', { slug: role.slug, roleId: role.id });
      }
    }
  }

  async getStructure(): Promise<
    Array<{
      moduleId: string;
      moduleName: string;
      description: string | null;
      sortOrder: number;
      features: Array<{
        featureId: string;
        featureName: string;
        description: string | null;
        defaultEnabled: boolean;
        permissionKey: string;
      }>;
    }>
  > {
    const modules = await this.moduleRepo.find({
      order: { sortOrder: 'ASC' },
      relations: ['features'],
    });
    return modules.map((m) => ({
      moduleId: m.moduleId,
      moduleName: m.moduleName,
      description: m.description,
      sortOrder: m.sortOrder,
      features: (m.features || []).map((f) => ({
        featureId: f.featureId,
        featureName: f.featureName,
        description: f.description,
        defaultEnabled: f.defaultEnabled,
        permissionKey: `${f.moduleId}.${f.featureId}`,
      })),
    }));
  }
}
