import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { PermissionModule } from './permission-module.entity';

@Entity('permission_features')
@Unique(['moduleId', 'featureId'])
export class PermissionFeature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  featureId: string;

  @Column({ type: 'varchar' })
  moduleId: string;

  @ManyToOne(() => PermissionModule, (m) => m.features, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'moduleId', referencedColumnName: 'moduleId' })
  module: PermissionModule;

  @Column({ type: 'varchar' })
  featureName: string;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: false })
  defaultEnabled: boolean;
}
