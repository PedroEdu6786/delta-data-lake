import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { TableEntity } from '../entities/table.entity';

@Injectable()
export class TableRepository extends Repository<TableEntity> {
  constructor(private dataSource: DataSource) {
    super(TableEntity, dataSource.createEntityManager());
  }

  async findByName(name: string): Promise<TableEntity | null> {
    return this.findOne({ where: { name } });
  }
}
