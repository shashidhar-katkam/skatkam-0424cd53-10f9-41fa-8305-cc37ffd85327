import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermission } from '../shared';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { AppLoggerService } from '../shared/logger/logger.service';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from '../entities/role.entity';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(PermissionGuard)
export class RolesController {
  constructor(
    private rolesService: RolesService,
    private logger: AppLoggerService
  ) {
    this.logger.setContext('RolesController');
  }

  @Get()
  @RequirePermission('roles.view_roles')
  @ApiOperation({ summary: 'List roles (paginated)' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.rolesService.findAll(pageNum, limitNum);
  }

  @Get(':id')
  @RequirePermission('roles.view_roles')
  @ApiOperation({ summary: 'Get one role' })
  findOne(@Param('id') id: string): Promise<Role> {
    this.logger.debug('GET /roles/:id', { id });
    return this.rolesService.findOne(id);
  }

  @Post()
  @RequirePermission('roles.create_roles')
  @ApiOperation({ summary: 'Create a role' })
  create(@Body() dto: CreateRoleDto): Promise<Role> {
    this.logger.debug('POST /roles', { name: dto.name });
    return this.rolesService.create(dto);
  }

  @Put(':id')
  @RequirePermission('roles.update_roles')
  @ApiOperation({ summary: 'Update a role' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto
  ): Promise<Role> {
    this.logger.debug('PUT /roles/:id', { id });
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('roles.delete_roles')
  @ApiOperation({ summary: 'Delete a role' })
  remove(@Param('id') id: string) {
    this.logger.debug('DELETE /roles/:id', { id });
    return this.rolesService.remove(id);
  }
}
