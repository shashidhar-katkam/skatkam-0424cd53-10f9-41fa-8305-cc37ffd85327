import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsInt, Min, IsUUID, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskStatus, TaskCategory, TaskPriority } from '../../common/enums';

export class UpdateTaskDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsIn(Object.values(TaskStatus))
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskCategory })
  @IsOptional()
  @IsIn(Object.values(TaskCategory))
  category?: TaskCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsOptional()
  @IsIn(Object.values(TaskPriority))
  priority?: TaskPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  issueKey?: string;
}
