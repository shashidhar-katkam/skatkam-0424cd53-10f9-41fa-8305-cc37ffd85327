import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsBoolean, MinLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  slug: string;

  @ApiPropertyOptional({ description: 'Map of permission key to boolean, e.g. { "tasks.view": true }' })
  @IsOptional()
  @IsObject()
  permissions?: Record<string, boolean>;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
