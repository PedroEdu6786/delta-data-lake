import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TablePermissionEntity } from './table-permission.entity';

@Entity({ name: 'tables' })
export class TableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'json', nullable: true })
  schema: any; // you could define a stricter type, e.g., a custom JSON schema interface

  @Column({ nullable: true })
  description: string;

  @Column({ default: '1.0.0' })
  version: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => TablePermissionEntity, (permission) => permission.table, {
    cascade: true,
  })
  permissions: TablePermissionEntity[];
}
