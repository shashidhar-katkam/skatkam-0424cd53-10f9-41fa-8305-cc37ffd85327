import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  accountId: string | null;

  @Column({ type: 'uuid', nullable: true })
  organizationId: string | null;

  @Column({ type: 'varchar' })
  action: string;

  @Column({ type: 'varchar' })
  resource: string;

  @Column({ type: 'varchar', nullable: true })
  resourceId: string | null;

  @Column('jsonb', { nullable: true })
  details: Record<string, unknown> | null;

  @Column({ type: 'varchar', nullable: true })
  ipAddress: string | null;

  @Column({ type: 'varchar', nullable: true })
  userAgent: string | null;

  @CreateDateColumn()
  timestamp: Date;
}
