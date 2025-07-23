import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { TablePermissionEntity } from '../../permissions/entities/table-permission.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  name: string;

  @OneToMany(() => TablePermissionEntity, (permission) => permission.user)
  permissions: TablePermissionEntity[];
}
