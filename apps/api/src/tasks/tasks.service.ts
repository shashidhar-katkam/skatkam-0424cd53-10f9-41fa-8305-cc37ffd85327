import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { AuditService } from '../audit/audit.service';
import { AppLoggerService } from '../shared/logger/logger.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { toTaskResponse, toTaskResponseDetail } from './task-response.mapper';
import { TASK_STATUS, AUDIT_ACTION, AUDIT_RESOURCE } from '../common/constants';
import { normalizeSortOrder } from '../common/utils';
import type { JwtPayload } from '../common/types';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    private auditService: AuditService,
    private logger: AppLoggerService
  ) {
    this.logger.setContext('TasksService');
  }

  async create(dto: CreateTaskDto, user: JwtPayload) {
    this.logger.debug('Creating task', { title: dto.title, userId: user.userId });
    const status = dto.status ?? TASK_STATUS.TODO;
    const maxOrder = await this.taskRepo
      .createQueryBuilder('task')
      .select('COALESCE(MAX(task.order), -1) + 1', 'next')
      .where('task.organizationId = :orgId', { orgId: user.organizationId })
      .andWhere('task.status = :status', { status })
      .getRawOne<{ next: number }>();
    const order = maxOrder?.next ?? 0;
    const task = this.taskRepo.create({
      title: dto.title,
      description: dto.description ?? null,
      status,
      category: dto.category ?? null,
      organizationId: user.organizationId,
      createdById: user.userId,
      order,
      priority: dto.priority ?? null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      assigneeId: dto.assigneeId ?? null,
      issueKey: dto.issueKey ?? null,
    });
    const saved = await this.taskRepo.save(task);
    await this.auditService.log({
      accountId: user.userId,
      organizationId: user.organizationId,
      action: AUDIT_ACTION.CREATE,
      resource: AUDIT_RESOURCE.TASK,
      resourceId: saved.id,
    });
    this.logger.info('Task created', { taskId: saved.id, userId: user.userId });
    return toTaskResponse(saved);
  }

  async findAll(user: JwtPayload, sortBy?: string, sortOrder?: 'ASC' | 'DESC', status?: string, category?: string) {
    const qb = this.taskRepo
      .createQueryBuilder('task')
      .where('task.organizationId = :orgId', { orgId: user.organizationId });

    if (status) qb.andWhere('task.status = :status', { status });
    if (category) qb.andWhere('task.category = :category', { category });

    const dir = normalizeSortOrder(sortOrder);
    if (sortBy === 'title') {
      qb.orderBy('task.title', dir);
    } else if (sortBy === 'status') {
      qb.orderBy('task.status', dir).addOrderBy('task.order', 'ASC');
    } else if (sortBy === 'category') {
      qb.orderBy('task.category', dir).addOrderBy('task.order', 'ASC');
    } else if (sortBy === 'createdAt') {
      qb.orderBy('task.createdAt', dir);
    } else {
      qb.orderBy("CASE task.status WHEN 'todo' THEN 1 WHEN 'in_progress' THEN 2 WHEN 'done' THEN 3 END", 'ASC')
        .addOrderBy('task.order', 'ASC')
        .addOrderBy('task.createdAt', 'ASC');
    }

    const tasks = await qb.getMany();
    this.logger.debug('Tasks listed', { count: tasks.length, organizationId: user.organizationId });
    return tasks.map((t: Task) => toTaskResponse(t));
  }

  async findOne(id: string, user: JwtPayload) {
    const task = await this.taskRepo.findOne({
      where: { id, organizationId: user.organizationId },
      relations: ['createdBy', 'assignee'],
    });
    if (!task) {
      this.logger.warn('Task not found', { taskId: id });
      throw new NotFoundException('Task not found');
    }
    return toTaskResponseDetail(task);
  }

  async update(id: string, dto: UpdateTaskDto, user: JwtPayload) {
    const task = await this.taskRepo.findOne({
      where: { id, organizationId: user.organizationId },
    });
    if (!task) {
      this.logger.warn('Task not found for update', { taskId: id });
      throw new NotFoundException('Task not found');
    }
    this.logger.debug('Updating task', { taskId: id });
    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.category !== undefined) task.category = dto.category;
    if (dto.order !== undefined) task.order = dto.order;
    if (dto.priority !== undefined) task.priority = dto.priority;
    if (dto.dueDate !== undefined) task.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.assigneeId !== undefined) task.assigneeId = dto.assigneeId;
    if (dto.issueKey !== undefined) task.issueKey = dto.issueKey;
    const saved = await this.taskRepo.save(task);
    if (dto.status !== undefined || dto.order !== undefined) {
      await this.renumberOrderInStatus(saved.organizationId, saved.status);
    }
    await this.auditService.log({
      accountId: user.userId,
      organizationId: user.organizationId,
      action: AUDIT_ACTION.UPDATE,
      resource: AUDIT_RESOURCE.TASK,
      resourceId: saved.id,
    });
    this.logger.info('Task updated', { taskId: saved.id });
    const updated = await this.taskRepo.findOne({ where: { id: saved.id } }) ?? saved;
    return toTaskResponse(updated);
  }

  private async renumberOrderInStatus(organizationId: string, status: string) {
    const list = await this.taskRepo.find({
      where: { organizationId, status },
      order: { order: 'ASC', createdAt: 'ASC' },
    });
    for (let i = 0; i < list.length; i++) {
      if (list[i].order !== i) {
        list[i].order = i;
        await this.taskRepo.save(list[i]);
      }
    }
  }

  async remove(id: string, user: JwtPayload) {
    const task = await this.taskRepo.findOne({
      where: { id, organizationId: user.organizationId },
    });
    if (!task) {
      this.logger.warn('Task not found for delete', { taskId: id });
      throw new NotFoundException('Task not found');
    }
    await this.taskRepo.remove(task);
    await this.auditService.log({
      accountId: user.userId,
      organizationId: user.organizationId,
      action: AUDIT_ACTION.DELETE,
      resource: AUDIT_RESOURCE.TASK,
      resourceId: id,
    });
    this.logger.info('Task deleted', { taskId: id, userId: user.userId });
    return { deleted: true };
  }

}
