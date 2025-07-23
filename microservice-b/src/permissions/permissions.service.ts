import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TableEntity } from './entities/table.entity';
import { TablePermissionEntity } from './entities/table-permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(TableEntity)
    private readonly tableRepository: Repository<TableEntity>,
    @InjectRepository(TablePermissionEntity)
    private readonly permissionsRepository: Repository<TablePermissionEntity>,
  ) {}

  async checkAccess(userId: string, tableNames: string[]) {
    const tables = await Promise.all(
      tableNames.map((name) =>
        this.tableRepository.findOne({ where: { name } }),
      ),
    );
    const validTables = tables.filter((table) => !!table);
    const tableIds = validTables.map((t) => t.id);

    const permissions = await this.permissionsRepository.find({
      where: {
        userId,
        tableId: tableIds.length > 0 ? In(tableIds) : undefined,
      },
    });

    const deniedTables = tableNames.filter((tableName) => {
      const matchingTable = validTables.find(
        (table) => table.name === tableName,
      );
      if (!matchingTable) return true;
      return !permissions.some((p) => p.tableId === matchingTable.id);
    });

    return {
      allowed: deniedTables.length === 0,
      deniedTables,
    };
  }
}
