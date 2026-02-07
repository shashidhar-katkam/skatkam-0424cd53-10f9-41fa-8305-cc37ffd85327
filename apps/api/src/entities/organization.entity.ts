import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'uuid', nullable: true })
  parentId: string | null;

  /** When true, this org is the super org (e.g. Swagger access, parent for new orgs). Set by seed. */
  @Column({ type: 'boolean', default: false })
  isSuper: boolean;
}
