import { DataSource } from 'typeorm';
import { TablePermissionEntity } from '../../permissions/entities/table-permission.entity';
import { User } from '../../users/entities/user.entity';
import { TableEntity } from '../../permissions/entities/table.entity';

export class TablePermissionSeeder {
  static async run(dataSource: DataSource): Promise<void> {
    const permissionRepository = dataSource.getRepository(
      TablePermissionEntity,
    );
    const userRepository = dataSource.getRepository(User);
    const tableRepository = dataSource.getRepository(TableEntity);

    // Check if permissions already exist
    const existingPermissions = await permissionRepository.count();
    if (existingPermissions > 0) {
      console.log(
        'Table permissions already exist, skipping permission seeding',
      );
      return;
    }

    // Get users and tables
    const adminUser = await userRepository.findOne({
      where: { email: 'admin@example.com' },
    });
    const employeeUser = await userRepository.findOne({
      where: { email: 'employee@example.com' },
    });
    const johnUser = await userRepository.findOne({
      where: { email: 'john.doe@example.com' },
    });

    const usersTable = await tableRepository.findOne({
      where: { name: 'users' },
    });
    const productsTable = await tableRepository.findOne({
      where: { name: 'products' },
    });
    const ordersTable = await tableRepository.findOne({
      where: { name: 'orders' },
    });

    if (
      !adminUser ||
      !employeeUser ||
      !johnUser ||
      !usersTable ||
      !productsTable ||
      !ordersTable
    ) {
      console.log(
        'Required users or tables not found, skipping permission seeding',
      );
      return;
    }

    const permissions = [
      // Admin has write access to all tables
      {
        userId: adminUser.id,
        tableId: usersTable.id,
        permission: 'write' as const,
      },
      {
        userId: adminUser.id,
        tableId: productsTable.id,
        permission: 'write' as const,
      },
      {
        userId: adminUser.id,
        tableId: ordersTable.id,
        permission: 'write' as const,
      },

      // Employee has read access to products and orders
      {
        userId: employeeUser.id,
        tableId: productsTable.id,
        permission: 'read' as const,
      },
      {
        userId: employeeUser.id,
        tableId: ordersTable.id,
        permission: 'read' as const,
      },

      // John has read access to products only
      {
        userId: johnUser.id,
        tableId: productsTable.id,
        permission: 'read' as const,
      },
    ];

    await permissionRepository.save(permissions);
    console.log('Table permissions seeded successfully');
  }
}
