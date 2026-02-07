import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PermissionFeature } from './permission-feature.entity';

@Entity('permission_modules')
export class PermissionModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  moduleId: string;

  @Column({ type: 'varchar' })
  moduleName: string;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @OneToMany(() => PermissionFeature, (f) => f.module)
  features: PermissionFeature[];
}
