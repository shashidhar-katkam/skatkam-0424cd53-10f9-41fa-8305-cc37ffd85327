import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { AppLoggerService } from '../shared/logger/logger.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { getPaginationParams } from '../common/utils';
import type { JwtPayload } from '../common/types';

export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  organizationId: string;
  roleId: string;
  role: { id: string; name: string; slug: string };
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private logger: AppLoggerService
  ) {
    this.logger.setContext('UsersService');
  }

  async findAll(user: JwtPayload, page = 1, limit = 10): Promise<{ items: UserResponse[]; total: number }> {
    this.logger.debug('Listing users for org', { organizationId: user.organizationId, page, limit });
    const { skip, take } = getPaginationParams(page, limit);
    const [users, total] = await this.userRepo.findAndCount({
      where: { organizationId: user.organizationId },
      relations: ['role'],
      order: { email: 'ASC' },
      skip,
      take,
    });
    return { items: users.map((u) => this.toResponse(u)), total };
  }

  async findOne(id: string, user: JwtPayload): Promise<UserResponse> {
    const found = await this.userRepo.findOne({
      where: { id, organizationId: user.organizationId },
      relations: ['role'],
    });
    if (!found) {
      this.logger.warn('User not found', { userId: id });
      throw new NotFoundException('User not found');
    }
    return this.toResponse(found);
  }

  async create(dto: CreateUserDto, currentUser: JwtPayload): Promise<UserResponse> {
    const orgId = dto.organizationId ?? currentUser.organizationId;
    if (orgId !== currentUser.organizationId) {
      throw new ForbiddenException('Cannot create user in another organization');
    }
    const emailLower = dto.email.toLowerCase();
    const existing = await this.userRepo.findOne({ where: { email: emailLower } });
    if (existing) {
      this.logger.warn('User email already exists', { email: emailLower });
      throw new ConflictException('User with this email already exists');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const newUser = this.userRepo.create({
      email: emailLower,
      passwordHash,
      name: dto.name ?? null,
      organizationId: orgId,
      roleId: dto.roleId,
    });
    const saved = await this.userRepo.save(newUser);
    const withRole = await this.userRepo.findOne({
      where: { id: saved.id },
      relations: ['role'],
    })!;
    this.logger.info('User created', { userId: saved.id, email: saved.email });
    return this.toResponse(withRole!);
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    currentUser: JwtPayload
  ): Promise<UserResponse> {
    const found = await this.userRepo.findOne({
      where: { id, organizationId: currentUser.organizationId },
      relations: ['role'],
    });
    if (!found) {
      this.logger.warn('User not found for update', { userId: id });
      throw new NotFoundException('User not found');
    }
    if (dto.name !== undefined) found.name = dto.name;
    if (dto.roleId !== undefined) found.roleId = dto.roleId;
    if (dto.password && dto.password.length >= 6) {
      found.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    await this.userRepo.save(found);
    this.logger.info('User updated', { userId: id });
    return this.toResponse(found);
  }

  async remove(id: string, currentUser: JwtPayload): Promise<{ deleted: true }> {
    const found = await this.userRepo.findOne({
      where: { id, organizationId: currentUser.organizationId },
    });
    if (!found) {
      this.logger.warn('User not found for delete', { userId: id });
      throw new NotFoundException('User not found');
    }
    if (found.id === currentUser.userId) {
      throw new ForbiddenException('Cannot delete your own user');
    }
    await this.userRepo.remove(found);
    this.logger.info('User deleted', { userId: id });
    return { deleted: true };
  }

  private toResponse(u: User): UserResponse {
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      organizationId: u.organizationId,
      roleId: u.roleId,
      role: u.role
        ? { id: u.role.id, name: u.role.name, slug: u.role.slug }
        : { id: u.roleId, name: '', slug: '' },
    };
  }
}
