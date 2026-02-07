import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: 'todo' })
  status: string;

  @Column({ type: 'varchar', nullable: true })
  category: string | null;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'varchar', nullable: true })
  priority: string | null;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date | null;

  @Column({ type: 'uuid', nullable: true })
  assigneeId: string | null;

  @Column({ type: 'varchar', nullable: true })
  issueKey: string | null;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  createdById: string;

  @ManyToOne(() => User, (u) => u.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigneeId' })
  assignee: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
