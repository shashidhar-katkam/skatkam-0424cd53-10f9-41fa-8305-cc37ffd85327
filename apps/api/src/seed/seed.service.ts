import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Organization } from '../entities/organization.entity';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { AppLoggerService } from '../shared/logger/logger.service';
import { RoleBootstrapService } from '../auth/role-bootstrap.service';
import { SEED, ROLE_SLUG } from '../common/constants';

@Injectable()
export class SeedService implements OnModuleInit {
  /** Ensure exactly one organization is marked super (for Swagger and registration parent). */
  private async ensureSuperOrganization() {
    const hasSuper = await this.orgRepo.findOne({ where: { isSuper: true } });
    if (hasSuper) return;
    const defaultOrFirst =
      (await this.orgRepo.findOne({ where: { name: SEED.DEFAULT_ORG_NAME }, order: { id: 'ASC' } })) ??
      (await this.orgRepo.find({ order: { id: 'ASC' }, take: 1 }))[0];
    if (defaultOrFirst) {
      await this.orgRepo.update({ id: defaultOrFirst.id }, { isSuper: true });
      this.logger.info('Marked super organization', { organizationId: defaultOrFirst.id });
    }
  }

  constructor(
    @InjectRepository(Organization) private orgRepo: Repository<Organization>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private roleBootstrapService: RoleBootstrapService,
    private logger: AppLoggerService
  ) {
    this.logger.setContext('SeedService');
  }

  async onModuleInit() {
    await this.ensureSuperOrganization();

    const userCount = await this.userRepo.count();
    if (userCount > 0) {
      this.logger.debug('Seed skipped: users already exist');
      return;
    }
    this.logger.info('Running seed: creating default org (super), roles, and admin user');

    const org = this.orgRepo.create({ name: SEED.DEFAULT_ORG_NAME, isSuper: true });
    await this.orgRepo.save(org);

    try {
      await this.roleBootstrapService.ensureDefaultRoles();
      this.logger.info('Default roles ensured');
    } catch (err) {
      this.logger.warn('Role bootstrap failed (non-fatal)', { err: String(err) });
    }

    const adminRole = await this.roleRepo.findOne({ where: { slug: ROLE_SLUG.ADMIN } });
    if (!adminRole) {
      this.logger.error('Admin role not found after bootstrap');
      return;
    }

    const hash = await bcrypt.hash(SEED.ADMIN_PASSWORD, 10);
    const admin = this.userRepo.create({
      email: SEED.ADMIN_EMAIL,
      passwordHash: hash,
      name: SEED.ADMIN_NAME,
      organizationId: org.id,
      roleId: adminRole.id,
    });
    await this.userRepo.save(admin);

    this.logger.info(`Seed complete: default org, roles, ${SEED.ADMIN_EMAIL} / ${SEED.ADMIN_PASSWORD}`);
  }
}
