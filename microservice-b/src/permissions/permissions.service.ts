import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TableEntity } from './entities/table.entity';
import { TablePermissionEntity } from './entities/table-permission.entity';

interface PermissionCheckResult {
  allowed: boolean;
  deniedTables: string[];
}

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(TableEntity)
    private readonly tableRepository: Repository<TableEntity>,
    @InjectRepository(TablePermissionEntity)
    private readonly permissionsRepository: Repository<TablePermissionEntity>,
  ) {}

  async checkAccess(
    userId: string,
    tableNames: string[],
  ): Promise<PermissionCheckResult> {
    if (!tableNames.length) {
      return { allowed: true, deniedTables: [] };
    }

    const validTables = await this.getValidTables(tableNames);
    const userPermissions = await this.getUserPermissions(userId, validTables);
    const deniedTables = this.findDeniedTables(
      tableNames,
      validTables,
      userPermissions,
    );

    return {
      allowed: deniedTables.length === 0,
      deniedTables,
    };
  }

  private async getValidTables(tableNames: string[]): Promise<TableEntity[]> {
    const tables = await Promise.all(
      tableNames.map((name) =>
        this.tableRepository.findOne({ where: { name } }),
      ),
    );
    return tables.filter((table) => !!table);
  }

  private async getUserPermissions(
    userId: string,
    validTables: TableEntity[],
  ): Promise<TablePermissionEntity[]> {
    if (!validTables.length) return [];

    const tableIds = validTables.map((table) => table.id);
    return this.permissionsRepository.find({
      where: {
        userId,
        tableId: In(tableIds),
      },
    });
  }

  private findDeniedTables(
    requestedTables: string[],
    validTables: TableEntity[],
    userPermissions: TablePermissionEntity[],
  ): string[] {
    return requestedTables.filter((tableName) => {
      const matchingTable = validTables.find(
        (table) => table.name === tableName,
      );
      if (!matchingTable) return true;

      return !userPermissions.some(
        (permission) => permission.tableId === matchingTable.id,
      );
    });
  }
}
