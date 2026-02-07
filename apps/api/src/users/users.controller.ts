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
import { CurrentUser, RequirePermission } from '../shared';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { AppLoggerService } from '../shared/logger/logger.service';
import { UsersService, UserResponse } from './users.service';
import type { JwtPayload } from '../common/types';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(PermissionGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private logger: AppLoggerService
  ) {
    this.logger.setContext('UsersController');
  }

  @Get()
  @RequirePermission('users.view_users')
  @ApiOperation({ summary: 'List users in current organization (paginated)' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ): Promise<{ items: UserResponse[]; total: number }> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.usersService.findAll(user, pageNum, limitNum);
  }

  @Get(':id')
  @RequirePermission('users.view_users')
  @ApiOperation({ summary: 'Get one user' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<UserResponse> {
    this.logger.debug('GET /users/:id', { id });
    return this.usersService.findOne(id, user);
  }

  @Post()
  @RequirePermission('users.create_users')
  @ApiOperation({ summary: 'Create a user' })
  create(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: JwtPayload
  ): Promise<UserResponse> {
    this.logger.debug('POST /users', { email: dto.email });
    return this.usersService.create(dto, user);
  }

  @Put(':id')
  @RequirePermission('users.update_users')
  @ApiOperation({ summary: 'Update a user' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: JwtPayload
  ): Promise<UserResponse> {
    this.logger.debug('PUT /users/:id', { id });
    return this.usersService.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermission('users.delete_users')
  @ApiOperation({ summary: 'Delete a user' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<{ deleted: true }> {
    this.logger.debug('DELETE /users/:id', { id });
    return this.usersService.remove(id, user);
  }
}
