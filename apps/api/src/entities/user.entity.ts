import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Role } from './role.entity';
import { OrganizationMember } from './organization-member.entity';
import { Task } from './task.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  passwordHash: string;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'uuid' })
  roleId: string;

  @ManyToOne(() => Role, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @OneToMany(() => OrganizationMember, (m) => m.user)
  memberships: OrganizationMember[];

  @OneToMany(() => Task, (t) => t.createdBy)
  tasks: Task[];
}
