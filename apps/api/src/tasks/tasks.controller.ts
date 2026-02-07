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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import type { JwtPayload } from '../common/types';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(PermissionGuard)
export class TasksController {
  constructor(
    private tasksService: TasksService,
    private logger: AppLoggerService
  ) {
    this.logger.setContext('TasksController');
  }

  @Post()
  @RequirePermission('tasks.create')
  @ApiOperation({ summary: 'Create a task' })
  create(
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: JwtPayload
  ) {
    this.logger.debug('POST /tasks', { title: dto.title });
    return this.tasksService.create(dto, user);
  }

  @Get()
  @RequirePermission('tasks.view')
  @ApiOperation({ summary: 'List tasks (scoped by org and role)' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('status') status?: string,
    @Query('category') category?: string
  ) {
    this.logger.debug('GET /tasks', { sortBy, status, category });
    return this.tasksService.findAll(user, sortBy, sortOrder, status, category);
  }

  @Get(':id')
  @RequirePermission('tasks.view')
  @ApiOperation({ summary: 'Get one task' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    this.logger.debug('GET /tasks/:id', { id });
    return this.tasksService.findOne(id, user);
  }

  @Put(':id')
  @RequirePermission('tasks.update')
  @ApiOperation({ summary: 'Update a task' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: JwtPayload
  ) {
    this.logger.debug('PUT /tasks/:id', { id });
    return this.tasksService.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermission('tasks.delete')
  @ApiOperation({ summary: 'Delete a task' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    this.logger.debug('DELETE /tasks/:id', { id });
    return this.tasksService.remove(id, user);
  }
}
