import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { AppLoggerService } from '../shared/logger/logger.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { getPaginationParams, toSlug } from '../common/utils';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    private logger: AppLoggerService
  ) {
    this.logger.setContext('RolesService');
  }

  async findAll(page = 1, limit = 10): Promise<{ items: Role[]; total: number }> {
    this.logger.debug('Listing roles', { page, limit });
    const { skip, take } = getPaginationParams(page, limit);
    const [items, total] = await this.roleRepo.findAndCount({
      order: { name: 'ASC' },
      skip,
      take,
    });
    return { items, total };
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) {
      this.logger.warn('Role not found', { roleId: id });
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    const existing = await this.roleRepo.findOne({ where: { slug: dto.slug } });
    if (existing) {
      this.logger.warn('Role slug already exists', { slug: dto.slug });
      throw new ConflictException('Role with this slug already exists');
    }
    const role = this.roleRepo.create({
      name: dto.name,
      slug: toSlug(dto.slug),
      permissions: dto.permissions ?? {},
      isActive: dto.isActive ?? true,
    });
    const saved = await this.roleRepo.save(role);
    this.logger.info('Role created', { roleId: saved.id, slug: saved.slug });
    return saved;
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) {
      this.logger.warn('Role not found for update', { roleId: id });
      throw new NotFoundException('Role not found');
    }
    if (dto.name !== undefined) role.name = dto.name;
    if (dto.slug !== undefined) role.slug = toSlug(dto.slug);
    if (dto.permissions !== undefined) role.permissions = dto.permissions;
    if (dto.isActive !== undefined) role.isActive = dto.isActive;
    await this.roleRepo.save(role);
    this.logger.info('Role updated', { roleId: id });
    return role;
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) {
      this.logger.warn('Role not found for delete', { roleId: id });
      throw new NotFoundException('Role not found');
    }
    await this.roleRepo.remove(role);
    this.logger.info('Role deleted', { roleId: id });
    return { deleted: true };
  }
}
