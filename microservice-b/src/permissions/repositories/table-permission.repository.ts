import { Injectable } from '@nestjs/common';
import { Repository, DataSource, In } from 'typeorm';
import { TablePermissionEntity } from '../entities/table-permission.entity';

@Injectable()
export class TablePermissionRepository extends Repository<TablePermissionEntity> {
  constructor(private dataSource: DataSource) {
    super(TablePermissionEntity, dataSource.createEntityManager());
  }

  async findByUserAndTable(
    userId: string,
    tableId: string,
  ): Promise<TablePermissionEntity | null> {
    return this.findOne({
      where: {
        userId,
        tableId,
      },
      relations: ['table'],
    });
  }

  async findByUserForTables(
    userId: string,
    tableIds: string[],
  ): Promise<TablePermissionEntity[]> {
    return this.find({
      where: {
        userId,
        tableId: In(tableIds),
      },
      relations: ['table'],
    });
  }
}
