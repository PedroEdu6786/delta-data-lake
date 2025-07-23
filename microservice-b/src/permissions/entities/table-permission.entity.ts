import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TableEntity } from './table.entity';
import { User } from '../../users/entities/user.entity';

export type TablePermissionType = 'read' | 'write';

@Entity({ name: 'table_permissions' })
export class TablePermissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: ['read', 'write'] })
  permission: TablePermissionType;

  @ManyToOne(() => TableEntity, (table) => table.permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tableId' })
  table: TableEntity;

  @Column()
  tableId: string;

  @ManyToOne(() => User, (user) => user.permissions)
  @JoinColumn({ name: 'userId' })
  user: User;
}
