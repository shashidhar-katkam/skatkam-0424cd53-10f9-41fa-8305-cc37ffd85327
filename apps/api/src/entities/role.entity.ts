import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', unique: true })
  slug: string;

  @Column('jsonb', { default: {} })
  permissions: Record<string, boolean>;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
