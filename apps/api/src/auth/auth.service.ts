import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { OrganizationMember } from '../entities/organization-member.entity';
import { PermissionFeature } from '../entities/permission-feature.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AppLoggerService } from '../shared/logger/logger.service';
import { RoleBootstrapService } from './role-bootstrap.service';
import { PERMISSION_WILDCARD } from '../common/constants';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private memberRepo: Repository<OrganizationMember>,
    @InjectRepository(PermissionFeature)
    private featureRepo: Repository<PermissionFeature>,
    private jwtService: JwtService,
    private logger: AppLoggerService,
    private roleBootstrapService: RoleBootstrapService
  ) {
    this.logger.setContext('AuthService');
  }

  private isSuperOrganization(org: Organization | null | undefined): boolean {
    return !!org?.isSuper;
  }

  /** Return permissions for API response: expand * to explicit keys, never send * to frontend so RBAC is explicit-only. */
  private async normalizePermissionsForClient(rolePermissions: Record<string, boolean> | null | undefined): Promise<Record<string, boolean>> {
    if (!rolePermissions || typeof rolePermissions !== 'object') return {};
    const hasWildcard = rolePermissions[PERMISSION_WILDCARD.ALL] === true || rolePermissions[PERMISSION_WILDCARD.ALL_ALT] === true;
    let out: Record<string, boolean>;
    if (hasWildcard) {
      const features = await this.featureRepo.find({ select: ['moduleId', 'featureId'] });
      out = {};
      for (const f of features) {
        out[`${f.moduleId}.${f.featureId}`] = true;
      }
    } else {
      out = { ...rolePermissions };
    }
    delete out[PERMISSION_WILDCARD.ALL];
    delete out[PERMISSION_WILDCARD.ALL_ALT];
    return out;
  }

  async login(dto: LoginDto) {
    this.logger.debug('Login attempt', { email: dto.email });
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
      relations: ['role', 'organization'],
    });
    if (!user) {
      this.logger.warn('Login failed: user not found', { email: dto.email });
      throw new UnauthorizedException('Invalid email or password');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      this.logger.warn('Login failed: invalid password', { userId: user.id });
      throw new UnauthorizedException('Invalid email or password');
    }
    const payload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role?.slug ?? 'viewer',
    };
    const accessToken = this.jwtService.sign(payload);
    this.logger.info('Login successful', { userId: user.id, organizationId: user.organizationId, role: payload.role });
    const rolePerms = (user.role?.permissions && typeof user.role.permissions === 'object')
      ? user.role.permissions
      : {};
    const permissions = await this.normalizePermissionsForClient(rolePerms);
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        organizationId: user.organizationId,
        organizationName: user.organization?.name,
        role: user.role?.slug ?? 'viewer',
        permissions,
        canAccessSwagger: this.isSuperOrganization(user.organization),
      },
    };
  }

  async me(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['role', 'organization'],
    });
    if (!user) throw new UnauthorizedException('User not found');
    const rolePerms = (user.role?.permissions && typeof user.role.permissions === 'object')
      ? user.role.permissions
      : {};
    const permissions = await this.normalizePermissionsForClient(rolePerms);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        organizationId: user.organizationId,
        organizationName: user.organization?.name,
        roleId: user.roleId,
        role: user.role?.slug ?? 'viewer',
        roleName: user.role?.name,
        permissions,
        canAccessSwagger: this.isSuperOrganization(user.organization),
      },
    };
  }

  /** Register a new organization and its first user (owner). Returns same shape as login for auto-login. */
  async register(dto: RegisterDto) {
    const emailLower = dto.email.toLowerCase();
    const existing = await this.userRepo.findOne({ where: { email: emailLower } });
    if (existing) {
      this.logger.warn('Registration failed: email already exists', { email: emailLower });
      throw new ConflictException('A user with this email already exists');
    }
    const ownerRole = await this.roleBootstrapService.ensureDefaultRoles();
    const superOrg = await this.orgRepo.findOne({ where: { isSuper: true } });
    const org = this.orgRepo.create({
      name: dto.organizationName.trim(),
      parentId: superOrg?.id ?? null,
    });
    await this.orgRepo.save(org);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      email: emailLower,
      passwordHash,
      name: dto.name?.trim() ?? null,
      organizationId: org.id,
      roleId: ownerRole.id,
    });
    await this.userRepo.save(user);
    const member = this.memberRepo.create({
      userId: user.id,
      organizationId: org.id,
      roleId: ownerRole.id,
      isActive: true,
    });
    await this.memberRepo.save(member);
    this.logger.info('Organization registered', {
      organizationId: org.id,
      userId: user.id,
      email: user.email,
    });
    const withRole = await this.userRepo.findOne({
      where: { id: user.id },
      relations: ['role'],
    });
    if (!withRole) throw new UnauthorizedException('User not found after registration');
    const payload = {
      sub: withRole.id,
      email: withRole.email,
      organizationId: withRole.organizationId,
      role: withRole.role?.slug ?? 'owner',
    };
    const accessToken = this.jwtService.sign(payload);
    const rolePerms =
      withRole.role?.permissions && typeof withRole.role.permissions === 'object'
        ? withRole.role.permissions
        : {};
    const permissions = await this.normalizePermissionsForClient(rolePerms);
    const orgName = org.name;
    return {
      accessToken,
      user: {
        id: withRole.id,
        email: withRole.email,
        name: withRole.name ?? undefined,
        organizationId: withRole.organizationId,
        organizationName: orgName,
        role: withRole.role?.slug ?? 'owner',
        permissions,
        canAccessSwagger: false,
      },
    };
  }
}
