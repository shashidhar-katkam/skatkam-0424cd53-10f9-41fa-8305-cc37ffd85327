import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../entities/organization.entity';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, Role, User]),
    AuthModule,
  ],
  providers: [SeedService],
})
export class SeedModule {}
