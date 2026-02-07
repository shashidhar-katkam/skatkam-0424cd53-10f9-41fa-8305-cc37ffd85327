import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Acme Corp', description: 'Organization name' })
  @IsString()
  @MinLength(1, { message: 'Organization name is required' })
  @MaxLength(200)
  organizationName: string;

  @ApiProperty({ example: 'admin@acme.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @ApiProperty({ example: 'Jane Doe', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
}
