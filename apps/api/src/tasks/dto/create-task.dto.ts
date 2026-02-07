import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, MinLength, IsUUID, IsDateString } from 'class-validator';
import { TaskStatus, TaskCategory, TaskPriority } from '../../common/enums';

export class CreateTaskDto {
  @ApiPropertyOptional()
  @IsString()
  @MinLength(1)
  title: string;

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
